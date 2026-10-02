#!/usr/bin/env python3
"""Configure a private local instance and keep PostgreSQL data across restarts."""

from __future__ import annotations

import argparse
import getpass
import os
import re
import secrets
import shlex
import shutil
import socket
import subprocess
import sys
from pathlib import Path

from dotenv import dotenv_values, set_key

ROOT = Path(__file__).resolve().parents[2]
DATA_DIRECTORY = ".dev_pg"


class SetupError(RuntimeError):
    pass


def read_environment(root: Path) -> dict[str, str]:
    return {key: value for key, value in dotenv_values(root / ".env").items() if value is not None}


def configure_environment(root: Path) -> dict[str, str]:
    path = root / ".env"
    new = not path.exists()
    if new:
        shutil.copyfile(root / ".env.example", path)
    environment = read_environment(root)
    updates = {}
    if new:
        updates.update(
            {
                "POSTGRES_HOST": "127.0.0.1",
                "POSTGRES_PORT": "55432",
                "POSTGRES_USER": getpass.getuser(),
                "POSTGRES_PASSWORD": "",
                "ESSAYCOACH_APP_URL": "http://127.0.0.1:5100",
            }
        )
    if (
        not environment.get("DJANGO_SECRET_KEY")
        or environment["DJANGO_SECRET_KEY"] == "generate-a-unique-local-secret-before-starting"
    ):
        updates["DJANGO_SECRET_KEY"] = secrets.token_urlsafe(48)
    for key, value in updates.items():
        set_key(path, key, value)
        environment[key] = value
    path.chmod(0o600)
    frontend_path = root / "frontend" / ".env.local"
    frontend_path.touch(exist_ok=True)
    # The proxy verifies Django's signed tokens. Both servers must use the same secret.
    for key, value in {
        "JWT_SECRET": environment["DJANGO_SECRET_KEY"],
        "NEXT_PUBLIC_API_URL": environment.get("NEXT_PUBLIC_API_URL", "http://127.0.0.1:8000"),
        "NEXT_PUBLIC_SENTRY_DISABLED": "true",
    }.items():
        set_key(frontend_path, key, value)
    frontend_path.chmod(0o600)
    return environment


def postgres_bin(environment: dict[str, str], major: str | None = None) -> Path:
    candidates = []
    if environment.get("POSTGRES_BIN"):
        candidates.append(Path(environment["POSTGRES_BIN"]))
    if shutil.which("pg_ctl"):
        candidates.append(Path(shutil.which("pg_ctl") or "").parent)
    for version in [major] if major else ["17", "16", "18"]:
        for prefix in ("/opt/homebrew/opt", "/usr/local/opt"):
            candidates.append(Path(prefix) / f"postgresql@{version}" / "bin")
    for candidate in candidates:
        if not all(
            (candidate / name).is_file() for name in ("pg_ctl", "initdb", "psql", "createdb")
        ):
            continue
        version_output = subprocess.run(
            [str(candidate / "pg_ctl"), "--version"], capture_output=True, text=True, check=True
        ).stdout
        match = re.search(r"\b(\d+)\.\d+", version_output)
        if match is None:
            continue
        version = match.group(1)
        if int(version) >= 16 and (major is None or version == major):
            return candidate
    suffix = f" matching the existing data's version {major}" if major else " 16 or newer"
    raise SetupError(
        f"PostgreSQL{suffix} was not found. "
        "Install it or set POSTGRES_BIN to its bin directory in .env."
    )


def command_environment(environment: dict[str, str]) -> dict[str, str]:
    values = os.environ.copy()
    values.update(environment)
    values["PGPASSWORD"] = environment.get("POSTGRES_PASSWORD", "")
    values["PGCONNECT_TIMEOUT"] = "5"
    return values


def database_connection(environment: dict[str, str]) -> list[str]:
    host = environment.get("POSTGRES_HOST", "127.0.0.1")
    if host not in ("127.0.0.1", "localhost"):
        raise SetupError(
            "The local database command requires POSTGRES_HOST=127.0.0.1 or localhost."
        )
    port = environment.get("POSTGRES_PORT", "55432")
    if not port.isdigit() or not 1 <= int(port) <= 65535:
        raise SetupError("POSTGRES_PORT must be a port number between 1 and 65535.")
    user = environment.get("POSTGRES_USER", getpass.getuser())
    return ["-h", "127.0.0.1", "-p", port, "-U", user]


def running(binary: Path, data: Path) -> bool:
    return (
        subprocess.run(
            [str(binary / "pg_ctl"), "-D", str(data), "status"],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        ).returncode
        == 0
    )


def running_database_port(data: Path) -> str:
    """Read PostgreSQL's authoritative listener port for a running data directory."""
    try:
        lines = (data / "postmaster.pid").read_text(encoding="utf-8").splitlines()
        port = lines[3].strip()
    except (OSError, IndexError) as exc:
        raise SetupError(
            f"{data} is running but its postmaster.pid port could not be read; "
            "the configured database was left untouched."
        ) from exc
    if not port.isdigit() or not 1 <= int(port) <= 65535:
        raise SetupError(
            f"{data} is running but its postmaster.pid has an invalid port; "
            "the configured database was left untouched."
        )
    return port


def start_database(root: Path, environment: dict[str, str]) -> None:
    connection = database_connection(environment)
    data = root / DATA_DIRECTORY
    major = (data / "PG_VERSION").read_text().strip() if (data / "PG_VERSION").exists() else None
    binary = postgres_bin(environment, major)
    process_environment = command_environment(environment)
    is_running = running(binary, data)
    actual_port = running_database_port(data) if is_running else None
    if actual_port != connection[3] and actual_port is not None:
        raise SetupError(
            f"{data} is already running on port {actual_port}, "
            f"but POSTGRES_PORT is {connection[3]}. Stop it or restore the matching configuration; "
            "the configured database was left untouched."
        )
    if not is_running:
        # A listener may belong to another project. Never stop or replace it.
        with socket.socket() as client:
            client.settimeout(0.5)
            if client.connect_ex(("127.0.0.1", int(connection[3]))) == 0:
                raise SetupError(
                    f"Port {connection[3]} is already in use. "
                    "Choose another POSTGRES_PORT; the existing service was left running."
                )
        if not major:
            if data.exists() and any(data.iterdir()):
                raise SetupError(
                    f"{data} is not an initialized PostgreSQL directory. "
                    "Preserve it and investigate before initializing."
                )
            subprocess.run(
                [
                    str(binary / "initdb"),
                    "-D",
                    str(data),
                    "-U",
                    connection[5],
                    "--auth-local=trust",
                    "--auth-host=trust",
                    "--encoding=UTF8",
                ],
                env=process_environment,
                check=True,
                stdout=subprocess.DEVNULL,
            )
        socket_directory = data / "sockets"
        socket_directory.mkdir(exist_ok=True)
        options = shlex.join(["-h", "127.0.0.1", "-p", connection[3], "-k", str(socket_directory)])
        subprocess.run(
            [
                str(binary / "pg_ctl"),
                "-D",
                str(data),
                "-l",
                str(data / "server.log"),
                "-o",
                options,
                "-w",
                "start",
            ],
            env=process_environment,
            check=True,
        )
    database = environment.get("POSTGRES_DB", "essaycoach")
    # psql's quoted variable substitution treats the configured database as a value.
    exists = subprocess.run(
        [str(binary / "psql"), *connection, "-d", "postgres", "-At", "-v", "ON_ERROR_STOP=1"],
        input="SELECT datname FROM pg_database;\n",
        env=process_environment,
        check=True,
        capture_output=True,
        text=True,
    ).stdout.splitlines()
    if database not in exists:
        subprocess.run(
            [str(binary / "createdb"), *connection, "--", database],
            env=process_environment,
            check=True,
        )
    print(f"PostgreSQL ready at 127.0.0.1:{connection[3]}; data is saved in {data}")


def stop_database(root: Path, environment: dict[str, str]) -> None:
    data = root / DATA_DIRECTORY
    if not (data / "PG_VERSION").exists():
        print("No project-owned local database to stop.")
        return
    binary = postgres_bin(environment, (data / "PG_VERSION").read_text().strip())
    if running(binary, data):
        subprocess.run(
            [str(binary / "pg_ctl"), "-D", str(data), "-m", "fast", "-w", "stop"], check=True
        )
    print(f"Database stopped; saved data remains in {data}")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("action", choices=["setup", "db-start", "db-stop"])
    parser.add_argument(
        "--demo",
        action="store_true",
        help="Setup only: create the explicit local demonstration accounts",
    )
    args = parser.parse_args()
    try:
        if args.action == "setup":
            environment = configure_environment(ROOT)
            start_database(ROOT, environment)
            process_environment = command_environment(environment)
            subprocess.run(
                [sys.executable, "manage.py", "migrate", "--noinput"],
                cwd=ROOT / "backend",
                env=process_environment,
                check=True,
            )
            if args.demo:
                subprocess.run(
                    [sys.executable, "manage.py", "seed_db"],
                    cwd=ROOT / "backend",
                    env=process_environment,
                    check=True,
                )
            print(
                "Local configuration is ready. Run make dev-local, then open http://127.0.0.1:5100."
            )
        else:
            if not (ROOT / ".env").exists():
                raise SetupError("Run make local-setup first to create the local configuration.")
            environment = read_environment(ROOT)
            if args.action == "db-start":
                start_database(ROOT, environment)
            else:
                stop_database(ROOT, environment)
        return 0
    except (SetupError, subprocess.CalledProcessError, OSError) as exc:
        print(f"Local setup failed: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())

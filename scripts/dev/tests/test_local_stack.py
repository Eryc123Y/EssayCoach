"""Configuration preservation and safe local PostgreSQL startup."""

import importlib.util
import subprocess
from pathlib import Path
from unittest.mock import ANY

import pytest
from dotenv import dotenv_values

SCRIPT = Path(__file__).resolve().parents[1] / "local-stack.py"
spec = importlib.util.spec_from_file_location("local_stack", SCRIPT)
assert spec is not None and spec.loader is not None
local_stack = importlib.util.module_from_spec(spec)
spec.loader.exec_module(local_stack)


@pytest.fixture
def root(tmp_path):
    (tmp_path / "frontend").mkdir()
    (tmp_path / ".env.example").write_text(
        "DJANGO_SECRET_KEY=generate-a-unique-local-secret-before-starting\n"
        "POSTGRES_DB=essaycoach\nPOSTGRES_USER=postgres\nPOSTGRES_PORT=5432\n"
    )
    return tmp_path


def test_fresh_setup_shares_a_private_secret_and_persists_it(root):
    first = local_stack.configure_environment(root)
    second = local_stack.configure_environment(root)
    frontend = dotenv_values(root / "frontend" / ".env.local")
    assert first == second
    assert first["POSTGRES_PORT"] == "55432"
    assert len(first["DJANGO_SECRET_KEY"]) >= 48
    assert frontend["JWT_SECRET"] == first["DJANGO_SECRET_KEY"]
    assert (root / ".env").stat().st_mode & 0o777 == 0o600
    assert (root / "frontend" / ".env.local").stat().st_mode & 0o777 == 0o600


def test_existing_database_settings_and_unrelated_frontend_options_are_preserved(root):
    (root / ".env").write_text(
        "DJANGO_SECRET_KEY=existing-local-secret\nPOSTGRES_DB=existing_db\n"
        "POSTGRES_USER=existing_user\nPOSTGRES_PORT=55433\n"
    )
    (root / "frontend" / ".env.local").write_text("CUSTOM_SETTING=kept\n")
    environment = local_stack.configure_environment(root)
    assert environment["POSTGRES_DB"] == "existing_db"
    assert environment["POSTGRES_USER"] == "existing_user"
    assert environment["POSTGRES_PORT"] == "55433"
    assert environment["DJANGO_SECRET_KEY"] == "existing-local-secret"
    assert dotenv_values(root / "frontend" / ".env.local")["CUSTOM_SETTING"] == "kept"


@pytest.mark.parametrize(
    "environment",
    [{"POSTGRES_HOST": "remote.example"}, {"POSTGRES_PORT": "bad"}, {"POSTGRES_PORT": "70000"}],
)
def test_local_command_rejects_invalid_connections_before_starting(environment):
    with pytest.raises(local_stack.SetupError):
        local_stack.database_connection(environment)


def test_port_in_use_is_left_running_without_initializing_a_directory(root, monkeypatch):
    calls = []
    monkeypatch.setattr(local_stack, "postgres_bin", lambda *args: Path("/fake/bin"))
    monkeypatch.setattr(local_stack, "running", lambda *args: False)

    class Listener:
        def __enter__(self):
            return self

        def __exit__(self, *args):
            return None

        def settimeout(self, seconds):
            pass

        def connect_ex(self, address):
            return 0

    monkeypatch.setattr(local_stack.socket, "socket", Listener)
    monkeypatch.setattr(local_stack.subprocess, "run", lambda *args, **kwargs: calls.append(args))
    with pytest.raises(local_stack.SetupError, match="already in use"):
        local_stack.start_database(root, {"POSTGRES_PORT": "55432"})
    assert calls == []
    assert not (root / ".dev_pg").exists()


def test_running_cluster_with_wrong_port_does_not_query_a_database(root, monkeypatch):
    data = root / ".dev_pg"
    data.mkdir()
    (data / "postmaster.pid").write_text("123\n/data\n0\n55433\n")
    calls = []
    monkeypatch.setattr(local_stack, "postgres_bin", lambda *args: Path("/fake/bin"))
    monkeypatch.setattr(local_stack, "running", lambda *args: True)
    monkeypatch.setattr(local_stack.subprocess, "run", lambda *args, **kwargs: calls.append(args))

    with pytest.raises(local_stack.SetupError, match="already running on port 55433"):
        local_stack.start_database(root, {"POSTGRES_PORT": "55432"})

    assert calls == []


def test_running_cluster_with_the_configured_port_continues_to_its_own_database(root, monkeypatch):
    data = root / ".dev_pg"
    data.mkdir()
    (data / "postmaster.pid").write_text("123\n/data\n0\n55432\n")
    calls = []
    monkeypatch.setattr(local_stack, "postgres_bin", lambda *args: Path("/fake/bin"))
    monkeypatch.setattr(local_stack, "running", lambda *args: True)

    def completed(args, **kwargs):
        calls.append(args)
        return subprocess.CompletedProcess(args, 0, "essaycoach\n")

    monkeypatch.setattr(local_stack.subprocess, "run", completed)
    local_stack.start_database(root, {"POSTGRES_PORT": "55432"})

    expected = [
        "/fake/bin/psql", "-h", "127.0.0.1", "-p", "55432", "-U", ANY,
        "-d", "postgres", "-At", "-v", "ON_ERROR_STOP=1",
    ]
    assert calls == [expected]


def test_postgres_version_accepts_homebrew_suffix(root, monkeypatch):
    binary = root / "bin"
    binary.mkdir()
    for name in ("pg_ctl", "initdb", "psql", "createdb"):
        (binary / name).touch()
    monkeypatch.setattr(local_stack.shutil, "which", lambda name: None)
    monkeypatch.setattr(
        local_stack.subprocess,
        "run",
        lambda *args, **kwargs: subprocess.CompletedProcess(
            args, 0, "pg_ctl (PostgreSQL) 17.11 (Homebrew)\n"
        ),
    )
    assert local_stack.postgres_bin({"POSTGRES_BIN": str(binary)}, "17") == binary


def test_wrong_postgres_version_does_not_open_existing_data(root, monkeypatch):
    binary = root / "bin"
    binary.mkdir()
    for name in ("pg_ctl", "initdb", "psql", "createdb"):
        (binary / name).touch()
    monkeypatch.setattr(local_stack.shutil, "which", lambda name: None)
    original_is_file = Path.is_file
    monkeypatch.setattr(
        Path, "is_file", lambda path: original_is_file(path) if path.is_relative_to(root) else False
    )
    monkeypatch.setattr(
        local_stack.subprocess,
        "run",
        lambda *args, **kwargs: subprocess.CompletedProcess(args, 0, "pg_ctl (PostgreSQL) 16.9\n"),
    )
    with pytest.raises(local_stack.SetupError, match="existing data's version 17"):
        local_stack.postgres_bin({"POSTGRES_BIN": str(binary)}, "17")

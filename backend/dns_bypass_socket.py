"""
Simple DNS bypass for SiliconFlow API using raw sockets.
This bypasses broken DNS resolution by connecting directly to the known IP address.
"""

import json
import os
import socket
import ssl
from typing import Any

# Known IP addresses for APIs with DNS resolution issues
KNOWN_HOSTS = {
    "api.siliconflow.ai": "104.21.13.193",
}


def make_http_request(
    hostname: str,
    path: str,
    ip_address: str,
    port: int = 443,
    method: str = "GET",
    headers: dict[str, str] | None = None,
    body: str | None = None,
    timeout: float = 30.0,
) -> dict[str, Any]:
    """
    Make an HTTP request using raw socket connection.

    Args:
        hostname: The original hostname (for SNI and Host header)
        path: The request path
        ip_address: The IP address to connect to
        port: The port number (default 443 for HTTPS)
        method: HTTP method (GET, POST, etc.)
        headers: Additional headers
        body: Request body for POST/PUT requests
        timeout: Connection timeout in seconds

    Returns:
        Dict with status_code, headers, and body
    """
    # Create socket
    sock = socket.create_connection((ip_address, port), timeout=timeout)

    # Create SSL context with proper SNI
    context = ssl.create_default_context()
    context.set_alpn_protocols(["http/1.1"])

    # Wrap socket with SSL
    secure_sock = context.wrap_socket(sock, server_hostname=hostname)

    # Build HTTP request
    headers = headers or {}
    headers.setdefault("Host", hostname)
    headers.setdefault("User-Agent", "EssayCoach/1.0")
    if body:
        headers.setdefault("Content-Type", "application/json")
        headers["Content-Length"] = str(len(body))

    header_lines = "\r\n".join(f"{k}: {v}" for k, v in headers.items())

    request = f"{method} {path} HTTP/1.1\r\n{header_lines}\r\n\r\n"
    if body:
        request += body

    # Send request
    secure_sock.sendall(request.encode("utf-8"))

    # Receive response
    response_data = b""
    while True:
        try:
            chunk = secure_sock.recv(4096)
            if not chunk:
                break
            response_data += chunk
        except TimeoutError:
            break

    # Close connection
    secure_sock.close()

    # Parse response
    response_str = response_data.decode("utf-8", errors="replace")

    # Split headers and body
    if "\r\n\r\n" in response_str:
        header_part, body = response_str.split("\r\n\r\n", 1)
    else:
        header_part = response_str
        body = ""

    # Parse status line
    status_line = header_part.split("\r\n")[0]
    parts = status_line.split(" ", 2)
    http_version = parts[0]
    status_code = int(parts[1])
    status_message = parts[2] if len(parts) > 2 else ""

    # Parse response headers
    response_headers = {}
    for line in header_part.split("\r\n")[1:]:
        if ":" in line:
            key, value = line.split(":", 1)
            response_headers[key.strip().lower()] = value.strip()

    return {
        "status_code": status_code,
        "headers": response_headers,
        "body": body,
        "http_version": http_version,
        "status_message": status_message,
    }


def siliconflow_request(
    endpoint: str,
    api_key: str,
    method: str = "GET",
    body: dict[str, Any] | None = None,
    timeout: float = 30.0,
) -> dict[str, Any]:
    """
    Make a request to the SiliconFlow API.

    Args:
        endpoint: API endpoint (e.g., "/v1/models", "/v1/chat/completions")
        api_key: SiliconFlow API key
        method: HTTP method
        body: Request body for POST/PUT
        timeout: Request timeout

    Returns:
        Dict with status_code and response body
    """
    hostname = "api.siliconflow.ai"
    ip = KNOWN_HOSTS.get(hostname)

    if not ip:
        raise ValueError(f"No known IP for hostname: {hostname}")

    # Build headers
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Accept": "application/json",
    }

    # Add body if present
    body_str = None
    if body:
        body_str = json.dumps(body)

    # Make request
    response = make_http_request(
        hostname=hostname,
        path=endpoint,
        ip_address=ip,
        port=443,
        method=method,
        headers=headers,
        body=body_str,
        timeout=timeout,
    )

    return response


# For testing
if __name__ == "__main__":
    from dotenv import load_dotenv

    load_dotenv("/Users/eric/Documents/GitHub/EssayCoach/.env")
    api_key = os.environ.get("SILICONFLOW_API_KEY")

    print("Testing SiliconFlow API with raw socket...")
    print(f"Known hosts: {KNOWN_HOSTS}")

    # Test 1: List models
    print("\n1. Listing models...")
    response = siliconflow_request("/v1/models", api_key)
    print(f"   Status: {response['status_code']}")
    print(f"   Body: {response['body'][:300]}")

    # Test 2: Chat completions (POST)
    print("\n2. Testing chat completions...")
    body = {
        "model": "deepseek-ai/DeepSeek-V3-Llama-3.1-70B-Instruct-Turbo",
        "messages": [{"role": "user", "content": "Hello, are you working?"}],
        "max_tokens": 50,
    }
    response = siliconflow_request(
        "/v1/chat/completions", api_key, method="POST", body=body
    )
    print(f"   Status: {response['status_code']}")
    print(f"   Body: {response['body'][:300]}")

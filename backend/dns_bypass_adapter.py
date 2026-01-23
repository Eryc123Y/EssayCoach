"""
Custom HTTP adapter for requests library that bypasses broken DNS.
This adapter resolves api.siliconflow.ai to a known working IP address with proper SNI handling.
"""

import socket
import ssl

import requests
from requests.adapters import HTTPAdapter
from urllib3.poolmanager import PoolManager

# Known IP addresses for APIs with DNS resolution issues
KNOWN_HOSTS = {
    "api.siliconflow.ai": "104.21.13.193",
}


class SNIBypassPoolManager(PoolManager):
    """
    Custom pool manager that handles SNI properly for DNS bypass.
    """

    def __init__(self, known_hosts=None, **kwargs):
        self.known_hosts = known_hosts or KNOWN_HOSTS
        super().__init__(**kwargs)

    def connection_from_pool_key(self, pool_key):
        """Handle connection creation with proper SNI."""
        # Get the actual hostname from the pool key
        scheme = pool_key.key_scheme
        hostname = pool_key.key_host
        port = pool_key.key_port

        # Check if this is a known host
        if hostname in self.known_hosts:
            resolved_ip = self.known_hosts[hostname]

            # Create a connection to the IP but with proper SNI
            return self._make_custom_connection(hostname, resolved_ip, port, scheme)

        return super().connection_from_pool_key(pool_key)

    def _make_custom_connection(self, hostname, ip, port, scheme):
        """Create a connection with proper SNI."""
        from urllib3.util.retry import Retry
        from urllib3.util.timeout import Timeout

        # Create SSL context with proper SNI
        ssl_context = ssl.create_default_context()
        ssl_context.set_alpn_protocols(["http/1.1"])

        # Create socket with SSL
        conn = socket.create_connection((ip, port), timeout=Timeout())
        sock = ssl_context.wrap_socket(
            conn,
            server_hostname=hostname,  # Critical for SNI!
        )

        # Create the connection object
        from urllib3.connection import HTTPSConnection

        connection = HTTPSConnection(
            host=hostname,  # Use original hostname
            port=port,
            source_address=None,
            socket=sock,
            timeout=Timeout(),
            retries=Retry(total=0),
            _pool=self,
        )

        # Store the actual connection info
        connection._dns_name = hostname

        return connection


class DNSBypassAdapter(HTTPAdapter):
    """
    Custom HTTP adapter that bypasses broken DNS resolution.
    """

    def __init__(self, known_hosts=None, *args, **kwargs):
        self.known_hosts = known_hosts or KNOWN_HOSTS
        super().__init__(*args, **kwargs)

    def init_poolmanager(self, connections, maxsize, block=False, **pool_kwargs):
        """Initialize the pool manager with our custom version."""
        self.poolmanager = SNIBypassPoolManager(
            num_pools=connections,
            maxsize=maxsize,
            block=block,
            known_hosts=self.known_hosts,
            **pool_kwargs,
        )


def create_session_with_dns_bypass() -> requests.Session:
    """
    Create a requests session with DNS bypass for known hosts.
    """
    session = requests.Session()
    adapter = DNSBypassAdapter()
    session.mount("https://", adapter)
    return session


# Alternative: Simple function that works with any session
def make_request_with_dns_bypass(url, **kwargs):
    """
    Make a request with DNS bypass for known hosts.

    Args:
        url: The URL to request
        **kwargs: Additional arguments for requests.get()

    Returns:
        Response object
    """
    from urllib.parse import urlparse

    parsed = urlparse(url)
    hostname = parsed.hostname

    if hostname in KNOWN_HOSTS:
        resolved_ip = KNOWN_HOSTS[hostname]

        # Modify URL to use IP
        new_url = url.replace(f"https://{hostname}", f"https://{resolved_ip}")

        # Add Host header for proper SNI
        kwargs.setdefault("headers", {})
        kwargs["headers"]["Host"] = hostname

        # Make the request
        response = requests.get(new_url, **kwargs)
        return response

    # Normal request
    return requests.get(url, **kwargs)


# For testing
if __name__ == "__main__":
    import os

    from dotenv import load_dotenv

    load_dotenv("/Users/eric/Documents/GitHub/EssayCoach/.env")

    print("Testing SiliconFlow API with DNS bypass...")
    print(f"Known hosts: {KNOWN_HOSTS}")

    # Test 1: Using custom session
    print("\n1. Testing with custom session...")
    try:
        session = create_session_with_dns_bypass()
        response = session.get(
            "https://api.siliconflow.ai/v1/models",
            headers={
                "Authorization": f"Bearer {os.environ.get('SILICONFLOW_API_KEY')}",
                "Content-Type": "application/json",
            },
            timeout=30,
        )
        print(f"✓ Status: {response.status_code}")
        print(f"✓ Response: {response.text[:300]}")
    except Exception as e:
        print(f"✗ Error: {e}")

    # Test 2: Using direct function
    print("\n2. Testing with direct function...")
    try:
        response = make_request_with_dns_bypass(
            "https://api.siliconflow.ai/v1/models",
            headers={
                "Authorization": f"Bearer {os.environ.get('SILICONFLOW_API_KEY')}",
                "Content-Type": "application/json",
            },
            timeout=30,
        )
        print(f"✓ Status: {response.status_code}")
        print(f"✓ Response: {response.text[:300]}")
    except Exception as e:
        print(f"✗ Error: {e}")

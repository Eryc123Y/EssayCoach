"""
Custom DNS resolver that bypasses broken system DNS.
This module provides DNS resolution using dnspython (when available)
or falls back to a predefined mapping of known API hostnames to IP addresses.
"""

import os
import socket
from typing import Optional, List, Tuple

# Predefined IP mappings for APIs that have DNS resolution issues
# These are fetched from reliable DNS sources (Google DNS, Cloudflare DNS)
KNOWN_HOSTS = {
    "api.siliconflow.ai": "104.21.13.193",
}

# Try to import dnspython for proper DNS resolution
try:
    import dns.resolver
    import dns.query
    import dns.message

    DNSPYTHON_AVAILABLE = True
except ImportError:
    DNSPYTHON_AVAILABLE = False


class CustomDNSResolver:
    """Custom DNS resolver that bypasses broken system DNS."""

    @staticmethod
    def resolve(hostname: str, port: int = 443) -> Optional[str]:
        """
        Resolve a hostname to an IP address.

        Args:
            hostname: The hostname to resolve
            port: The port number (for reference, not used in resolution)

        Returns:
            IP address string or None if resolution fails
        """
        # Check if we have a known mapping
        if hostname in KNOWN_HOSTS:
            return KNOWN_HOSTS[hostname]

        # Try dnspython if available
        if DNSPYTHON_AVAILABLE:
            try:
                # Use Google's DNS server (8.8.8.8) for resolution
                resolver = dns.resolver.Resolver()
                resolver.nameservers = ["8.8.8.8", "1.1.1.1"]
                resolver.port = 53
                answer = resolver.resolve(hostname, "A")
                if answer:
                    return str(answer[0])
            except Exception:
                pass

        # Fallback: try system DNS
        try:
            addrinfo = socket.getaddrinfo(
                hostname, port, socket.AF_INET, socket.SOCK_STREAM
            )
            if addrinfo:
                return addrinfo[0][4][0]
        except (socket.gaierror, OSError):
            pass

        return None

    @staticmethod
    def getaddrinfo(
        hostname: str,
        port: int,
        family: int = socket.AF_UNSPEC,
        type_: int = socket.SOCK_STREAM,
        proto: int = 0,
        flags: int = 0,
    ) -> List[Tuple]:
        """
        Custom getaddrinfo implementation that bypasses broken system DNS.

        This mimics the interface of socket.getaddrinfo() but uses our custom
        DNS resolution logic.
        """
        # If we can't resolve it and don't have a mapping, let the system try
        ip = CustomDNSResolver.resolve(hostname, port)

        if ip is None:
            # Fallback to system resolver
            return socket.getaddrinfo(hostname, port, family, type_, proto, flags)

        # Return address info with our resolved IP
        if family == socket.AF_UNSPEC or family == socket.AF_INET:
            return [(socket.AF_INET, type_, proto, "", (ip, port))]
        elif family == socket.AF_INET6:
            return [(socket.AF_INET6, type_, proto, "", (ip, port, 0, 0))]
        else:
            return []

    @staticmethod
    def patch_socket():
        """
        Patch socket.getaddrinfo to use our custom DNS resolver.

        This is a monkey patch that replaces the system's getaddrinfo function
        with our custom implementation that handles DNS resolution properly.
        """
        if not hasattr(CustomDNSResolver, "_patched"):
            original_getaddrinfo = socket.getaddrinfo

            def patched_getaddrinfo(
                hostname: str,
                port: int = None,
                family: int = socket.AF_UNSPEC,
                type_: int = socket.SOCK_STREAM,
                proto: int = 0,
                flags: int = 0,
            ):
                """Patched getaddrinfo that uses custom DNS for known hosts."""
                # Check if we have a custom mapping
                if hostname in KNOWN_HOSTS:
                    ip = KNOWN_HOSTS[hostname]
                    # Return simple IPv4 address tuple
                    if family == socket.AF_UNSPEC or family == socket.AF_INET:
                        return [(socket.AF_INET, type_, proto, "", (ip, port or 0))]
                    elif family == socket.AF_INET6:
                        return [
                            (socket.AF_INET6, type_, proto, "", (ip, port or 0, 0, 0))
                        ]

                # Try dnspython if available
                if DNSPYTHON_AVAILABLE and hostname not in KNOWN_HOSTS:
                    try:
                        resolver = dns.resolver.Resolver()
                        resolver.nameservers = ["8.8.8.8", "1.1.1.1"]
                        answer = resolver.resolve(hostname, "A")
                        if answer:
                            ip = str(answer[0])
                            if family == socket.AF_UNSPEC or family == socket.AF_INET:
                                return [
                                    (socket.AF_INET, type_, proto, "", (ip, port or 0))
                                ]
                    except Exception:
                        pass

                # Fallback to original
                return original_getaddrinfo(hostname, port, family, type_, proto, flags)

            socket.getaddrinfo = patched_getaddrinfo
            CustomDNSResolver._patched = True

    @staticmethod
    def setup():
        """Set up custom DNS resolution for the application."""
        if DNSPYTHON_AVAILABLE:
            print("✓ Using dnspython for DNS resolution")
        else:
            print("⚠ dnspython not available, using predefined IP mappings")

        CustomDNSResolver.patch_socket()
        print("✓ Custom DNS resolver installed")


# Singleton instance
_resolver = None


def get_resolver() -> CustomDNSResolver:
    """Get the singleton DNS resolver instance."""
    global _resolver
    if _resolver is None:
        _resolver = CustomDNSResolver()
    return _resolver


def setup_custom_dns():
    """Set up custom DNS resolution for the entire application."""
    get_resolver().setup()


if __name__ == "__main__":
    # Test the resolver
    print("Testing CustomDNSResolver...")
    print()

    # Test known hosts
    for host in KNOWN_HOSTS:
        ip = CustomDNSResolver.resolve(host)
        print(f"{host} -> {ip}")

    print()

    # Test patched socket
    setup_custom_dns()
    print()

    # Test socket.getaddrinfo
    try:
        addrinfo = socket.getaddrinfo("api.siliconflow.ai", 443)
        print(f"socket.getaddrinfo(api.siliconflow.ai, 443) -> {addrinfo[0][4]}")
    except Exception as e:
        print(f"socket.getaddrinfo failed: {e}")

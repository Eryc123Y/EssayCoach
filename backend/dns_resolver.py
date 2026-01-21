"""IPv4 DNS resolver to fix DNS resolution issues with local router."""

import socket
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    pass


class IPv4Resolver:
    """Force IPv4-only DNS resolution to avoid IPv6/IPv4 conflicts.

    This is a workaround for local routers (like 192.168.1.1) that cannot
    resolve external domains properly due to IPv6 DNS configuration issues.
    """

    @staticmethod
    def resolve_ipv4(host: str, port: int = 443) -> str | None:
        """Resolve hostname to IPv4 address only.

        Args:
            host: The hostname to resolve
            port: The port number

        Returns:
            IPv4 address as string (e.g., "1.2.3.4"), or None if resolution fails
        """
        try:
            # Force IPv4 by using socket.AF_INET constant
            addrinfo = socket.getaddrinfo(
                host, port, socket.AF_INET, socket.SOCK_STREAM
            )
            if addrinfo and addrinfo[0]:
                return addrinfo[0][4]  # Return IPv4 address
        except (socket.gaierror, OSError):
            return None

    @staticmethod
    def patch_socket():
        """Monkey-patch socket.getaddrinfo to use IPv4 by default.

        This ensures all DNS resolution in the application uses IPv4 only,
        avoiding conflicts with local router's IPv6 DNS configuration.
        """
        original_getaddrinfo = socket.getaddrinfo

        def patched_getaddrinfo(
            host: str,
            port: int | None = None,
            family: int = 0,
            type: int = 0,
            proto: int = 0,
            flags: int = 0,
        ):
            """Patched version of socket.getaddrinfo that forces IPv4.

            If family is not explicitly specified (0), default to AF_INET (IPv4).
            This prevents the system from trying IPv6 resolution first.
            """
            # If family is 0 (default), force IPv4
            if family == 0:
                family = socket.AF_INET

            return original_getaddrinfo(host, port, family, type, proto, flags)

        # Apply the patch
        socket.getaddrinfo = patched_getaddrinfo

    @staticmethod
    def check_ipv4_resolution(host: str, port: int = 443) -> bool:
        """Check if IPv4 resolution is available for a host.

        Args:
            host: The hostname to check
            port: The port number

        Returns:
            True if IPv4 resolution succeeds, False otherwise
        """
        ip_address = IPv4Resolver.resolve_ipv4(host, port)
        return ip_address is not None

    @staticmethod
    def get_diagnostics(host: str, port: int = 443) -> dict[str, str]:
        """Get diagnostic DNS resolution information.

        Args:
            host: The hostname to diagnose
            port: The port number

        Returns:
            Dictionary with diagnostic information
        """
        diagnostics = {
            "host": host,
            "port": port,
        }

        # Try IPv4 resolution
        ipv4_address = IPv4Resolver.resolve_ipv4(host, port)
        diagnostics["ipv4_resolution"] = ipv4_address is not None
        diagnostics["ipv4_address"] = ipv4_address

        # Try default resolution (what the system would use)
        try:
            import socket as socket_module

            default_addrinfo = socket_module.getaddrinfo(host, port)
            if default_addrinfo and default_addrinfo[0]:
                diagnostics["default_resolution"] = True
                diagnostics["default_address"] = default_addrinfo[0][4][0]
                diagnostics["default_family"] = socket_module.AddressFamily(
                    default_addrinfo[0][0].address_family
                ).name
            else:
                diagnostics["default_resolution"] = False
        except Exception as e:
            diagnostics["default_resolution"] = False
            diagnostics["default_error"] = str(e)

        return diagnostics

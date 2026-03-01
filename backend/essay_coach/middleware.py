"""
Custom middleware for handling POST requests with missing trailing slashes.

When APPEND_SLASH is True and a POST request is made to a URL without a trailing
slash that matches a URL pattern with a trailing slash, Django throws a RuntimeError.
This middleware intercepts such requests and redirects them to the URL with trailing
slash using a 307 Temporary Redirect, which preserves the POST method and body.
"""

from django.http import HttpResponseRedirect
from django.urls import get_resolver


class PostSlashRedirectMiddleware:
    """
    Middleware that handles POST requests to URLs without trailing slashes.

    When a POST request is made to a URL that doesn't end in a slash but matches
    a URL pattern that does end in a slash, this middleware redirects to the
    URL with the trailing slash using a 307 response (Temporary Redirect).

    The 307 status code preserves the request method (POST) and request body,
    allowing the request to be properly processed at the correct URL.
    """

    # Paths that should be handled with trailing slash redirects
    # These are the API endpoints that commonly receive POST requests
    POST_SLASH_PATHS = [
        "/api/v1/ai-feedback/agent/workflows/run",
        "/api/v1/ai-feedback/agent/workflows/run/",
    ]

    def __init__(self, get_response):
        self.get_response = get_response
        self.resolver = get_resolver()

    def __call__(self, request):
        # Only process POST requests
        if request.method != "POST":
            return self.get_response(request)

        path = request.path

        # Check if this path should have a trailing slash
        if path in self.POST_SLASH_PATHS:
            # Check if the path doesn't end with a slash
            if not path.endswith("/"):
                # Redirect to the same path with trailing slash
                # Use 307 to preserve POST method and body
                redirect_path = path + "/"
                return HttpResponseRedirect(redirect_path, status=307)

        return self.get_response(request)

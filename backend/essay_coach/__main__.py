#!/usr/bin/env python3
"""EssayCoach CLI entry point."""

import sys


def main():
    """Main entry point for EssayCoach CLI."""
    print("EssayCoach CLI")
    print("Usage: essaycoach <command>")
    print("")
    print("Available commands:")
    print("  runserver  - Start the development server")
    print("  migrate    - Run database migrations")
    print("  shell      - Open Django shell")
    print("  createsuperuser - Create a superuser")
    print("")
    print("For full documentation, see docs/development/")
    sys.exit(0)


if __name__ == "__main__":
    main()

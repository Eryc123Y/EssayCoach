{
  description = "A development environment for EssayCoach";

  inputs = {
    # --- Nixpkgs Source Selection ---
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
  };

  nixConfig = {
    extra-substituters = [
      "https://mirrors.sjtug.sjtu.edu.cn/nix-channels/store?priority=5"
    ];
    extra-trusted-public-keys = [
      "cache.nixos.org-1:6NCHdD59X431o0gWypbMrAURkbJ16ZPMQFGspcDShjY="
    ];
  };

  outputs = { self, nixpkgs }:
    let
      supportedSystems = [ "x86_64-linux" "aarch64-linux" "x86_64-darwin" "aarch64-darwin" ];
      forEachSupportedSystem = f: nixpkgs.lib.genAttrs supportedSystems (system: f {
        pkgs = import nixpkgs {
          inherit system;
          config = {};
          overlays = [];
        };
      });
    in
    {
      devShells = forEachSupportedSystem ({ pkgs }: {
        default = pkgs.mkShell {
          packages = with pkgs; [
            docker-compose
            docker
            # Process management for development
            overmind  # Better alternative to foreman/honcho for managing Procfiles
            # Shell enhancements
            bash-completion
            readline
            fzf
            bat
            eza
            tree
            git
            lsof  # For checking processes on ports
            # Frontend Development (Vue.js 3 + Vite)
            pnpm
            nodejs_22
            nodePackages.prettier
            nodePackages.typescript
            nodePackages.eslint
            nodePackages."@vue/language-server"
            nodePackages.concurrently

            # Backend Development (Python FastAPI + AI/ML)
            postgresql # database
            # Use python312.withPackages to ensure version consistency
            (python312.withPackages (ps: with ps; [
              django
              django-stubs
              djangorestframework
              markdown
              django-filter
              psycopg2
              django-cors-headers
              drf-spectacular
              fastapi
              uvicorn
              requests
              types-requests
              pysocks  # SOCKS5 proxy support
              pillow
              pypdf2
              flake8
              mypy
              pytest
              pytest-django
              pytest-mock
            # Documentation tools
            mkdocs
            mkdocs-material
            mkdocs-mermaid2-plugin
            mkdocs-minify-plugin
            mkdocs-git-revision-date-localized-plugin
            mkdocs-minify-plugin
            
            # DNS resolution fix
            dnspython

              pymdown-extensions
              langchain
            ]))
            black
          ];
          NIX_PYTEST_SKIP_TESTS = "1";
          shellHook = ''
            # Set proxy environment variables for external API calls
            # Clash Verge Mixed Port (7897) supports SOCKS5, which works better for HTTPS
            # Http(s) Port (7899) is HTTP proxy, may have SSL issues
            # Prefer SOCKS5 proxy via Mixed Port
            # Proxy configuration for external API calls
            # Clash Verge handles DNS resolution properly, so we don't need to bypass it
            if [ -z "$DISABLE_PROXY" ]; then
              export SOCKS_PROXY=socks5h://127.0.0.1:7897
              # Fallback to HTTP proxy if SOCKS5 not available
              export HTTPS_PROXY=http://127.0.0.1:7899
              export HTTP_PROXY=http://127.0.0.1:7899
            fi
            
            # Only bypass proxy for local development services
            export NO_PROXY=localhost,127.0.0.1

            # Load modular shell configuration
            source scripts/dev-env/bash-config.sh
            source scripts/dev-env/prompt-setup.sh
            source scripts/dev-env/aliases.sh
            source scripts/dev-env/postgres-setup.sh
            source scripts/dev-env/env-vars.sh
            source scripts/dev-env/welcome-message.sh

            # Create Procfile for managing development services
            cat > Procfile << 'PROCFILE'
backend: ./scripts/dev-env/start-backend.sh
frontend: ./scripts/dev-env/start-frontend.sh
PROCFILE
          '';
        };
      });
    };
}

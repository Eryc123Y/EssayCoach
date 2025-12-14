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
              psycopg2-binary
              django-cors-headers
              drf-spectacular
              fastapi
              uvicorn
              requests
              pillow
              flake8
              mypy
              # Documentation tools
              mkdocs
              mkdocs-material
              mkdocs-mermaid2-plugin
              mkdocs-git-revision-date-localized-plugin
              mkdocs-minify-plugin
              pymdown-extensions
              langchain
              langchain-deepseek
            ]))
            black
          ];
          shellHook = ''
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

# External Documentation References

This document provides quick links to official documentation for all external libraries and services used in the EssayCoach project.

## Table of Contents

- [Frontend Libraries](#frontend-libraries)
- [Backend Libraries](#backend-libraries)
- [External Services](#external-services)
- [Development Tools](#development-tools)

---

## Frontend Libraries

### Next.js 15
- **Official Docs**: https://nextjs.org/docs
- **API Reference**: https://nextjs.org/docs/api-reference
- **App Router**: https://nextjs.org/docs/app
- **Release Notes**: https://nextjs.org/blog

### React 19
- **Official Docs**: https://react.dev
- **API Reference**: https://react.dev/reference/react
- **Hooks**: https://react.dev/reference/react/hooks

### TypeScript
- **Official Docs**: https://www.typescriptlang.org/docs/
- **Handbook**: https://www.typescriptlang.org/docs/handbook/intro.html
- **Cheat Sheets**: https://www.typescriptlang.org/cheatsheets

### Tailwind CSS v4
- **Official Docs**: https://tailwindcss.com/docs
- **What's New in v4**: https://tailwindcss.com/blog/tailwindcss-4
- **CSS Variables**: https://tailwindcss.com/docs/theme#css-variables

### Shadcn/ui
- **Official Docs**: https://ui.shadcn.com/docs
- **Components**: https://ui.shadcn.com/docs/components
- **GitHub**: https://github.com/shadcn-ui/ui

### Framer Motion (Motion)
- **Official Docs**: https://www.framer.com/motion/
- **API Reference**: https://www.framer.com/motion/api/
- **Examples**: https://www.framer.com/motion/examples/
- **npm**: https://www.npmjs.com/package/motion

### Recharts
- **Official Docs**: https://recharts.org/en-US/
- **API Reference**: https://recharts.org/en-US/api
- **Examples**: https://recharts.org/en-US/examples
- **GitHub**: https://github.com/recharts/recharts

### Radix UI (Primitives)
- **Official Docs**: https://www.radix-ui.com/primitives
- **API Reference**: https://www.radix-ui.com/primitives/docs/overview/introduction
- **GitHub**: https://github.com/radix-ui/primitives

### Zustand
- **Official Docs**: https://zustand-demo.pmnd.rs/
- **GitHub**: https://github.com/pmndrs/zustand
- **npm**: https://www.npmjs.com/package/zustand

### React Hook Form
- **Official Docs**: https://react-hook-form.com/docs
- **API Reference**: https://react-hook-form.com/api/useform
- **Zod Integration**: https://react-hook-form.com/docs/useform/#resolver

### Zod
- **Official Docs**: https://zod.dev/
- **npm**: https://www.npmjs.com/package/zod
- **Error Handling**: https://zod.dev/ErrorHandling

### Lucide React
- **Official Docs**: https://lucide.dev/docs
- **Icons**: https://lucide.dev/icons
- **GitHub**: https://github.com/lucide-icons/lucide

### Sonner (Toast Notifications)
- **Official Docs**: https://sonner.emilkowal.ski/
- **GitHub**: https://github.com/emilkowalski/sonner
- **npm**: https://www.npmjs.com/package/sonner

### React Query (TanStack Query)
- **Official Docs**: https://tanstack.com/query/latest
- **API Reference**: https://tanstack.com/query/latest/docs/reference/useQuery
- **GitHub**: https://github.com/TanStack/query

---

## Backend Libraries

### Django 4.2
- **Official Docs**: https://docs.djangoproject.com/en/4.2/
- **Topic Guides**: https://docs.djangoproject.com/en/4.2/topics/
- **Reference**: https://docs.djangoproject.com/en/4.2/ref/

### Django REST Framework
- **Official Docs**: https://www.django-rest-framework.org/
- **API Guide**: https://www.django-rest-framework.org/api-guide/
- **Tutorial**: https://www.django-rest-framework.org/tutorial/quickstart/

### drf-spectacular (OpenAPI)
- **Official Docs**: https://drf-spectacular.readthedocs.io/
- **GitHub**: https://github.com/tfranzel/drf-spectacular

### PostgreSQL
- **Official Docs**: https://www.postgresql.org/docs/
- **Tutorial**: https://www.postgresql.org/docs/current/tutorial.html
- **psql Commands**: https://www.postgresql.org/docs/current/app-psql.html

---

## External Services

### Dify (AI Workflow Platform)
- **Official Docs**: https://docs.dify.ai/
- **API Reference**: https://docs.dify.ai/api-reference
- **Workflows**: https://docs.dify.ai/guides/workflow
- **GitHub**: https://github.com/langgenius/dify
- **Discord Community**: https://discord.gg/dify

### Dify API Endpoints Used
- **Run Workflow**: `POST /v1/workflows/run`
- **Get Run Status**: `GET /v1/workflow-runs/{workflow_run_id}`
- **File Upload**: `POST /v1/files/upload`

---

## Development Tools

### Nix
- **Official Docs**: https://nix.dev/
- **Nix Pills**: https://nixos.org/guides/nix-pills/
- **Nixpkgs**: https://nixpkgs.org/
- **Flakes**: https://nixos.wiki/wiki/Flakes

### Overmind
- **GitHub**: https://github.com/DarthSim/overmind
- **Documentation**: https://github.com/DarthSim/overmind#usage

### Docker
- **Official Docs**: https://docs.docker.com/
- **Get Started**: https://docs.docker.com/get-started/
- **Docker Compose**: https://docs.docker.com/compose/

### Kubernetes
- **Official Docs**: https://kubernetes.io/docs/home/
- **Concepts**: https://kubernetes.io/docs/concepts/
- **kubectl**: https://kubernetes.io/docs/reference/kubectl/

---

## Quick Reference Table

| Library/Service | Version | Purpose | Docs Link |
|----------------|---------|---------|-----------|
| Next.js | 15.x | React Framework | https://nextjs.org/docs |
| React | 19.x | UI Library | https://react.dev |
| Tailwind CSS | v4.x | Styling | https://tailwindcss.com/docs |
| Framer Motion | 11.x | Animations | https://www.framer.com/motion/ |
| Recharts | 2.x | Data Visualization | https://recharts.org |
| Shadcn/ui | latest | UI Components | https://ui.shadcn.com |
| Zustand | 5.x | State Management | https://zustand-demo.pmnd.rs |
| Django | 4.2 | Backend Framework | https://docs.djangoproject.com |
| DRF | 3.x | REST API | https://www.django-rest-framework.org |
| Dify | latest | AI Workflows | https://docs.dify.ai |
| PostgreSQL | 14+ | Database | https://www.postgresql.org/docs |

---

## Related Documentation

- [Architecture Overview](architecture/system-architecture.md)
- [API Specification](architecture/api-specification.md)
- [Database Design](architecture/database-design.md)
- [Development Setup](development/environment-setup.md)

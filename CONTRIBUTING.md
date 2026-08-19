# Contributing to Certo

Thanks for your interest in contributing to Certo — we appreciate it!

This document explains how to report issues, propose changes, and submit pull requests so we can review and integrate your contributions quickly.

## Code of Conduct

Be respectful and considerate. If the project adopts a separate `CODE_OF_CONDUCT.md`, follow it.

## Project Structure

```
certo/
├── src/
│   ├── backend/          # Strapi 5.x (TypeScript) — API server
│   │   ├── src/api/      # Content types: achievement, credential, profile, etc.
│   │   ├── config/       # Database, auth, CORS, plugins, logger
│   │   ├── scripts/      # Backup, restore, fresh-install
│   │   └── src/utils/    # Helpers: crypto, email, event bus
│   ├── frontend/         # Nuxt 3 (TypeScript) — Web UI
│   │   ├── pages/        # Routes and page components
│   │   ├── stores/       # Pinia auth and UI state
│   │   ├── components/   # Reusable UI components
│   │   └── api/          # HTTP client to backend
├── sdk/                  # @certo/sdk — TypeScript client library
├── cli/                  # @certo/cli — Command-line tool
├── mcp/                  # Model Context Protocol server (Claude integration)
├── helm/                 # Kubernetes Helm chart
├── docs/                 # Developer documentation (start here)
└── netlify/              # Netlify functions (OG image generation)
```

## Architecture Overview

**High-level request flow:**
```
User Browser → Nuxt Frontend → Strapi Backend
                                  ↓
                          PostgreSQL/SQLite
                                  ↓
                     Ed25519 signing (credentials)
                     JWT verification (auth)
```

**Key concepts:**
- **Achievement**: Template/definition of a badge (Open Badges 3.0 BadgeClass)
- **Credential**: Issued credential/badge awarded to a recipient (VerifiableCredential)
- **Profile**: Issuer or recipient identity (can be both)
- **Verification**: Anyone can verify a credential via the public `/credentials/:id` page
- **Revocation**: Issuer can revoke credentials; checks against revocation list
- **Event Bus**: Async webhook delivery with retries (memory or Redis backend)

**Stack:**
- **Backend**: Strapi 5.x (Node.js/TypeScript), PostgreSQL 16, Ed25519 crypto, JWT auth
- **Frontend**: Nuxt 3 (TypeScript/Vue 3), Tailwind CSS, Pinia state
- **SDK**: ESM + CommonJS, full TypeScript types
- **CLI**: Interactive CLI for issuing, verifying, backup/restore
- **Deployment**: Docker Compose (dev), Kubernetes Helm chart (prod)

## Filing Issues

- Search existing issues before opening a new one.
- **Bug reports**: Include steps to reproduce, expected vs actual behavior, environment (OS, Node version), logs/screenshots.
- **Feature requests**: Explain the problem, propose an API or UX if applicable.
- **Security issues**: Email security@schroedinger-hat.org instead of opening a public issue.

## Development Setup

### Prerequisites
- Node.js 18–22
- npm or yarn
- PostgreSQL 16 (optional; SQLite for local dev default)
- Docker (optional; for docker-compose or local Redis)

### Quick Start

**1. Clone and install**
```bash
git clone https://github.com/Schroedinger-Hat/certo.git
cd certo

# Backend
cd src/backend
npm install

# Frontend
cd ../frontend
npm install

# SDK (optional, if modifying SDK)
cd ../../sdk
npm install
```

**2. Run locally**
```bash
# Terminal 1: Backend (http://localhost:1337)
cd src/backend
npm run dev

# Terminal 2: Frontend (http://localhost:3000)
cd src/frontend
npm run dev
```

Backend defaults to SQLite at `.tmp/data.db`; frontend proxies `/api/` to backend.

**3. Initialize data**
On first backend boot, it auto-seeds:
- Admin user: `admin@certo.com` / `certo`
- Sample achievement and issuer profile
- Default permissions

**4. Access the app**
- Frontend: http://localhost:3000
- Admin panel: http://localhost:1337/admin
- API: http://localhost:1337/api

### Environment Variables

**Backend (src/backend/.env)**
```bash
DATABASE_CLIENT=sqlite                    # Or postgres, mysql
DATABASE_FILENAME=.tmp/data.db            # SQLite only
UPLOAD_PROVIDER=local                     # Or s3
EVENT_BUS_PROVIDER=memory                 # Or redis
LOG_FORMAT_JSON=false                     # Enable for structured logs
CORS_ALLOWED_ORIGINS=                     # Comma-separated origins
```

**Frontend (src/frontend/.env.local)**
```bash
NUXT_PUBLIC_API_URL=http://localhost:1337
```

### Common Commands

**Backend**
```bash
# Development
npm run dev

# Tests (Jest)
npm run test
npm run test:watch

# Linting
npm run lint

# Database migrations
npm run migrate

# Backup/restore
npm run backup
npm run restore -- --from backups/<timestamp> --yes
```

**Frontend**
```bash
# Development
npm run dev

# Tests (Vitest)
npm run test:unit
npm run test:unit:watch

# Linting
npm run lint

# Build
npm run build

# Preview built app
npm run preview
```

**SDK**
```bash
# Install locally (from /sdk)
npm link

# In another project
npm link @certo/sdk

# Tests
npm run test
```

**CLI**
```bash
# Install locally
npm link

# Try commands
certo --help
certo list achievements
certo issue --achievement-id 1 --recipient test@example.org
```

## Common Development Tasks

### Adding a new API endpoint

1. Create a new custom route in `src/backend/src/api/<type>/routes/<name>.ts`
2. Implement the controller action
3. Add permissions in `src/bootstrap/permissions-setup.ts` if needed
4. Add tests in `src/api/<type>/__tests__/`
5. Document in [docs/backend.md](./docs/backend.md)

**Example: Issue credential endpoint**
```typescript
// src/backend/src/api/credential/routes/credential-custom.ts
export default {
  routes: [
    {
      method: 'POST',
      path: '/credentials/issue',
      handler: 'api::credential.credential.issueCredential',
      config: { auth: { strategies: ['users-permissions'] } },
    },
  ],
};

// src/backend/src/api/credential/controllers/credential.ts
async issueCredential(ctx) {
  const { achievementId, recipientEmail } = ctx.request.body.data;
  // Call credential service
  const credential = await strapi.service('api::credential.credential').issue(
    { id: achievementId },
    recipientEmail,
  );
  ctx.send(credential);
}
```

### Fixing a bug in credential verification

1. Write a failing test in `src/backend/src/api/credential/services/__tests__/verification.test.ts`
2. Implement the fix in `src/backend/src/api/credential/services/verification.ts`
3. Ensure all tests pass: `npm run test`
4. Document the fix in [docs/known-issues-and-dev-notes.md](./docs/known-issues-and-dev-notes.md)

### Adding a new CLI command

1. Create new file in `cli/src/commands/<CommandName>.tsx`
2. Extend `cli/src/App.tsx` to register the command
3. Test with `npm run dev` in `/cli`
4. Document in [docs/README.md](./docs/README.md)

## Tests & CI

- Backend: Jest, run via `npm run test`
- Frontend: Vitest, run via `npm run test:unit`
- CI runs on every PR push (GitHub Actions)
- Add or update tests where applicable before submitting a PR
- Aim for >80% coverage on critical paths (credential issuance, verification)

## Branching & Pull Requests

- Work on a feature branch, not `main`:
  - Example: `git checkout -b feat/issue-123-descriptive-name`
- Keep changes focused and atomic; one logical change per PR
- Make sure tests pass and linters are satisfied before opening a PR
- Use a descriptive PR title and include a short description of the change and motivation
- **No co-author trailers** in commit messages (user preference)

## Commit Messages

Use clear, imperative commit messages. Examples:

```
feat(backend): add Event Bus for async webhook delivery
fix(frontend): resolve profile form validation error
docs: update self-hosting guide for Redis configuration
chore: update dependencies
test(credential): add coverage for revocation edge cases
```

Prefer [Conventional Commits](https://www.conventionalcommits.org/) format:
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation updates
- `test` - Test additions or fixes
- `chore` - Build, dependency, or tooling changes
- `refactor` - Code restructuring without behavior change

## Documentation

- Main doc hub: [docs/README.md](./docs/README.md)
- Start with [docs/overview.md](./docs/overview.md) and [docs/architecture.md](./docs/architecture.md)
- API details: [docs/backend.md](./docs/backend.md)
- Open Badges / crypto: [docs/open-badges.md](./docs/open-badges.md)
- Self-hosting: [docs/self-hosting.md](./docs/self-hosting.md)
- Known issues: [docs/known-issues-and-dev-notes.md](./docs/known-issues-and-dev-notes.md)

When adding a feature, **update the relevant doc** as part of the PR.

## Roadmap & Priorities

See [ROADMAP.md](./ROADMAP.md) for planned work. Current priorities:
1. Phase 1 (Build Trust) — Complete
2. Phase 2 (Integrations) — In progress
3. Phase 3 (Enterprise Readiness) — Complete
4. Phase 4+ — Defined but not yet started

For large features, open a GitHub Discussion first to gather feedback and coordinate.

## Getting Help

- **Architecture questions**: Start with the [docs](./docs/) and check [known-issues-and-dev-notes.md](./docs/known-issues-and-dev-notes.md)
- **GitHub Discussions**: Use for design decisions and API questions
- **GitHub Issues**: Use for bugs and feature requests with reproducible steps
- If your change affects the build or CI, describe how you validated it.

## Reviews & feedback

- Be responsive to review comments. We may request changes or further explanation.
- Small, high-quality PRs are preferred — easier to review and merge.

## License

By contributing, you agree that your contributions will be licensed under the project's license. See the `LICENSE` file in this repository.

## Thank you

We appreciate every contribution, from bug reports to documentation fixes.

If you want help getting started, comment on an issue or open a discussion and we'll point you to a good first task.

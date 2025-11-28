# Contributing to Certo

Thanks for your interest in contributing to Certo — we appreciate it!

This document explains how to report issues, propose changes, and submit pull requests so we can review and integrate your contributions quickly.

## Code of Conduct

Be respectful and considerate. If the project adopts a separate `CODE_OF_CONDUCT.md`, follow it.

## Filing issues

- Search existing issues before opening a new one.
- For bug reports, include steps to reproduce, expected vs actual behavior, environment (OS, Node version), and relevant logs or screenshots.
- For feature requests, explain the problem you want solved and propose an API or UX if applicable.

## Development setup

This repository contains a frontend and backend. Typical commands from the repository root:

- Frontend:
  - `cd frontend`
  - `npm install`
  - `npm run dev` (or `npm run test` to run tests)
- Backend:
  - `cd src/backend`
  - `npm install`
  - `npm run dev` (or `npm test`)

Adjust commands for your package manager (yarn/pnpm) if you prefer.

## Branching & pull requests

- Work on a feature branch, not `main`:
  - Example: `git checkout -b feat/issue-123-descriptive-name`
- Keep changes focused and atomic; one logical change per PR.
- Make sure tests pass and linters are satisfied before opening a PR.
- Use a descriptive PR title and include a short description of the change and motivation.

## Commit messages

- Use clear, imperative commit messages. Example:

  `feat(api): add /v1/verify endpoint`

- Prefer Conventional Commits (feat, fix, docs, chore, refactor, test).

## Tests & CI

- Add or update tests where applicable. Run existing tests locally before submitting a PR.
- If your change affects the build or CI, describe how you validated it.

## Reviews & feedback

- Be responsive to review comments. We may request changes or further explanation.
- Small, high-quality PRs are preferred — easier to review and merge.

## License

By contributing, you agree that your contributions will be licensed under the project's license. See the `LICENSE` file in this repository.

## Thank you

We appreciate every contribution, from bug reports to documentation fixes.

If you want help getting started, comment on an issue or open a discussion and we'll point you to a good first task.

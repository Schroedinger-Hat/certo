# Security Policy

## Reporting a Vulnerability

We take the security of Certo seriously. If you believe you've found a
security vulnerability, please **do not** disclose it publicly via a GitHub
issue — instead, report it privately.

### How to report

Send an email to **hello@schroedinger-hat.org** with:

- A description of the vulnerability
- Steps to reproduce it (proof of concept is ideal)
- The affected version(s) / commit hash
- Any potential impact you've identified

You can also use the **"Report a vulnerability"** button on the
[GitHub repository's Security tab](https://github.com/Schroedinger-Hat/certo/security).

### What to expect

- We'll acknowledge receipt within 48 hours.
- We'll work on a fix and keep you informed of progress.
- Once a fix is released, we'll credit you (if you wish) in the release notes.

We ask that you allow us reasonable time to address the issue before any
public disclosure.

## Supported Versions

| Version | Supported |
|---------|-----------|
| latest  | ✅        |
| < latest | ❌       |

We always recommend running the latest tagged release or the latest commit
on `main`.

## Security-related configuration

See [docs/security.md](./docs/security.md) for:

- Current authentication / authorization posture
- Credential signing & verification
- Secrets inventory (which env vars protect what)
- Known security gaps and mitigations

## Hall of Fame

We don't currently have a disclosure history to list here. If you've
reported a vulnerability and would like to be acknowledged, let us know.
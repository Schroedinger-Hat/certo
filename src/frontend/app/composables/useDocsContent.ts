export interface DocSection {
  title: string
  description: string
  href: string
}

export interface CodeExample {
  label: string
  code: string
}

export default () => {
  const overviewCards: DocSection[] = [
    {
      title: 'Getting started',
      description: 'Install the stack, bootstrap the app, and get to a working local setup quickly.',
      href: '/docs/getting-started',
    },
    {
      title: 'Self-hosting',
      description: 'Configure environment variables, deploy with Docker or Kubernetes, and operate securely.',
      href: '/docs/self-hosting',
    },
    {
      title: 'Architecture',
      description: 'Understand the Nuxt frontend, Strapi backend, and the credential verification flow.',
      href: '/docs/architecture',
    },
    {
      title: 'Contributing',
      description: 'Learn the review flow, repo structure, and how to contribute responsibly.',
      href: '/docs/contributing',
    },
  ]

  const quickLinks: DocSection[] = [
    {
      title: 'Repository overview',
      description: 'Start from the root README and the architecture docs for the project mental model.',
      href: 'https://github.com/schroedinger-hat/certo',
    },
    {
      title: 'Docs index',
      description: 'Browse the project docs for backend, frontend, security, and standards guidance.',
      href: 'https://github.com/schroedinger-hat/certo/tree/main/docs',
    },
    {
      title: 'Contributing guide',
      description: 'Review the canonical contribution expectations before opening a PR.',
      href: 'https://github.com/schroedinger-hat/certo/blob/main/CONTRIBUTING.md',
    },
  ]

  const gettingStartedSections = [
    {
      title: 'Prerequisites',
      content: [
        'Node.js 18-22.x for local development',
        'npm 6+ for package management',
        'A running PostgreSQL instance for production-oriented local testing, or SQLite for simpler setups',
      ],
    },
    {
      title: 'Clone and install',
      content: [
        'Clone the repo and install the frontend + backend dependencies',
        'cd certo/src/frontend && npm install',
        'cd ../backend && npm install',
      ],
    },
    {
      title: 'Run the stack',
      content: [
        'Start the backend from src/backend',
        'npm run develop',
        'In another terminal, start the frontend',
        'cd src/frontend && npm run dev',
      ],
    },
  ]

  const selfHostingSections = [
    {
      title: 'Environment essentials',
      content: [
        'Set NUXT_PUBLIC_API_URL for the frontend app',
        'Set HOST, PORT, APP_KEYS, JWT_SECRET, and DATABASE settings for Strapi',
        'Configure FRONTEND_URL and any email provider variables used in credential actions',
      ],
    },
    {
      title: 'Deployment options',
      content: [
        'Docker Compose is the easiest path for local or lightweight self-hosting',
        'Helm values are available under helm/certo for Kubernetes deployments',
        'Use a reverse proxy in front of the app for TLS termination and production hardening',
      ],
    },
    {
      title: 'Operational checklist',
      content: [
        'Protect keys and secrets with a real secret manager or environment injection layer',
        'Persist uploads and database storage across restarts',
        'Review the monitoring and backup docs before exposing the stack publicly',
      ],
    },
  ]

  const contributionSections = [
    {
      title: 'Repo structure',
      content: [
        'Frontend logic lives under src/frontend',
        'Backend logic and Strapi configuration live under src/backend',
        'Project docs, architecture notes, and config guides live under docs',
      ],
    },
    {
      title: 'Before opening a PR',
      content: [
        'Read the project docs and current roadmap to confirm scope',
        'Keep changes targeted to a single problem or feature area',
        'Document any config or operational changes introduced by the patch',
      ],
    },
    {
      title: 'Validation',
      content: [
        'Run the relevant frontend unit tests',
        'Use the existing backend TypeScript checks where relevant',
        'Confirm that security-sensitive changes are documented and not silently reduced in scope',
      ],
    },
  ]

  const architectureSections = [
    {
      title: 'Frontend',
      content: [
        'Nuxt 3 provides pages, layouts, auth flows, and public-facing verification views',
        'The UI uses Vue 3, Pinia, and the project’s existing component patterns',
      ],
    },
    {
      title: 'Backend',
      content: [
        'Strapi 5 hosts the API surface, content models, and permission layer',
        'Credential issuance, verification, revocation, and proof validation are implemented there',
      ],
    },
    {
      title: 'Standards',
      content: [
        'The platform targets Open Badges 3.0 and W3C Verifiable Credentials flows',
        'The docs and roadmap make the standards goal explicit, while known issues document the current gaps',
      ],
    },
  ]

  const environmentVariables: CodeExample[] = [
    {
      label: 'Frontend',
      code: `NUXT_PUBLIC_API_URL=http://localhost:1337\nNUXT_PUBLIC_WEBSITE_URL=http://localhost:3000`,
    },
    {
      label: 'Backend',
      code: `HOST=0.0.0.0\nPORT=1337\nAPP_KEYS=your-app-keys\nJWT_SECRET=your-jwt-secret\nADMIN_JWT_SECRET=your-admin-jwt-secret\nDATABASE_CLIENT=postgres\nDATABASE_HOST=localhost`,
    },
  ]

  return {
    overviewCards,
    quickLinks,
    gettingStartedSections,
    selfHostingSections,
    contributionSections,
    architectureSections,
    environmentVariables,
  }
}

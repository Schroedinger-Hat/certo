# Certo Frontend (Nuxt 3 + Una UI)

This is the Nuxt 3 (Vue 3 + Una UI) implementation of the Certo frontend for managing digital credentials and badges using the Open Badges standard.

## Features

- **User Authentication**: Register, login, and manage user accounts
- **Badge Management**: View, issue, and manage digital badges
- **Credential Verification**: Verify Open Badges credentials using unique identifiers or JSON data
- **Certificate Management**: Import, export, and manage digital certificates
- **Dashboard**: View received and issued credentials in a unified interface
- **Responsive Design**: Works on desktop and mobile devices

## Setup Instructions

### Prerequisites

- Node.js 18.x or later
- NPM or Yarn
- A running Certo backend (Strapi) instance

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```
NUXT_PUBLIC_API_URL=http://localhost:1337
```

Replace the URL with your Strapi backend URL if different.

### Installation

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

- **/components**: Reusable Vue components
  - `BadgeCard.vue`: Card component for displaying badges
  - `CertificateCard.vue`: Card component for displaying certificates
  - `BadgeVerifier.vue`: Component for verifying badge credentials
  - `BadgeIssuanceForm.vue`: Form for issuing badges
  - `ImportCertificate.vue`: Component for importing certificates
  
- **/pages**: Nuxt pages/routes
  - `/`: Home page
  - `/login`: User login
  - `/register`: User registration
  - `/dashboard`: User dashboard for managing credentials
  - `/verify`: Verify credential tool
  - `/issue`: Issue new badges

- **/api**: API clients for communication with backend
  - `api-client.ts`: Main API client for Strapi interactions
  - `auth-client.ts`: Authentication client

- **/stores**: Pinia stores for state management
  - `auth.ts`: Authentication state

- **/types**: TypeScript type definitions
  - `openbadges.ts`: Types for Open Badges
  - `strapi.ts`: Types for Strapi API responses

- **/plugins**: Nuxt plugins
  - `api.ts`: API initialization
  - `auth.ts`: Authentication initialization

## Component Usage

### Badge Verifier

```vue
<template>
  <BadgeVerifier initialIdentifier="credential-id-here" />
</template>
```

### Certificate Card

```vue
<template>
  <CertificateCard 
    :certificate="certificate" 
    @export="handleExport" 
    @revoke="handleRevoke" 
  />
</template>
```

### Badge Issuance Form

```vue
<template>
  <BadgeIssuanceForm />
</template>
```

### Import Certificate

```vue
<template>
  <ImportCertificate @import-success="handleSuccess" />
</template>
```

## Technology Stack

- **Vue 3**: Progressive JavaScript framework
- **Nuxt 3**: Vue framework for creating universal applications
- **Una UI**: UI component library for Vue
- **Pinia**: State management
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first CSS framework

## License

This project is licensed under the GNU Affero General Public License v3.0. See the LICENSE file for details.

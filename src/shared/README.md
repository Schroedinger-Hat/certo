# Shared Module

This folder contains shared code that can be used across both frontend and backend parts of the application.

## Structure

- **api/**: API client and related utilities
  - `api-client.ts`: Core API client for communicating with the Strapi backend
  - `index.ts`: Export file

- **types/**: Type definitions
  - `openbadges.ts`: Types for Open Badges 3.0 standard
  - `strapi.ts`: Types for Strapi API responses and data models
  - `index.ts`: Export file

- **utils/**: Utility functions
  - `formatting.ts`: Text and data formatting utilities
  - `index.ts`: Export file

## Usage

### Frontend

In the frontend project, you can import from the shared module using the `@shared` path alias:

```typescript
// Import types
import { Badge, Issuer } from '@shared/types/strapi'
import { AchievementCredential } from '@shared/types/openbadges'

// Import API client
import { apiClient } from '@shared/api'

// Import utilities
import { formatDate, truncateText } from '@shared/utils'
```

### Backend

In the backend project, you can import from the shared module using relative paths:

```typescript
// Import types
import { Badge, Issuer } from '../../shared/types/strapi'
import { AchievementCredential } from '../../shared/types/openbadges'

// Import utilities
import { formatDate } from '../../shared/utils'
```

## Adding New Shared Code

When adding new shared code:

1. Place it in the appropriate subdirectory (api, types, utils)
2. Export it from the index.ts file in that directory
3. Make sure it's framework-agnostic (avoid React/Next.js or Strapi-specific code)
4. Document it with JSDoc comments
5. Consider backward compatibility

## Benefits

- **DRY (Don't Repeat Yourself)**: Avoid duplicating code between frontend and backend
- **Type Safety**: Share type definitions for consistent data structures
- **Maintainability**: Single source of truth for shared logic
- **Consistency**: Ensures consistent implementation of common functionality 
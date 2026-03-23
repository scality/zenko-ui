# zenko-ui

This is the **Zenko UI**, a React-based web frontend for the Scality Zenko multi-cloud data management platform. It provides:

- Multi-cloud data browser and management interface (`src/react/databrowser/`)
- Account and IAM management (`src/react/account/`)
- Storage location configuration (`src/react/locations/`)
- Endpoint management (`src/react/endpoint/`)
- OIDC-based authentication with React Router v7

## Tech Stack

- **React 18** with TypeScript
- **Styled Components** for styling
- **React Query** for data fetching
- **React Router v7** for routing
- **React Hook Form** + Joi for form validation
- **Rspack** (with Module Federation) for bundling
- **Biome** for linting/formatting
- **Jest** + React Testing Library for tests
- **Scality internal deps**: `@scality/core-ui`, `@scality/module-federation`, `@scality/data-browser-library`, `zenkoclient`

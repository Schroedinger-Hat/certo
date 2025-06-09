# Strapi TypeScript Backend

This is a Strapi TypeScript backend for the Certo application.

## Features

- Custom content types (Products, Categories)
- TypeScript support
- Custom services and controllers
- Enhanced file upload service
- Custom middleware
- Admin panel customization

## API Endpoints

### Products

- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get a specific product
- `GET /api/products/featured` - Get featured products
- `POST /api/products` - Create a new product
- `PUT /api/products/:id` - Update a product
- `DELETE /api/products/:id` - Delete a product

### Categories

- `GET /api/categories` - Get all categories
- `GET /api/categories/:id` - Get a specific category
- `GET /api/categories/:id/products` - Get a category with all its products
- `POST /api/categories` - Create a new category
- `PUT /api/categories/:id` - Update a category
- `DELETE /api/categories/:id` - Delete a category

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm >= 6.0.0

### Installation

1. Navigate to the backend directory:
   ```
   cd src/backend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm run develop
   ```

4. Access the admin panel at: http://localhost:1337/admin

### Environment Variables

The application uses various environment variables for configuration. 
In a production environment, make sure to set:

- `HOST` - Host name (default: 0.0.0.0)
- `PORT` - Port to run on (default: 1337)
- `APP_KEYS` - Secret keys for the app
- `API_TOKEN_SALT` - Salt for API tokens
- `ADMIN_JWT_SECRET` - JWT secret for admin
- `JWT_SECRET` - JWT secret for API
- `DATABASE_CLIENT` - Database client (default: sqlite)
- `DATABASE_FILENAME` - Database filename (default: .tmp/data.db)

For production, it's recommended to use PostgreSQL or MySQL instead of SQLite.

## Development

### Custom API Creation

To create a new API:

```bash
npx strapi generate
```

Select "api" from the menu and follow the interactive prompts.

### Adding a Custom Controller Method

Create a custom controller method by extending the core controller:

```typescript
export default factories.createCoreController('api::yourmodel.yourmodel', ({ strapi }) => ({
  async customMethod(ctx) {
    // Your custom logic
  },
}))
```

### Adding a Custom Route

Create a new file in `src/api/[api-name]/routes/` with your route definition:

```typescript
export default {
  routes: [
    {
      method: 'GET',
      path: '/yourpath',
      handler: 'controller.method',
      config: {
        auth: false,
      },
    },
  ],
}
```

## Deployment

To build the Strapi application for production:

```bash
npm run build
```

To start the production server:

```bash
npm run start
```

## License

This project is licensed under the MIT License.

# 🚀 Getting started with Strapi

Strapi comes with a full featured [Command Line Interface](https://docs.strapi.io/dev-docs/cli) (CLI) which lets you scaffold and manage your project in seconds.

### `develop`

Start your Strapi application with autoReload enabled. [Learn more](https://docs.strapi.io/dev-docs/cli#strapi-develop)

```
npm run develop
# or
yarn develop
```

### `start`

Start your Strapi application with autoReload disabled. [Learn more](https://docs.strapi.io/dev-docs/cli#strapi-start)

```
npm run start
# or
yarn start
```

### `build`

Build your admin panel. [Learn more](https://docs.strapi.io/dev-docs/cli#strapi-build)

```
npm run build
# or
yarn build
```

## ⚙️ Deployment

Strapi gives you many possible deployment options for your project including [Strapi Cloud](https://cloud.strapi.io). Browse the [deployment section of the documentation](https://docs.strapi.io/dev-docs/deployment) to find the best solution for your use case.

```
yarn strapi deploy
```

## 📚 Learn more

- [Resource center](https://strapi.io/resource-center) - Strapi resource center.
- [Strapi documentation](https://docs.strapi.io) - Official Strapi documentation.
- [Strapi tutorials](https://strapi.io/tutorials) - List of tutorials made by the core team and the community.
- [Strapi blog](https://strapi.io/blog) - Official Strapi blog containing articles made by the Strapi team and the community.
- [Changelog](https://strapi.io/changelog) - Find out about the Strapi product updates, new features and general improvements.

Feel free to check out the [Strapi GitHub repository](https://github.com/strapi/strapi). Your feedback and contributions are welcome!

## ✨ Community

- [Discord](https://discord.strapi.io) - Come chat with the Strapi community including the core team.
- [Forum](https://forum.strapi.io/) - Place to discuss, ask questions and find answers, show your Strapi project and get feedback or just talk with other Community members.
- [Awesome Strapi](https://github.com/strapi/awesome-strapi) - A curated list of awesome things related to Strapi.

---

<sub>🤫 Psst! [Strapi is hiring](https://strapi.io/careers).</sub>

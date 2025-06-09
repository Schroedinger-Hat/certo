# Fixing Permissions in Strapi

Follow these steps to fix the 403 error on `/api/profiles/me`:

## 1. Check API Routes

First, make sure the API routes are correctly defined:

- The path should be `/profiles/me` (without the `/api` prefix, as Strapi adds it automatically)
- The handler should point to the correct controller method (`profile.me`)

## 2. Configure Permissions in Admin Panel

1. **Log in to Strapi Admin**:
   - Open http://localhost:1337/admin in your browser
   - Log in with your admin credentials

2. **Navigate to Roles & Permissions**:
   - Click on "Settings" in the left sidebar
   - Click on "Roles & Permissions"

3. **Configure Authenticated Role**:
   - Click on the "Authenticated" role
   - Find the "Profile" section under "Permissions"
   - Enable the following permissions:
     - `find`
     - `findOne`
     - `me` (this is the custom endpoint)
   - Click "Save" to apply changes

4. **Configure Public Role (if needed)**:
   - Click on the "Public" role
   - If you want to allow public access to certain profile endpoints, enable them here
   - Click "Save" to apply changes

## 3. Test Authentication

Use the test script to verify your token works:

```bash
# Get a token by logging in via the frontend
# Then copy the token and run:
node test-auth.js YOUR_TOKEN_HERE
```

## 4. Check JWT Configuration

Make sure your JWT configuration in Strapi is correct:

1. Check the JWT secret in `.env` file:
   ```
   JWT_SECRET=your-secret-key
   ```

2. Ensure the token is being sent correctly in the Authorization header:
   ```
   Authorization: Bearer your-token-here
   ```

## 5. Restart Strapi

After making changes, restart your Strapi server:

```bash
cd src/backend
npm run develop
```

## 6. Clear Browser Cache

Clear your browser cache and cookies, then try logging in again to get a fresh token.

## 7. Debug Response

If you're still getting a 403 error, check the full response from Strapi for more details:
- Open browser developer tools
- Go to the Network tab
- Look for the `/api/profiles/me` request
- Check the response body for error details

## Common Issues

- **Wrong JWT secret**: Make sure the JWT_SECRET in your .env file matches what was used to generate the token
- **Token expired**: JWT tokens have an expiration time, make sure yours hasn't expired
- **Incorrect role**: Ensure the user has the "Authenticated" role
- **Route not registered**: Make sure the route is correctly registered in Strapi
- **CORS issues**: Check if CORS is properly configured to allow your frontend domain 

# Astro Documentation Guide

Welcome to the Certo documentation site! Here’s how to get the most out of our Astro-powered docs:

## 🚀 Adding New Documentation Pages

1. **Navigate to the docs directory:**
   ```sh
   cd docs
   ```
2. **Create a new page:**
   - For Markdown: `touch src/pages/my-page.md`
   - For Astro: `touch src/pages/my-page.astro`
3. **Edit your new file:**
   - Use Markdown or Astro syntax. Example for Markdown:
     ```md
     ---
     title: My Page
     ---
     # My Page
     Welcome!
     ```
   - Example for Astro:
     ```astro
     ---
     title: My Page
     ---
     <h1>My Page</h1>
     <p>Welcome!</p>
     ```
4. **Link your page:**
   - Add a link in `src/pages/index.astro` or the navigation bar.
5. **Nested routes:**
   - Create folders in `src/pages/` for nested routes (e.g., `src/pages/guides/intro.astro` → `/guides/intro`).

## 🖥️ Running the Docs Locally

1. Install dependencies:
   ```sh
   npm install
   ```
2. Start the dev server:
   ```sh
   npm run dev
   ```
3. Open [http://localhost:4321](http://localhost:4321) in your browser.

## 🌍 Deployment

- The documentation can be deployed to Netlify, Vercel, or GitHub Pages.
- For Netlify: Connect your repo and set the build command to `npm run build` and the publish directory to `docs/dist`.
- For Vercel: Import the project and use the default settings.
- For GitHub Pages: Use `npm run build` and publish the `dist` folder.

## 📝 Markdown & Astro Tips

- Use Markdown for most content. Use Astro for custom layouts or components.
- Embed images: `![Alt text](./img/example.png)`
- Add code blocks:
  ```js
  console.log('Hello, docs!');
  ```
- Link to other pages: `[FAQ](/faq)`

## 💡 Contribution Guidelines

- Follow the [Contributing Guide](../CONTRIBUTING.md) and [Code of Conduct](../CODE_OF_CONDUCT.md).
- Use clear commit messages (Conventional Commits preferred).
- Keep changes focused and atomic.
- Add or update examples/screenshots where helpful.

## 🎨 Linting & Formatting

- Use [Prettier](https://prettier.io/) for consistent formatting.
- Optionally, add [markdownlint](https://github.com/DavidAnson/markdownlint) for Markdown files.

## 🔎 Search & Navigation

- Navigation links are in `src/pages/index.astro`.
- A search bar is coming soon!

## 🌑 Dark Mode

- Use the 🌙/☀️ button in the top right to toggle dark mode.

## 🚦 Preview Deployments

- Every pull request gets a preview deployment (Netlify or Vercel recommended).
- Review your changes live before merging.

## 📚 More Resources

- [Astro Documentation](https://docs.astro.build/en/getting-started/)
- [Markdown Guide](https://www.markdownguide.org/)

---
Happy documenting! 🎉

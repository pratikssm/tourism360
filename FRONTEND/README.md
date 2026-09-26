# React + TypeScript + Vite

## Local setup

Install packages with `npm ci`, then run `npm run dev` for the UI. The local preview catalogue is used for read-only listing pages when Vercel API functions are not running.

To run the database API functions locally, keep the public browser variables in the ignored `.env.local`, add `NEXT_PUBLIC_SUPABASE_URL` and the newly rotated `SUPABASE_SERVICE_ROLE_KEY` there, then run `npm run dev:vercel`. `.env.example` lists the required variable names. Vercel CLI may ask you to sign in and link this folder to the deployed project. Do not put the service-role key in `VITE_*` variables or commit it.

For deployment, configure `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, and `SUPABASE_SERVICE_ROLE_KEY` in the Vercel project environment settings. The service-role key must be server-only. The old key was exposed in config and should be rotated before reuse.

Supabase Auth must have email/password sign-in enabled. If email confirmation is enabled, registration sends a confirmation email before login is allowed. Add the deployed site's `/login` URL to Supabase Auth's allowed redirect URLs.

Apply `supabase/migrations/20260926_create_profile_on_signup.sql` in the Supabase SQL Editor once. It creates the public profile row when a new Auth user is registered.

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

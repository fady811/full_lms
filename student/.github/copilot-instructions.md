# Copilot / AI agent instructions — LMS frontend

Purpose: help automated coding agents be immediately productive in this React codebase.

- **Big picture**: This is a Create React App frontend (see `package.json`) that talks to a REST API under `REACT_APP_API_URL` (default in `src/api/axiosConfig.js`). Routing and view composition live in `src/App.js` and pages in `src/pages/`.

- **State & auth**: Authentication and small client state are handled with `zustand` persisted store at `src/store/authStore.js`. Tokens are stored via the `persist` middleware and read directly by `src/api/axiosConfig.js` interceptors using `useAuthStore.getState()`.

- **API pattern**: All remote calls are in `src/api/*.service.js` and use the shared `apiClient` from `src/api/axiosConfig.js`. Services return `response.data`; callers catch errors and rely on `err.response?.data` (see `src/pages/LoginPage.js`). On 401 the axios response interceptor calls `useAuthStore.getState().logout()`.

- **Routing & guards**: Route definitions and guards are in `src/App.js` and `src/components/guards/` (use `AuthGuard` and `GuestGuard` wrappers). Wrap pages with the appropriate guard rather than changing route logic.

- **Styling & RTL**: Project uses Bootstrap + custom CSS in `src/styles/`. RTL is enabled (see `src/index.js` imports). Keep layout changes mindful of RTL behavior.

- **Common component conventions**:
  - Components live under `src/components/` and often use Bootstrap components + custom CSS files under `src/styles/`.
  - Modals, forms, and async flows show loading states with `Spinner` and surface errors by reading `err.response?.data?.detail`.

- **Environment & scripts**: Standard CRA scripts in `package.json`. Use `npm start` for dev, `npm run build` for production, `npm test` for tests.

- **Examples**:
  - To call login and store tokens: `const data = await authService.login(email, password); login(data.user, data.access, data.refresh);` (see `src/pages/LoginPage.js`).
  - To add an API call: create `src/api/your.service.js` and use `apiClient.get/post(...)` — return `response.data`.
  - To access the current token in non-react modules: `useAuthStore.getState().accessToken` (used by `src/api/axiosConfig.js`).

- **Tests & debugging tips**:
  - Tests use CRA tooling: `npm test`.
  - To debug auth flows, replicate requests against `REACT_APP_API_URL` or inspect `localStorage` keys `auth-storage` (zustand persist name).

- **Patterns to preserve**:
  - Keep API surface thin: services return `data` only.
  - Use guards rather than ad-hoc route checks.
  - Persisted auth state is the single source of truth for `isAuthenticated`.

If anything here is incomplete or you want more examples (e.g., how to add a new page, or the shape of API responses), tell me which area to expand. 

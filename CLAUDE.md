# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Bun workspaces monorepo (`frontend`, `functions`). Bun version is pinned in `.bun-version`, Node in `.nvmrc`.

```bash
bun install                              # install all workspaces
bun lint                                 # prettier --check + eslint (whole repo)
bun run format                           # prettier --write

bun run --filter ./frontend dev          # vite dev on :5050
bun run --filter ./frontend build        # vite build -> frontend/build
bun run --filter ./frontend check        # tsc --noEmit (the only frontend type check)

bun run --filter ./functions build       # tsc src/tsconfig.json -> functions/lib
bun run --filter ./functions dev         # build + firebase emulators (functions, firestore, pubsub) w/ inspector
bun run --filter ./functions test        # jest
```

Filters are by path (`./frontend`). The workspace packages are named `frontend` and `functions`, so name filters work too.

Single function test, from `functions/`:

```bash
bun run test tests/spotify.test.ts
bun run test -t 'creates new docuemnt'
```

Tests are not hermetic — `jest-environment-firebase-functions` talks to the real `ben-keys-spotify-tools-dev` Firestore and needs `functions/serviceAccountKey.json` (gitignored; see README "Project Setup"). The frontend needs `frontend/.env.local` with `PUBLIC_CLIENT_ID`; without it the Spotify authorize URL is built with an undefined client id. `vite.config.ts` sets `envPrefix: 'PUBLIC_'`, so env vars keep the `PUBLIC_` prefix instead of Vite's default `VITE_`.

Deploys normally happen from GitHub Actions on push to `main` (`frontend-deploy.yml`, `functions-deploy.yml`). Locally, use the deploy scripts — `bun run --filter ./frontend deploy` for hosting, `bun run --filter ./functions deploy` for functions — since each compiles before calling `firebase deploy`. There is deliberately no `predeploy` hook in `firebase.json`: the `w9jds/firebase-action` container used by CI has node and npm but no bun, so a bun hook cannot run there. A bare `firebase deploy` therefore ships whatever is already in `frontend/build` / `functions/lib`. Both scripts need a `.firebaserc` (gitignored) defining the project aliases.

`firebase.json` hosting has a catch-all rewrite to `/index.html`. It is load-bearing, not boilerplate: the frontend is a single-page app, and `/authorize` and `/login/callback` are entry points reached by external redirect, so they must resolve on a cold load.

## Architecture

Two halves that share one Spotify integration but implement it twice, for different token flows:

- **`frontend/`** — React 19 + Vite, React Router (`createBrowserRouter` in `src/App.tsx`), Tailwind 4. A client-only SPA: there is no server side and no prerendering, so every route does its work in the browser. `src/lib/spotify/` is a browser fetch wrapper using an _implicit-grant access token_ held in a cookie.
- **`functions/`** — Firebase Functions v2 (CommonJS, `tsc` to `functions/lib`). `src/spotify/index.ts` is a self-contained class using `node-fetch` and the _authorization-code refresh token_ stored in Firestore. It exists so scheduled jobs can act on a user's account without the browser.

### Callable function wiring

`functions/src/tools/index.ts` re-exports each tool as a namespace (`export * as publicLikedSongs from './public-liked-songs'`), which Firebase flattens into deployed names like `publicLikedSongs-create`. The frontend declares `functions` as a workspace dep and imports it **as a type only** (`import type * as Tools from 'functions/src/tools'` in `src/lib/firebase/functions.ts`), so each `httpsCallable` is checked against the real handler's params/return via `satisfies`. Renaming or re-signing a tool export therefore breaks `bun run --filter ./frontend check` — update both sides together.

### Auth flows

Two independent logins, both required for `public-liked-songs`:

1. **Firebase** — passwordless email link (`/login` → `/login/callback`), gated in the UI by `AuthFirebase.tsx` / the `UserProvider` context.
2. **Spotify** — `AuthSpotifyButton` stores the current path in a `directed_from` cookie plus a random `state` cookie, then sends the user to Spotify with `redirect_uri = origin + '/authorize'`. `/authorize` is a shared trampoline: it validates `state`, then either forwards the `code` query back to `directed_from` (authorization-code flow, for tools that need server-side refresh tokens) or stores the hash access token in a path-scoped cookie and redirects (implicit flow, for browser-only tools like `duplicate-remover`).

Cookie keys and their scopes/lifetimes live in `frontend/src/lib/cookie.ts`; `lib/token.ts` reads them back and the `useSpotifyToken(path)` hook holds the result. That hook is deliberately per-`<AuthSpotify>` instance rather than global state — the Spotify token is scoped to the subtree that asked for it.

### Firestore model

One collection per tool, document ID = **Spotify** user ID, holding `{ refresh_token, playlist_id?, uid }` where `uid` is the Firebase UID. `firestore.rules` grants access only when `request.auth.uid == resource.data.uid`, so any new tool document must carry `uid`. Cloud Functions bypass rules via admin SDK.

`public-liked-songs` treats "user unfollowed the playlist" as opt-out: both `create` and the daily `sync` (cron `0 0 * * *`) delete the document when `usersFollowPlaylist` returns false. A revoked Spotify grant (`invalid_grant` / "Refresh token revoked") deletes just `refresh_token`.

### Secrets and env

Spotify credentials come from Cloud Secret Manager via `functions/src/env.ts` (`defineSecret`). Every function that constructs `Spotify` must pass `{ secrets }` in its options and read `process.env.SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET` inside the handler. `frontend/src/lib/firebase/index.ts` switches between prod and dev Firebase configs on `import.meta.env.DEV`, and `lib/firebase/functions.ts` connects to the functions emulator on `localhost:5001` in dev.

### Function tests

`tests/spotify-mocked.ts` calls `jest.mock('src/spotify')` at module scope and exports the mock instance — import it **first** in any test that touches a tool. Tests invoke v2 handlers directly with `create.run({ data, auth, rawRequest })` and assert against real dev Firestore documents (cleaned in `afterEach`). Three tsconfigs in `functions/`: the root one is for the editor, `src/tsconfig.json` builds, `tests/tsconfig.json` is `noEmit` and defines the `src/*` path alias also mirrored in `jest.config.js`.

## Conventions

- Prettier: tabs (width 4), no semicolons, single quotes, `printWidth: 100`, `arrowParens: 'avoid'`. ESLint runs `recommendedTypeChecked` with `projectService`, so new files must be inside a tsconfig's `include`.
- Commit messages use [Gitmoji](https://github.com/carloscuesta/gitmoji) (`🩹 Fix ...`, `🎨 Format code`).
- Adding a tool means touching five places: `functions/src/tools/<tool>.ts` + its export in `tools/index.ts`, a callable wrapper in `frontend/src/lib/firebase/functions.ts`, a component under `frontend/src/routes/tools/<tool>/`, a route entry in `frontend/src/App.tsx`, and an entry in `routes/tools/info.json` (title/description consumed by `ToolHeader`).
- Tailwind 4 is configured in CSS, not JS: the custom palette lives in an `@theme` block in `src/index.css`. There is no `tailwind.config.cjs` or `postcss.config.cjs` — `@tailwindcss/vite` replaces the PostCSS chain. Component stylesheets that use `@apply` must start with `@reference '<relative path>/index.css'`.

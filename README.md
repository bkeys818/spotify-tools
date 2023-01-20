# Spotify Tools

> A site with tools to use alongside Spotify.

[![Deploy Frontend](https://github.com/bkeys818/spotify-tools/actions/workflows/frontend-deploy.yml/badge.svg)](https://github.com/bkeys818/spotify-tools/actions/workflows/frontend-deploy.yml)
[![Deploy Functions](https://github.com/bkeys818/spotify-tools/actions/workflows/functions-deploy.yml/badge.svg)](https://github.com/bkeys818/spotify-tools/actions/workflows/functions-deploy.yml)
[![Check Formatting](https://github.com/bkeys818/spotify-tools/actions/workflows/check-format.yml/badge.svg)](https://github.com/bkeys818/spotify-tools/actions/workflows/check-format.yml)

# Contribution Guidelines

Please ensure your pull request adheres to the following guidelines:

-   Keep descriptions short and simple, but descriptive.
-   Use [Gitmoji](https://github.com/carloscuesta/gitmoji) for commits.
-   Format your code correctly (`yarn lint`).

## Project Setup

This site is build using [SvelteKit](https://kit.svelte.dev) and [Firebase](https://firebase.google.com).

To test Firebase related functionality, do the following:

-   Install [firebase-tools](https://www.npmjs.com/package/firebase-tools) globally.
-   Create a new firebase project for development.
-   Set up a Firebase deploy targets named `dev` ([tutorial](https://firebase.google.com/docs/cli/targets#set_up_deploy_targets_for_your_firebase_resources)).
-   Replace the [`devConfig`](https://github.com/bkeys818/spotify-tools/blob/main/src/lib/firebase/index.ts#L15) with your development project configuration.
-   Create a `firebase`.

To test Spotify related functionality, do the following:

-   Create a [Spotify API project](https://developer.spotify.com/dashboard/login) for development.
-   Create a `.env.development.local` file containing all [`ImportMetaEnv`](https://github.com/bkeys818/spotify-tools/blob/main/src/env.d.ts) properties.
-   Set secrets with [Cloud Secrets](https://firebase.google.com/docs/functions/config-env#secret-manager) for the valus listed in [`functions/src/env.ts`](https://github.com/bkeys818/spotify-tools/blob/main/functions/src/env.ts).

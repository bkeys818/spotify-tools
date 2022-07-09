import { base } from '$app/paths'

const { VITE_CLIENT_ID, VITE_ORIGIN } = import.meta.env

export const credential = {
    redirectUri: VITE_ORIGIN + base + '/authorize/callback',
    clientId: VITE_CLIENT_ID
}

export * from './authorize'
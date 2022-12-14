import { base } from '$app/paths'
import { PUBLIC_ORIGIN, PUBLIC_CLIENT_ID } from '$env/static/public'

export const credential = {
    redirectUri: PUBLIC_ORIGIN + base + '/authorize',
    clientId: PUBLIC_CLIENT_ID
}

export * from './authorize'
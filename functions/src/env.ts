import { defineSecret } from 'firebase-functions/params'

export const spotifySecrets = ['SPOTIFY_CLIENT_ID', 'SPOTIFY_CLIENT_SECRET'].map(defineSecret)

/** Only functions that call `sendReauthorizeEmail` need these. */
export const emailSecrets = ['RESEND_API_KEY'].map(defineSecret)

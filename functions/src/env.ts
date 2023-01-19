import { defineSecret } from 'firebase-functions/params'

export const secrets = ['SPOTIFY_CLIENT_ID', 'SPOTIFY_CLIENT_SECRET'].map(defineSecret)

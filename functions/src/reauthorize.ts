import fetch from 'node-fetch'
import { getAuth } from 'firebase-admin/auth'
import type { Timestamp } from 'firebase-admin/firestore'
import { warn } from 'firebase-functions/logger'
import { app } from './init'

/**
 * Spotify expires refresh tokens this long after the user's *original*
 * authorization. Refreshing the access token does not extend it; only a new
 * trip through the authorization-code flow does.
 */
export const REFRESH_TOKEN_LIFETIME_MONTHS = 6
/** How far ahead of expiry to ask the user to reconnect. */
export const REMINDER_LEAD_DAYS = 14

const FROM = 'Spotify Tools <noreply@ben-keys.com>'

/** When Spotify will expire a refresh token issued at `authorizedAt`. */
export function refreshTokenExpiresAt(authorizedAt: Timestamp) {
	const date = authorizedAt.toDate()
	date.setMonth(date.getMonth() + REFRESH_TOKEN_LIFETIME_MONTHS)
	return date
}

/** True once the token is within `REMINDER_LEAD_DAYS` of expiring. */
export function isExpiringSoon(authorizedAt: Timestamp, now = new Date()) {
	const remind = refreshTokenExpiresAt(authorizedAt)
	remind.setDate(remind.getDate() - REMINDER_LEAD_DAYS)
	return now >= remind
}

type ReauthorizeOptions = {
	/** Firebase UID; the email goes to that account's address. */
	uid: string
	/** Route slug, e.g. `public-liked-songs`. Used for the link and the subject. */
	tool: string
	/** Site origin the user authorized from, so the link goes back to the same deployment. */
	origin: string
	/** `expiring` includes the expiry date; `expired` says the tool has already stopped. */
	kind: 'expiring' | 'expired'
	/** Start of Spotify's clock, so the email prints the same date `isExpiringSoon` keys on. */
	authorizedAt?: Timestamp
}

/**
 * Emails the user behind `uid` asking them to reconnect Spotify.
 *
 * Resolves `false` (after a warning) when the account has no email. Throws if
 * the send itself fails, so the caller decides whether to try again later.
 */
export async function sendReauthorizeEmail(opts: ReauthorizeOptions) {
	const to = await userEmail(opts.uid)
	if (!to) {
		warn('No email for user; cannot ask them to reauthorize.', {
			tool: opts.tool,
			firebaseUid: opts.uid
		})
		return false
	}
	const expiresAt = opts.authorizedAt && refreshTokenExpiresAt(opts.authorizedAt)
	const res = await fetch('https://api.resend.com/emails', {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			from: FROM,
			to,
			template: {
				id: `spotify-connection-${opts.kind}`,
				variables: {
					TOOL_NAME: toolName(opts.tool),
					EXPIRES_ON: expiresAt ? formatDate(expiresAt) : undefined,
					RECONNECT_URL: `${opts.origin}/${opts.tool}`
				}
			}
		})
	})
	if (res.ok) return true
	const body = await res.text().catch(() => '')
	throw new Error(`Failed to send email: ${res.statusText} (${res.status}) ${body}`.trim())
}

async function userEmail(uid: string) {
	const user = await getAuth(app).getUser(uid)
	return user.email
}

/** `public-liked-songs` → `Public Liked Songs`. */
function toolName(slug: string) {
	return slug
		.split('-')
		.map(word => word.charAt(0).toUpperCase() + word.slice(1))
		.join(' ')
}

function formatDate(date: Date) {
	return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

import type { PageLoad } from './$types'
import { title, desc, path } from '.'

export const load = (() => ({
	title,
	desc,
	scopes: ['user-library-read', 'playlist-modify-public'],
	loginUrl: '/login?redirect=' + encodeURIComponent(path)
})) satisfies PageLoad

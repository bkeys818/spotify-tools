import type { PageLoad } from './$types'

export const load = (({ route }) => ({
	title: 'Public "Liked Songs" Playlist',
	desc: 'Creates a public paylist that contains all your liked songs. Then updates that playlist every day.\nThis allows your people who follow you to see and play your liked songs.',
	scopes: ['user-library-read', 'playlist-modify-public'],
	loginUrl: '/login?redirect=' + encodeURIComponent(route.id),
})) satisfies PageLoad

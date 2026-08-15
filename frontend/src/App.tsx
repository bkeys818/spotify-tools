import { createBrowserRouter } from 'react-router-dom'
import { RootLayout } from '@/routes/RootLayout'
import { RouteError } from '@/routes/RouteError'
import { Home } from '@/routes/Home'
import * as authorize from '@/routes/authorize/authorize'
import { LoginLayout } from '@/routes/login/LoginLayout'
import * as login from '@/routes/login/Login'
import * as loginCallback from '@/routes/login/callback/LoginCallback'
import * as publicLikedSongs from '@/routes/tools/public-liked-songs/PublicLikedSongs'
import * as spotifyAuth from '@/routes/tools/duplicate-remover/SpotifyAuthLayout'
import * as duplicateRemover from '@/routes/tools/duplicate-remover/DuplicateRemover'
import * as playlist from '@/routes/tools/duplicate-remover/playlist/Playlist'

export const router = createBrowserRouter([
	{
		path: '/',
		element: <RootLayout />,
		errorElement: <RouteError />,
		children: [
			{ index: true, element: <Home /> },

			// Pure navigation — no element, the loader always redirects.
			{ path: 'authorize', loader: authorize.loader },

			{
				path: 'login',
				element: <LoginLayout />,
				children: [
					{ index: true, action: login.action, element: <login.Login /> },
					{
						path: 'callback',
						loader: loginCallback.loader,
						action: loginCallback.action,
						element: <loginCallback.LoginCallback />
					}
				]
			},

			{
				path: 'public-liked-songs',
				loader: publicLikedSongs.loader,
				action: publicLikedSongs.action,
				shouldRevalidate: publicLikedSongs.shouldRevalidate,
				element: <publicLikedSongs.PublicLikedSongs />
			},

			// Layout route gating both children behind a Spotify token, which is
			// what replaced the AuthSpotify render prop.
			{
				path: 'duplicate-remover',
				loader: spotifyAuth.loader,
				element: <spotifyAuth.SpotifyAuthLayout />,
				children: [
					{
						index: true,
						loader: duplicateRemover.loader,
						element: <duplicateRemover.DuplicateRemover />
					},
					{
						path: 'playlist',
						loader: playlist.loader,
						action: playlist.action,
						element: <playlist.Playlist />
					}
				]
			}
		]
	}
])

import { createBrowserRouter } from 'react-router-dom'
import { RootLayout } from '@/routes/RootLayout'
import { ErrorPage } from '@/routes/ErrorPage'
import { Home } from '@/routes/Home'
import { Authorize } from '@/routes/authorize/Authorize'
import { LoginLayout } from '@/routes/login/LoginLayout'
import { Login } from '@/routes/login/Login'
import { LoginCallback } from '@/routes/login/callback/LoginCallback'
import { PublicLikedSongs } from '@/routes/tools/public-liked-songs/PublicLikedSongs'
import { DuplicateRemover } from '@/routes/tools/duplicate-remover/DuplicateRemover'
import { Playlist } from '@/routes/tools/duplicate-remover/playlist/Playlist'

// Mirrors the old routes/ directory. SvelteKit's `(tools)` group contributed no
// URL segment and had no layout, so it is only a source folder here.
export const router = createBrowserRouter([
	{
		path: '/',
		element: <RootLayout />,
		errorElement: <ErrorPage />,
		children: [
			{ index: true, element: <Home /> },
			{ path: 'authorize', element: <Authorize /> },
			{
				path: 'login',
				element: <LoginLayout />,
				children: [
					{ index: true, element: <Login /> },
					{ path: 'callback', element: <LoginCallback /> }
				]
			},
			{ path: 'public-liked-songs', element: <PublicLikedSongs /> },
			{ path: 'duplicate-remover', element: <DuplicateRemover /> },
			{ path: 'duplicate-remover/playlist', element: <Playlist /> }
		]
	}
])

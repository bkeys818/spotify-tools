import { Link } from 'react-router-dom'

export function NavBar() {
	return (
		<nav className="bg-gray-800 text-spotify-white">
			<div className="max-w-7xl mx-auto h-16 px-2 sm:px-6 lg:px-8 flex items-center gap-6">
				<Link className="text-2xl font-extralight" to="/">
					Spotify Tools
				</Link>
				<div className="flex justify-end grow gap-3">
					<a className="hover:underline" href="https://ben-keys.com">
						Ben Keys
					</a>
				</div>
			</div>
		</nav>
	)
}

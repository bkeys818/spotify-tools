/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			colors: {
				'spotify-green': {
					400: '#1ED760',
					500: '#1DB954'
				},
				'spotify-white': '#FFFFFF',
				'spotify-black': '#191414',
				'spotify-gray': {
					200: '#C1C3C6',
					600: '#616467',
				}
			}
		},
	}
}

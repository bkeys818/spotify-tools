import { Outlet } from 'react-router-dom'
import { NavBar } from '@/lib/components/NavBar'

export function RootLayout() {
	return (
		<>
			<NavBar />

			<main className="max-w-4xl mx-auto px-4 my-4 sm:my-2 lg:my-8">
				<Outlet />
			</main>
		</>
	)
}

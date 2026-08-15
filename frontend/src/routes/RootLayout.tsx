import { Outlet } from 'react-router-dom'
import { NavBar } from '@/lib/components/NavBar'
import { ErrorMsg } from '@/lib/components/ErrorMsg'
import { ErrorProvider } from '@/lib/contexts/error'
import { UserProvider } from '@/lib/contexts/user'

export function RootLayout() {
	return (
		<ErrorProvider>
			<UserProvider>
				<NavBar />

				<main className="max-w-4xl mx-auto px-4 my-4 sm:my-2 lg:my-8">
					<Outlet />
				</main>

				<ErrorMsg />
			</UserProvider>
		</ErrorProvider>
	)
}

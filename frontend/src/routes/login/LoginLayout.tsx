import { Outlet } from 'react-router-dom'

export function LoginLayout() {
	return (
		<>
			<title>Login</title>
			<header>
				<h1>Login with Email</h1>
			</header>

			<Outlet />
		</>
	)
}

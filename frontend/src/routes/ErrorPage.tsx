import { isRouteErrorResponse, useRouteError } from 'react-router-dom'

export function ErrorPage() {
	const error = useRouteError()

	if (isRouteErrorResponse(error)) {
		return (
			<h1>
				{error.status}: {error.statusText}
			</h1>
		)
	}
	return <h1>{error instanceof Error ? error.message : 'Something went wrong'}</h1>
}

import { useRouteError } from 'react-router-dom'
import { describeError } from '@/lib/describe-error'
import './RouteError.css'

/**
 * The single error surface for the whole app, wired as the root route's
 * `errorElement`. Anything thrown from a loader, an action, or a component
 * render lands here, which is what replaced the global error store.
 */
export function RouteError() {
	const error = useRouteError()
	const description = describeError(error) ?? { title: 'Unknown Error' }

	console.error(error)

	return (
		<div className="error-card">
			<h4 className="font-bold text-red-600">{description.title}</h4>
			{description.message && <p>{description.message}</p>}
			{description.details && <h6>{description.details}</h6>}
			<button className="btn-secondary mt-4" onClick={() => location.reload()}>
				Reload
			</button>
		</div>
	)
}

import { useState } from 'react'
import { Form } from 'react-router-dom'

/**
 * Posts to whichever route action it is rendered under, so the parent decides
 * what submitting means rather than passing a callback down.
 */
export function EmailForm({ disabled = false }: { disabled?: boolean }) {
	const [email, setEmail] = useState('')

	return (
		<Form method="post" className="panel w-fit mx-auto">
			<div className="mb-6 w-fit mx-auto">
				<label
					htmlFor="email"
					className="block text-spotify-gray-600 text-sm font-bold mb-2"
				>
					Email
				</label>
				<input
					id="email"
					name="email"
					type="email"
					value={email}
					onChange={event => setEmail(event.target.value)}
					disabled={disabled}
					className="shadow-sm appearance-none border rounded-sm py-2 px-3 text-spotify-gray-600 leading-tight focus:outline-hidden"
				/>
			</div>
			<button type="submit" disabled={disabled || !email} className="btn-secondary w-full">
				Login
			</button>
		</Form>
	)
}

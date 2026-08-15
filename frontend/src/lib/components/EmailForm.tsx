import { useState } from 'react'

interface EmailFormProps {
	onSubmit: (email: string) => void
	disabled?: boolean
}

export function EmailForm({ onSubmit, disabled = false }: EmailFormProps) {
	const [email, setEmail] = useState('')

	return (
		<form action="javascript:void(0);" className="panel w-fit mx-auto">
			<div className="mb-6 w-fit mx-auto">
				<label
					htmlFor="email"
					className="block text-spotify-gray-600 text-sm font-bold mb-2"
				>
					Email
				</label>
				<input
					id="email"
					type="email"
					value={email}
					onChange={event => setEmail(event.target.value)}
					disabled={disabled}
					className="shadow-sm appearance-none border rounded-sm py-2 px-3 text-spotify-gray-600 leading-tight focus:outline-hidden"
				/>
			</div>
			<button
				onClick={() => onSubmit(email)}
				disabled={disabled || !email}
				className="btn-secondary w-full"
			>
				Login
			</button>
		</form>
	)
}

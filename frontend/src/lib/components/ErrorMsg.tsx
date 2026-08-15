import { useEffect } from 'react'
import { useError } from '@/lib/contexts/error'
import { describeError } from '@/lib/describe-error'
import './ErrorMsg.css'

export function ErrorMsg() {
	const { error } = useError()
	const description = describeError(error)

	useEffect(() => {
		if (!description) return
		console.error(description.message)
		console.log(description.details)
	}, [description?.message, description?.details]) // eslint-disable-line react-hooks/exhaustive-deps

	if (!description) return null

	return (
		<div className="popup">
			<div onClick={() => location.reload()} />
			<div>
				<h4 className="font-bold text-red-600">{description.title}</h4>
				{description.message && <p>{description.message}</p>}
				{description.details && <h6>{description.details}</h6>}
			</div>
		</div>
	)
}

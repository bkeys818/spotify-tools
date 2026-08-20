import type { CSSProperties } from 'react'
import './Spinner.css'

export function Spinner({ borderWidth = 6 }: { borderWidth?: number }) {
	const style = { '--border-width': `${borderWidth}px` } as CSSProperties

	return (
		<div className="spin-ring">
			{Array.from({ length: 4 }, (_, i) => (
				<div key={i} style={style} />
			))}
		</div>
	)
}

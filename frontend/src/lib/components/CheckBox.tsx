import './CheckBox.css'

interface CheckBoxProps {
	id: string
	value?: string
	label?: string
	size?: 'lg' | 'md' | 'sm'
	checked: boolean
	onChange?: (checked: boolean) => void
}

export function CheckBox({ id, value = id, label, size = 'md', checked, onChange }: CheckBoxProps) {
	const sizeClass = size === 'md' ? '' : `size-${size}`

	return (
		<div className="relative">
			<input
				type="checkbox"
				id={id}
				value={value}
				className="hidden"
				checked={checked}
				onChange={event => onChange?.(event.target.checked)}
			/>
			<label htmlFor={id} className="checkbox-label inline">
				<span className={`checkbox ${checked ? 'checked' : ''} ${sizeClass}`}>
					<svg
						viewBox="0 0 12 9"
						fill="none"
						stroke="white"
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<polyline points="1 5 4 8 11 1" />
					</svg>
				</span>
				{label && <span className="label">{label}</span>}
			</label>
		</div>
	)
}

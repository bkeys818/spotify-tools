import type { ReactNode } from 'react'
import type { ToolInfo } from '@/lib/tools'

export function ToolHeader({ info, children }: { info: ToolInfo; children?: ReactNode }) {
	return (
		<>
			<title>{info.title}</title>
			<header>
				<h1>{info.title}</h1>
				<h3>{info.desc}</h3>
			</header>
			{children}
		</>
	)
}

import { Link } from 'react-router-dom'
import { toolInfo } from '@/lib/tools'

export function Home() {
	return (
		<>
			<title>Spotify Tools</title>
			<header>
				<h1>Spotify Tools</h1>
			</header>
			<ul>
				{Object.entries(toolInfo).map(([id, { title, desc }]) => (
					<li key={id}>
						<Link to={`/${id}`} className="block panel mb-3">
							<h2 className="text-left">{title}</h2>
							<h4>{desc}</h4>
						</Link>
					</li>
				))}
			</ul>
		</>
	)
}

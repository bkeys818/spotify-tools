import type { PageLoad } from './$types'
import { title, desc } from '.'

export const load = (() => ({ title, desc })) satisfies PageLoad

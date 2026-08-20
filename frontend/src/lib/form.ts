/**
 * `FormData.get` yields `string | File | null`, so actions have to narrow
 * before using a field. A missing field is a bug in the form, not user error,
 * so this throws to the route error element rather than returning null.
 */
export function requireField(formData: FormData, name: string) {
	const value = formData.get(name)
	if (typeof value !== 'string' || value === '') throw new Error(`Missing form field "${name}".`)
	return value
}

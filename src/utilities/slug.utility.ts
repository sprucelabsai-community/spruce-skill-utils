export default function slug(slug: string) {
	return `${slug
		.toLowerCase()
		.replace(/[^a-z0-9]/gi, '_')
		.replace(/__*/, '_')
		.trim()}`
}

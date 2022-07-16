export default function slug(slug: string) {
	return `${slug
		.toLowerCase()
		.replace(/[^a-z0-9]/gi, '-')
		.replace(/__*/, '-')
		.trim()}`
}

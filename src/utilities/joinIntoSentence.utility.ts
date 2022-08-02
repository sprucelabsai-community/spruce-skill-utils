export default function joinIntoSentence(words: string[]): string {
	const last = words.pop()
	if (words.length === 0) {
		return last ?? ''
	}
	return words.join(', ') + ' & ' + last
}

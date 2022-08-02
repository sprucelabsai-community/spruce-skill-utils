import AbstractSpruceTest, { test, assert } from '@sprucelabs/test'
import { joinIntoSentence } from '../../utilities/joinIntoSentence'

export default class ConstructingSentencesTest extends AbstractSpruceTest {
	@test()
	protected static async canCreateConstructingSentences() {
		assert.isFunction(joinIntoSentence)
	}

	@test()
	protected static async generatesExpected() {
		this.assertRendersExpected(['hey'], 'hey')
		this.assertRendersExpected(['hey', 'there'], 'hey & there')
		this.assertRendersExpected(
			['what', 'in', 'the', 'world'],
			'what, in, the & world'
		)
	}

	private static assertRendersExpected(words: string[], expected: string) {
		const actual = joinIntoSentence(words)
		assert.isEqual(actual, expected)
	}
}

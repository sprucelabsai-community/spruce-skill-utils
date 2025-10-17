import AbstractSpruceTest, { test, suite, assert } from '@sprucelabs/test-utils'
import joinIntoSentence from '../../utilities/joinIntoSentence.utility'

@suite()
export default class ConstructingSentencesTest extends AbstractSpruceTest {
    @test()
    protected async canCreateConstructingSentences() {
        assert.isFunction(joinIntoSentence)
    }

    @test()
    protected async generatesExpected() {
        this.assertRendersExpected(['hey'], 'hey')
        this.assertRendersExpected(['hey', 'there'], 'hey & there')
        this.assertRendersExpected(
            ['what', 'in', 'the', 'world'],
            'what, in, the & world'
        )
    }

    private assertRendersExpected(words: string[], expected: string) {
        const actual = joinIntoSentence(words)
        assert.isEqual(actual, expected)
    }
}

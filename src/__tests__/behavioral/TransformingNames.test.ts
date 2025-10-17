import AbstractSpruceTest, { test, suite, assert } from '@sprucelabs/test-utils'
import namesUtil from '../../utilities/names.utility'

@suite()
export default class TransformingNamesTest extends AbstractSpruceTest {
    @test('snakes "Hey there"', 'Hey there', 'hey_there')
    @test('snakes "Hey there!!!"', 'Hey there!!!', 'hey_there')
    protected async snake(name: string, expected: string) {
        const actual = namesUtil.toSnake(name)
        assert.isEqual(actual, expected)
    }
}

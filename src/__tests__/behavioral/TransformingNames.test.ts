import AbstractSpruceTest, { test, assert } from '@sprucelabs/test'
import namesUtil from '../../utilities/names.utility'

export default class TransformingNamesTest extends AbstractSpruceTest {
    @test('snakes "Hey there"', 'Hey there', 'hey_there')
    @test('snakes "Hey there!!!"', 'Hey there!!!', 'hey_there')
    protected static async snake(name: string, expected: string) {
        const actual = namesUtil.toSnake(name)
        assert.isEqual(actual, expected)
    }
}

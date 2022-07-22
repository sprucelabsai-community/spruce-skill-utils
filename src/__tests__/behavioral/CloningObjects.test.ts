import AbstractSpruceTest, { test, assert } from '@sprucelabs/test'
import cloneDeep from '../../utilities/cloneDeep'

export default class CloningObjectsTest extends AbstractSpruceTest {
	@test()
	protected static async canCreateCloningObjects() {
		assert.isFunction(cloneDeep)
	}

	@test()
	protected static async canCloneBasicObject() {
		const obj = { hello: 'world' }
		const actual = cloneDeep(obj)
		assert.isEqualDeep(actual, obj)
		assert.isNotEqual(actual, obj)
	}

	@test()
	protected static async canCloneWithOnSimpleObject() {
		const obj = { hello: 'world' }

		let passedValue: any
		let passedKey: any

		cloneDeep(obj, (value, key) => {
			passedValue = value
			passedKey = key
		})

		assert.isEqual(passedValue, 'world')
		assert.isEqual(passedKey, 'hello')
	}

	@test()
	protected static async calledForEachKeyOnObject() {
		const obj = { what: 'the', here: 'there' }

		const passedValues: any[] = []
		const passedKeys: any[] = []

		cloneDeep(obj, (value, key) => {
			passedValues.push(value)
			passedKeys.push(key)
		})

		assert.isEqualDeep(passedValues, ['the', 'there'])
		assert.isEqualDeep(passedKeys, ['what', 'here'])
	}

	@test('can ignore keys 1', 'go', { team: 'stop' })
	@test('can ignore keys 2', 'team', { go: 'to' })
	protected static async canCancelCopyingOfKeys(
		k: string,
		expected: Record<string, any>
	) {
		const obj = { go: 'to', team: 'stop' }

		const actual = cloneDeep(obj, (_, key) => {
			if (key === k) {
				return false
			}

			return true
		})

		assert.isEqualDeep(actual, expected)
	}

	@test()
	protected static async canIgnoreKeysPassedInArray() {
		const obj = [
			{ go: 'to', team: 'stop' },
			{ go: 'another', team: 'go' },
		]

		const actual = cloneDeep(obj, (_, key) => {
			return key !== 'go'
		})

		//@ts-ignore
		assert.isEqualDeep(actual, [{ team: 'stop' }, { team: 'go' }])
	}

	@test()
	protected static async canIgnoreKeysPassedInSet() {
		const obj = new Set([
			{ hey: 'to', team: 'stop' },
			{ hey: 'another', team: 'hey' },
		])

		const actual = cloneDeep(obj, (_, key) => {
			return key === 'team'
		})

		//@ts-ignore
		assert.isEqualDeep([...actual], [{ team: 'stop' }, { team: 'hey' }])
	}

	@test()
	protected static async canIgnoreKeysPassedInMap() {
		const obj = new Map()
		obj.set('run', 'stop')
		obj.set('walk', 'go')
		obj.set('still', false)

		const actual = cloneDeep(obj, (_, key) => {
			return key !== 'walk'
		})

		assert.isEqualDeep([...actual.values()], ['stop', false])
	}
}

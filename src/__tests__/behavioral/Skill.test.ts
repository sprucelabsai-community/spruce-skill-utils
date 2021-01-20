import AbstractSpruceTest, { test, assert } from '@sprucelabs/test'
import { errorAssertUtil } from '@sprucelabs/test-utils'
import Skill from '../../skills/Skill'

export default class SkillTest extends AbstractSpruceTest {
	@test()
	protected static async throwsWhenCantFindFeatureByCode() {
		const skill = this.Skill()
		const err = assert.doesThrow(() => skill.getFeatureByCode('unknown'))

		errorAssertUtil.assertError(err, 'INVALID_FEATURE_CODE', {
			suppliedCode: 'unknown',
			validCodes: [],
		})
	}

	@test()
	protected static async throwReturnsValidCodes() {
		const skill = this.Skill()

		//@ts-ignore
		await skill.registerFeature('test', {})

		const err = assert.doesThrow(() => skill.getFeatureByCode('unknown'))

		errorAssertUtil.assertError(err, 'INVALID_FEATURE_CODE', {
			suppliedCode: 'unknown',
			validCodes: ['test'],
		})
	}

	@test()
	protected static async canGetFeatureByCode() {
		const skill = this.Skill()

		//@ts-ignore
		await skill.registerFeature('test', { test: true })

		const match = skill.getFeatureByCode('test')

		//@ts-ignore
		assert.isEqualDeep(match, { test: true })
	}

	private static Skill() {
		return new Skill({
			rootDir: this.cwd,
			activeDir: this.cwd,
			hashSpruceDir: this.cwd,
		})
	}
}

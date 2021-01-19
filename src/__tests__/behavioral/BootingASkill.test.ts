import AbstractSpruceTest, { test, assert } from '@sprucelabs/test'
import Skill from '../../skills/Skill'

export default class BootingAAskillTest extends AbstractSpruceTest {
	@test()
	protected static async canCreateBootingAAskill() {
		const bootingASkill = new Skill({
			rootDir: '',
			activeDir: '',
			hashSpruceDir: '',
		})
		assert.isTruthy(bootingASkill)
	}

	@test.todo()
	protected static async thisWasCopiedFromCliAndTestsWillNeedToBeWrittenAsBugsArise() {}
}

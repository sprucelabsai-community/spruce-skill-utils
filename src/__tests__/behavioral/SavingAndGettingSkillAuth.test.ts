import AbstractSpruceTest, { test, assert } from '@sprucelabs/test'
import { errorAssert } from '@sprucelabs/test-utils'
import AuthService from '../../services/AuthService'
import diskUtil from '../../utilities/disk.utility'

export default class SavingAndGettingSkillAuthTest extends AbstractSpruceTest {
	protected static async beforeEach() {
		await super.beforeEach()
		this.cwd = diskUtil.createRandomTempDir()
	}

	@test()
	protected static throwsWhenNotPassedCwd() {
		//@ts-ignore
		const err = assert.doesThrow(() => AuthService.Auth())

		errorAssert.assertError(err, 'MISSING_PARAMETERS', {
			parameters: ['cwd'],
		})
	}

	@test()
	protected static throwsWhenNoPackageJson() {
		//@ts-ignore
		const err = assert.doesThrow(() => AuthService.Auth(this.cwd))

		errorAssert.assertError(err, 'INVALID_PARAMETERS', {
			parameters: ['cwd'],
		})
	}

	@test()
	protected static doesNotWhenSkillHasNoNamespaceDefined() {
		const pkg = {}
		this.writePackageJson(pkg)
		AuthService.Auth(this.cwd)
	}

	@test()
	protected static canGetAuth() {
		this.writeValidPackageJson()

		const auth = AuthService.Auth(this.cwd)
		assert.isTrue(auth instanceof AuthService)
	}

	@test()
	protected static async hasLoggedInPersonMethod() {
		this.writeValidPackageJson()
		assert.isFunction(this.Auth().getLoggedInPerson)
	}

	@test()
	protected static async loggedInPersonIsNullWhenNotLoggedIn() {
		this.writeValidPackageJson()
		assert.isNull(this.Auth().getLoggedInPerson())
	}

	@test()
	protected static async cantSaveBadLoggedInPerson() {
		this.writeValidPackageJson()
		const err = assert.doesThrow(() =>
			//@ts-ignore
			this.Auth().setLoggedInPerson({ test: true })
		)

		errorAssert.assertError(err, 'MISSING_PARAMETERS')
	}

	@test()
	protected static canSaveLoggedInPerson() {
		this.writeValidPackageJson()
		const person = {
			id: 'test',
			casualName: 'friend',
			token: 'token',
		}

		const auth = this.Auth()
		auth.setLoggedInPerson(person)

		const loggedIn = auth.getLoggedInPerson()

		assert.isEqualDeep(loggedIn, { ...person, isLoggedIn: true })
	}

	@test()
	protected static canLogOut() {
		this.writeValidPackageJson()
		const person = {
			id: 'test',
			casualName: 'friend',
			token: 'token',
		}

		const auth = this.Auth()

		auth.setLoggedInPerson(person)
		auth.logOutPerson()

		assert.isNull(auth.getLoggedInPerson())
	}

	@test()
	protected static getCurrentSkillReturnsNull() {
		this.writeValidPackageJson()
		assert.isNull(this.Auth().getCurrentSkill())
	}

	@test()
	protected static canSetCurrentSkill() {
		this.writeValidPackageJson()
		const skill = {
			id: '123467aaoeuaoeu',
			apiKey: 'taco',
			name: 'go team',
			slug: 'taco-bravo',
		}

		const auth = this.Auth()

		auth.updateCurrentSkill(skill)

		assert.isEqualDeep(auth.getCurrentSkill(), skill)
	}

	private static writeValidPackageJson() {
		this.writePackageJson({
			skill: {
				namespace: 'test',
			},
		})
	}

	private static Auth(): any {
		return AuthService.Auth(this.cwd)
	}
	private static writePackageJson(pkg: Record<string, any> = {}) {
		diskUtil.writeFile(this.resolvePath('package.json'), JSON.stringify(pkg))
	}
}

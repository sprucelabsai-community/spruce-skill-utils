import AbstractSpruceTest, {
    test,
    suite,
    assert,
    errorAssert,
} from '@sprucelabs/test-utils'
import AuthService from '../../services/AuthService'
import diskUtil from '../../utilities/disk.utility'

@suite()
export default class SavingAndGettingSkillAuthTest extends AbstractSpruceTest {
    protected async beforeEach() {
        await super.beforeEach()
        this.cwd = diskUtil.createRandomTempDir()
        AuthService.homeDir = this.resolvePath(diskUtil.createRandomTempDir())
    }

    @test()
    protected throwsWhenNotPassedCwd() {
        //@ts-ignore
        const err = assert.doesThrow(() => AuthService.Auth())

        errorAssert.assertError(err, 'MISSING_PARAMETERS', {
            parameters: ['cwd'],
        })
    }

    @test()
    protected throwsWhenNoPackageJson() {
        //@ts-ignore
        const err = assert.doesThrow(() => AuthService.Auth(this.cwd))

        errorAssert.assertError(err, 'INVALID_PARAMETERS', {
            parameters: ['cwd'],
        })
    }

    @test()
    protected doesNotWhenSkillHasNoNamespaceDefined() {
        const pkg = {}
        this.writePackageJson(pkg)
        AuthService.Auth(this.cwd)
    }

    @test()
    protected canGetAuth() {
        this.writeValidPackageJson()

        const auth = AuthService.Auth(this.cwd)
        assert.isTrue(auth instanceof AuthService)
    }

    @test()
    protected async hasLoggedInPersonMethod() {
        this.writeValidPackageJson()
        assert.isFunction(this.Auth().getLoggedInPerson)
    }

    @test()
    protected async loggedInPersonIsNullWhenNotLoggedIn() {
        this.writeValidPackageJson()
        assert.isNull(this.Auth().getLoggedInPerson())
    }

    @test()
    protected async cantSaveBadLoggedInPerson() {
        this.writeValidPackageJson()
        const err = assert.doesThrow(() =>
            //@ts-ignore
            this.Auth().setLoggedInPerson({ test: true })
        )

        errorAssert.assertError(err, 'MISSING_PARAMETERS')
    }

    @test()
    protected canSaveLoggedInPerson() {
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
    protected canLogOut() {
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
    protected async loggingOutTwiceDoesNotTHrough() {
        this.writeValidPackageJson()
        const auth = this.Auth()

        auth.logOutPerson()
        auth.logOutPerson()
    }

    @test()
    protected getCurrentSkillReturnsNull() {
        this.writeValidPackageJson()
        assert.isNull(this.Auth().getCurrentSkill())
    }

    @test()
    protected canSetCurrentSkill() {
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

    private writeValidPackageJson() {
        this.writePackageJson({
            skill: {
                namespace: 'test',
            },
        })
    }

    private Auth() {
        return AuthService.Auth(this.cwd)
    }
    private writePackageJson(pkg: Record<string, any> = {}) {
        diskUtil.writeFile(
            this.resolvePath('package.json'),
            JSON.stringify(pkg)
        )
    }
}

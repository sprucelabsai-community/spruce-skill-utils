import os from 'os'
import AbstractSpruceTest, {
    test,
    assert,
    generateId,
} from '@sprucelabs/test-utils'
import AuthService from '../../services/AuthService'
import { PersonWithToken } from '../../types/skill.types'
import diskUtil from '../../utilities/disk.utility'

export default class AuthServiceTest extends AbstractSpruceTest {
    private static auth: SpyAuthService
    private static person: PersonWithToken

    protected static async beforeEach() {
        await super.beforeEach()
        AuthService.Class = SpyAuthService
        this.auth = AuthService.Auth(this.cwd) as SpyAuthService
        this.person = {
            casualName: generateId(),
            id: generateId(),
            isLoggedIn: true,
            token: generateId(),
        }
    }

    @test()
    protected static async defaultHomeDirEqualsExpected() {
        const expected = this.resolvePath(os.homedir())
        assert.isEqual(SpyAuthService.getHomeDir(), expected)
    }

    @test()
    protected static async shouldSaveLoggedInPersonInHomeDir() {
        this.setRandomHomeAndLoginAsPerson()
        assert.isTrue(diskUtil.doesFileExist(this.personJsonPath))
    }

    @test()
    protected static async contentsOfPersonJsonMatchesWhatIsSet() {
        this.setRandomHomeAndLoginAsPerson()
        const person = this.loadSavedPersonFromJson()
        assert.isEqualDeep(person, this.person)
    }

    @test()
    protected static async defaultsLoggedInToTrue() {
        delete this.person.isLoggedIn
        this.setRandomHomeAndLoginAsPerson()
        const person = this.loadSavedPersonFromJson()
        assert.isEqualDeep(person, { ...this.person, isLoggedIn: true })
    }

    @test()
    protected static async getsLoggedInPersonFromJson() {
        const person = this.person
        this.setRandomHomeDir()
        const contents = JSON.stringify(person)
        diskUtil.writeFile(this.personJsonPath, contents)
        const loggedInPerson = this.auth.getLoggedInPerson()
        assert.isEqualDeep(loggedInPerson, person)
    }

    private static loadSavedPersonFromJson() {
        const contents = diskUtil.readFile(this.personJsonPath)
        const person = JSON.parse(contents)
        return person as PersonWithToken
    }

    private static setRandomHomeAndLoginAsPerson() {
        this.setRandomHomeDir()
        this.auth.setLoggedInPerson(this.person)
    }

    private static setRandomHomeDir() {
        SpyAuthService.setHomeDir(
            this.resolvePath(diskUtil.createRandomTempDir())
        )
    }

    private static get personJsonPath() {
        return this.resolvePath(
            SpyAuthService.getHomeDir(),
            '.spruce',
            'person.json'
        )
    }
}

class SpyAuthService extends AuthService {
    public static setHomeDir(dir: string) {
        AuthService.homeDir = dir
    }
    public static getHomeDir() {
        return AuthService.homeDir
    }
}

import AbstractSpruceTest, { test, assert } from '@sprucelabs/test'
import EnvService from '../../services/EnvService'
import diskUtil from '../../utilities/disk.utility'

export default class EnvServiceTest extends AbstractSpruceTest {
    protected static async beforeEach() {
        await super.beforeEach()
        this.cwd = diskUtil.createRandomTempDir()
    }

    protected static Service() {
        return new EnvService(this.cwd)
    }

    @test()
    protected static async envService() {
        const service = this.Service()
        assert.isTruthy(service)
    }

    @test('Can set string', 'MY_KEY', 'MY_VALUE', 'MY_KEY="MY_VALUE"')
    @test('Can set boolean true', 'MY_KEY', true, 'MY_KEY=true')
    @test('Can set boolean false', 'MY_KEY', false, 'MY_KEY=false')
    @test('Can set integer', 'MY_KEY', 123, 'MY_KEY=123')
    @test('Can set negative integer', 'MY_KEY', -1, 'MY_KEY=-1')
    @test('Can set negative integer', 'MY_KEY', -1, 'MY_KEY=-1')
    @test(
        'Can set uuid',
        'MY_KEY',
        '5fdaccbd40a09d00459b0e71',
        'MY_KEY="5fdaccbd40a09d00459b0e71"'
    )
    protected static async canGetAndSet(
        key: string,
        value: string | boolean | number,
        expected: string
    ) {
        const service = this.Service()
        service.set(key, value)

        this.assertEnvIsExpected(expected)

        const actual = service.get(key)
        assert.isEqual(actual, value)
        assert.isEqual(process.env[key], `${value}`)
    }

    private static assertEnvIsExpected(expected: string) {
        const envPath = this.resolvePath('.env')
        const fileContents = diskUtil.readFile(envPath)
        assert.isEqual(fileContents, expected)
    }

    @test()
    protected static async canSetTwoUniqueKeys() {
        const service = this.Service()
        service.set('MY_KEY', 'MY_VALUE')
        service.set('OTHER_KEY', -1)

        this.assertEnvIsExpected('MY_KEY="MY_VALUE"\nOTHER_KEY=-1')

        assert.isEqual(service.get('MY_KEY'), 'MY_VALUE')
        assert.isEqual(service.get('OTHER_KEY'), -1)
    }

    @test()
    protected static gettingSomethingNeverSetReturnsUndefined() {
        const service = this.Service()
        const value = service.get('NEVER_BEEN_SET')
        assert.isUndefined(value)
    }

    @test()
    protected static async canSetTwoUniqueKeysAndChangeThem() {
        const service = this.Service()
        service.set('MY_KEY', 'MY_VALUE')
        service.set('OTHER_KEY', -1)
        service.set('MY_KEY', 'New')
        service.set('OTHER_KEY', -2)

        this.assertEnvIsExpected('MY_KEY="New"\nOTHER_KEY=-2')

        assert.isEqual(service.get('MY_KEY'), 'New')
        assert.isEqual(service.get('OTHER_KEY'), -2)
    }

    @test()
    protected static async getUnsetKeyReturnsUndefned() {
        const service = this.Service()
        const result = service.get('NOT_A_REAL_KEY')
        assert.isUndefined(result)
    }

    @test()
    protected static async canSetAndRetrieveJsonEncodedStrings() {
        const service = this.Service()

        service.set(
            'person',
            JSON.stringify({ firstName: 'tay', lastName: 'ro' })
        )
        service.set('anotherVar', true)

        const match = JSON.parse(service.get('person') as string)

        assert.isTruthy(match)
        assert.isEqualDeep(match, { firstName: 'tay', lastName: 'ro' })
        assert.isTrue(service.get('anotherVar') as boolean)
    }

    @test()
    protected static async canSaveWithNewlines() {
        const service = this.Service()
        const expected = `hey

there!`
        service.set('NEWLINES', expected)

        const actual = service.get('NEWLINES')

        assert.isEqual(actual, expected)
    }

    @test()
    protected static async honorsNonEnvFileEnv() {
        const service = this.Service()
        service.set('NEW_KEY', 'firstValue')
        const found = service.get('NEW_KEY')
        assert.isEqual(found, 'firstValue')

        process.env.NEW_KEY = 'secondValue'
        const found2 = service.get('NEW_KEY')
        assert.isEqual(found2, 'secondValue')
    }

    @test()
    protected static async processEnvRetainsTypes() {
        const input = 'true'
        const expected = true

        const service = this.Service()
        process.env.OTHER_KEY = input
        const actual = service.get('OTHER_KEY')

        assert.isEqual(actual, expected)
    }

    @test()
    protected static canUnset() {
        const service = this.Service()
        service.set('TEST', true)
        service.unset('TEST')
        assert.isUndefined(process.env.TEST)
    }
}

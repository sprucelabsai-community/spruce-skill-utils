import AbstractSpruceTest, {
    assert,
    generateId,
    test,
    suite,
} from '@sprucelabs/test-utils'
import { HASH_SPRUCE_DIR, HASH_SPRUCE_DIR_NAME } from '../../constants'
import SettingsService from '../../services/SettingsService'
import diskUtil from '../../utilities/disk.utility'

@suite()
export default class SettingsServiceTest extends AbstractSpruceTest {
    private settings!: SettingsService

    protected async beforeEach() {
        await super.beforeEach()
        this.cwd = diskUtil.createRandomTempDir()
        this.settings = new SettingsService(this.cwd)
    }

    @test()
    protected async canInstantiate() {
        assert.isTruthy(this.settings)
    }

    @test()
    protected defaultsFeatureAsNotInstalled() {
        const actual = this.settings.isMarkedAsInstalled('feature')
        assert.isFalse(actual)
    }

    @test()
    protected canMarkFeatureAsInstalled() {
        this.settings.markAsInstalled('feature')
        const actual = this.settings.isMarkedAsInstalled('feature')
        assert.isTrue(actual)
    }

    @test()
    protected isNotSkippedToStart() {
        const actual = this.settings.isMarkedAsPermanentlySkipped('feature')
        assert.isFalse(actual)
    }

    @test()
    protected canMarkAsSkipped() {
        let actual = this.settings.isMarkedAsPermanentlySkipped('feature')
        assert.isFalse(actual)
        this.settings.markAsPermanentlySkipped('feature')
        actual = this.settings.isMarkedAsPermanentlySkipped('feature')
        assert.isTrue(actual)
    }

    @test()
    protected canSetAndGetArbitrarySettings() {
        this.settings.set('test', true)
        assert.isTrue(this.settings.get('test'))

        this.settings.set('test2', 'hello')
        assert.isEqual(this.settings.get('test2'), 'hello')
    }

    @test()
    protected canUnsetArbitrarySetting() {
        this.settings.set('test', true)
        this.settings.unset('test')
        assert.isUndefined(this.settings.get('test'))
    }

    @test()
    protected savesNestedObjects() {
        this.settings.set('nested.object', { hey: 'there!' })
        const path = this.getSettingsPath()
        const contents = diskUtil.readFile(path)
        const settings = JSON.parse(contents)

        assert.isEqualDeep(settings, {
            nested: {
                object: {
                    hey: 'there!',
                },
            },
        })
    }

    @test()
    protected canGetNestedObject() {
        this.settings.set('nested.object', { hey: 'there!' })
        const actual = this.settings.get('nested.object.hey')
        assert.isEqual(actual, 'there!')
    }

    @test()
    protected canUnsetNestedObjects() {
        this.settings.set('nested.object', { hey: 'there!' })
        this.settings.unset('nested.object.hey')
        const actual = this.settings.get('nested.object.hey')
        assert.isFalsy(actual)
    }

    @test()
    protected unsettingClearsCache() {
        this.settings.set('nested.object', { hey: 'there!' })
        this.settings.unset('nested.object.hey')
        //@ts-ignore
        assert.isFalsy(this.settings.settings)
    }

    @test()
    protected async markingAsSkippedMeansNoLongerInstalled() {
        this.markAsInstalled('events')
        this.markAsPermanentlySkipped('events')
        this.assertNotInstalled('events')
    }

    @test()
    protected async onlyDisablesTheInstalledCodeWhenSkipped() {
        this.markAsInstalled('feature1')
        this.markAsInstalled('feature2')
        this.markAsPermanentlySkipped('feature2')
        this.assertNotInstalled('feature2')
        this.assertInstalled('feature1')
    }

    @test()
    protected async disablesEvenIfFeatureInMiddleOfOthers() {
        this.markAsPermanentlySkipped('feature1111')
        this.markAsInstalled('feature1')
        this.markAsInstalled('feature11')
        this.markAsInstalled('feature111')
        this.markAsPermanentlySkipped('feature11')
        this.assertInstalled('feature111')
        this.assertNotInstalled('feature11')
    }

    @test()
    protected async canSaveToDifferentFile() {
        const file = `${generateId()}.json`

        this.settings.setFile(file)

        const expected = diskUtil.resolvePath(this.cwd, HASH_SPRUCE_DIR, file)

        const actual = this.getSettingsPath()
        assert.isEqual(actual, expected)

        //@ts-ignore
        this.settings.write = (path: string, _contents: string) => {
            assert.isEqual(path, expected)
        }

        this.settings.set('test', true)
    }

    @test()
    protected async unsettingSomethingDoesNotCreateTheFile() {
        this.settings.unset('test')
        const path = this.getSettingsPath()
        assert.isFalse(diskUtil.doesFileExist(path))
    }

    @test()
    protected async usesExpectedDirForGoProject() {
        this.simulateGoModule()
        const path = this.getSettingsPath()
        const expected = this.resolvePath(
            this.cwd,
            HASH_SPRUCE_DIR_NAME,
            'settings.json'
        )
        assert.isEqual(
            path,
            expected,
            'Did not use expected path in Go project'
        )
    }

    @test()
    protected async savesAndLoadsSettingsInGoProject() {
        this.simulateGoModule()

        this.settings.set('goFeature', 'enabled')
        this.settings = new SettingsService(this.cwd)

        const actual = this.settings.get('goFeature')
        assert.isEqual(
            actual,
            'enabled',
            'Settings did not persist in Go project'
        )
    }

    private simulateGoModule() {
        diskUtil.writeFile(this.resolvePath('go.mod'), '')
    }
    private assertNotInstalled(code: string) {
        assert.isFalse(this.settings.isMarkedAsInstalled(code))
    }

    private assertInstalled(code: string) {
        assert.isTrue(this.settings.isMarkedAsInstalled(code))
    }

    private markAsPermanentlySkipped(code: string) {
        this.settings.markAsPermanentlySkipped(code)
    }

    private markAsInstalled(code: string) {
        this.settings.markAsInstalled(code)
    }

    private getSettingsPath() {
        //@ts-ignore
        return this.settings.getSettingsPath()
    }
}

import AbstractSpruceTest, { test, assert } from '@sprucelabs/test'
import addonUtil from '../../utilities/addon.utility'
import diskUtil from '../../utilities/disk.utility'

export default class ImportingAddonsTest extends AbstractSpruceTest {
    protected static async beforeEach(): Promise<void> {
        await super.beforeEach()
        this.cwd = diskUtil.createRandomTempDir()
    }

    @test()
    protected static async returnsZeroIfNoAddons() {
        await this.assertExpectedCount(0)
    }

    @test()
    protected static returnsZeroIfNoAddonsSync() {
        const total = addonUtil.importSync({}, this.cwd)
        assert.isEqual(total, 0)
    }

    @test()
    protected static async returnsOneIfOneFile() {
        diskUtil.writeFile(
            this.resolvePath('test.addon.js'),
            'module.exports = {}'
        )
        await this.assertExpectedCount(1)
    }

    @test()
    protected static returnsOneIfOneFileSync() {
        diskUtil.writeFile(
            this.resolvePath('test.addon.js'),
            'module.exports = {}'
        )
        this.assertExpectedCountSync(1)
    }

    private static async assertExpectedCount(expectedCount: number) {
        const total = await addonUtil.import({}, this.cwd)
        assert.isEqual(total, expectedCount)
    }

    private static assertExpectedCountSync(expectedCount: number) {
        const total = addonUtil.importSync({}, this.cwd)
        assert.isEqual(total, expectedCount)
    }
}

import AbstractSpruceTest, { test, suite, assert } from '@sprucelabs/test-utils'
import addonUtil from '../../utilities/addon.utility'
import diskUtil from '../../utilities/disk.utility'

@suite()
export default class ImportingAddonsTest extends AbstractSpruceTest {
    protected async beforeEach(): Promise<void> {
        await super.beforeEach()
        this.cwd = diskUtil.createRandomTempDir()
    }

    @test()
    protected async returnsZeroIfNoAddons() {
        await this.assertExpectedCount(0)
    }

    @test()
    protected returnsZeroIfNoAddonsSync() {
        const total = addonUtil.importSync({}, this.cwd)
        assert.isEqual(total, 0)
    }

    @test()
    protected async returnsOneIfOneFile() {
        diskUtil.writeFile(
            this.resolvePath('test.addon.js'),
            'module.exports = {}'
        )
        await this.assertExpectedCount(1)
    }

    @test()
    protected returnsOneIfOneFileSync() {
        diskUtil.writeFile(
            this.resolvePath('test.addon.js'),
            'module.exports = {}'
        )
        this.assertExpectedCountSync(1)
    }

    private async assertExpectedCount(expectedCount: number) {
        const total = await addonUtil.import({}, this.cwd)
        assert.isEqual(total, expectedCount)
    }

    private assertExpectedCountSync(expectedCount: number) {
        const total = addonUtil.importSync({}, this.cwd)
        assert.isEqual(total, expectedCount)
    }
}

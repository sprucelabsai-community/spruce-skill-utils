import AbstractSpruceTest, { assert, test } from '@sprucelabs/test-utils'
import PkgService from '../../services/PkgService'
import diskUtil from '../../utilities/disk.utility'

export default class PkgServiceTest extends AbstractSpruceTest {
    @test()
    protected static async leavesNewlineAtEnd() {
        this.cwd = diskUtil.createRandomTempDir()

        const path = this.resolvePath('package.json')
        diskUtil.writeFile(path, '{}')

        const pkg = new PkgService(this.cwd)
        pkg.set({
            path: 'name',
            value: 'another',
        })
        const expected = `{
  "name": "another"
}
`
        const contents = diskUtil.readFile(path)
        assert.isEqual(contents, expected)
    }
}

import AbstractSpruceTest, { test, suite, assert } from '@sprucelabs/test-utils'
import { errorAssert } from '@sprucelabs/test-utils'
import pluginUtil from '../../utilities/plugin.utility'

@suite()
export default class ImportingPluginsTest extends AbstractSpruceTest {
    @test()
    protected hasImportSyncFunction() {
        assert.isFunction(pluginUtil.importSync)
    }

    @test()
    protected importRequiresArrayToStart() {
        //@ts-ignore
        const err = assert.doesThrow(() => pluginUtil.importSync())
        errorAssert.assertError(err, 'MISSING_PARAMETERS', {
            parameters: ['args', 'path'],
        })
    }

    @test()
    protected importRequiresPathToStart() {
        const err = assert.doesThrow(() => pluginUtil.importSync([]))
        errorAssert.assertError(err, 'MISSING_PARAMETERS', {
            parameters: ['path'],
        })
    }

    @test()
    protected throwsWithBadArgs() {
        //@ts-ignore
        const err = assert.doesThrow(() => pluginUtil.importSync(true, 'test'))
        errorAssert.assertError(err, 'INVALID_PARAMETERS', {
            parameters: ['args'],
        })
    }

    @test('throws with bad path 1', ['/test'])
    @test('throws with bad path 2', ['/whatever'])
    protected throwsWithBadPath(path: string[]) {
        //@ts-ignore
        const err = assert.doesThrow(() => pluginUtil.importSync([], ...path))
        errorAssert.assertError(err, 'INVALID_PARAMETERS', {
            parameters: ['path'],
        })
    }

    @test()
    protected returnsEmptyResultsToStart() {
        const results = pluginUtil.importSync(
            [],
            this.cwd,
            'build',
            '__tests__',
            'testDirsAndFiles',
            'no-plugins'
        )

        assert.isArray(results)
    }

    @test()
    protected throwsWithPluginThatIsNotExportedAsDefaultAsAFunction() {
        const path = [
            this.cwd,
            'build',
            '__tests__',
            'testDirsAndFiles',
            'bad-plugins',
        ]

        const err = assert.doesThrow(() => pluginUtil.importSync([], ...path))

        errorAssert.assertError(err, 'INVALID_PLUGIN', {
            file: this.resolvePath(...path),
        })
    }

    @test('import many', 'plugins', ['no!', 'ooka!', 'yes!'])
    @test('import many 2', 'plugins-2', ['no!', 'first!', 'ooka!', 'yes!'])
    protected canImportManyPlugins(testDir: string, matches: string[]) {
        const path = [
            this.cwd,
            'build',
            '__tests__',
            'testDirsAndFiles',
            testDir,
        ]

        const plugins = pluginUtil.importSync([], ...path)

        assert.isLength(plugins, matches.length)

        for (let c = 0; c < matches.length; c++) {
            assert.isEqual(plugins[c], matches[c])
        }
    }
}

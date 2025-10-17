import AbstractSpruceTest, {
    assert,
    generateId,
    test,
    suite,
} from '@sprucelabs/test-utils'
import { ProjectLanguage } from '../../types/skill.types'
import diskUtil from '../../utilities/disk.utility'

@suite()
export default class DiskUtilTest extends AbstractSpruceTest {
    @test()
    protected canCreateDiskUtil() {
        assert.isTruthy(diskUtil)
    }

    @test()
    protected hasResolveFiles() {
        assert.isFunction(diskUtil.resolveFile)
    }

    @test()
    protected resolvingToAFileThatDoesNotExistReturnsFalse() {
        assert.isFalse(diskUtil.resolveFile('not', 'found') as boolean)
    }

    @test('resolves to file that exists', ['test.ts'])
    @test('resolves to file that exists 2', ['pathitem', 'test.ts'])
    protected findsFileThatExists(fileItems: string[]) {
        const destinationDir = diskUtil.createRandomTempDir()
        const filepath = this.resolvePath(destinationDir, ...fileItems)

        diskUtil.writeFile(filepath, 'go team!')

        const actual = diskUtil.resolveFile(destinationDir, ...fileItems)
        assert.isEqual(filepath, actual)
    }

    @test('resolves to ts files', '.ts')
    @test('resolves to ts files', '.js')
    protected resolveFileExtensions(extension: string) {
        const destinationDir = diskUtil.createRandomTempDir()
        const filepath = this.resolvePath(destinationDir, 'test' + extension)

        diskUtil.writeFile(filepath, 'go team!')

        const actual = diskUtil.resolveFile(destinationDir, 'test')

        assert.isEqual(actual, filepath)
    }

    @test()
    protected resolvesToJsFilesFirst() {
        const destinationDir = diskUtil.createRandomTempDir()
        const tsFile = this.resolvePath(destinationDir, 'test.ts')
        const jsFile = this.resolvePath(destinationDir, 'test.js')

        diskUtil.writeFile(tsFile, 'yay')
        diskUtil.writeFile(jsFile, 'yay')

        const actual = diskUtil.resolveFile(destinationDir, 'test')
        assert.isEqual(actual, jsFile)
    }

    @test('can resolve relative 1', '/test/hey', '/hey', '../../hey')
    @test('can resolve relative 2', '/test/what', '/no/go', '../../no/go')
    @test('can resolve relative 3', '/test/what', '/test/what/hey', './hey')
    @test(
        'can resolve relative 4',
        '/test/what',
        '/test/what/support/hey',
        './support/hey'
    )
    protected canResolveRelativePaths(
        path1: string,
        path2: string,
        expected: string
    ) {
        const actual = diskUtil.resolveRelativePath(path1, path2)
        assert.isEqual(actual, expected)
    }

    @test()
    protected throwsWhenPassedBadPath() {
        this.randomizeCwd()
        assert.doesThrow(() => this.resolveFileInHashSpruce('test'))
    }

    @test()
    protected async canResolveFileInHashSpruceDir() {
        this.assertResolvesFile(['build', '.spruce', 'test.ts'], 'test')
        this.assertResolvesFile(['src', '.spruce', 'test.js'], 'test')
        this.assertResolvesFile(
            ['src', '.spruce', 'test', 'whatever.js'],
            'test/whatever'
        )

        this.assertResolvesFile(
            ['src', '.spruce', 'events', 'events.contract.ts'],
            'events/events.contract'
        )
        this.assertResolvesFile(
            ['build', '.spruce', 'events', 'events.contract.js'],
            'events/events.contract'
        )
    }

    @test()
    protected async languageResolvesToTypescriptIfTsConfigExists() {
        this.randomizeCwd()
        this.writeTsConfig()
        this.assertProjectLanguageEquals('ts')
    }

    @test()
    protected async languageResolvesToJavaScriptIfNoTsConfigButPackageJsonExists() {
        this.randomizeCwd()
        this.writePackageJson()
        this.assertProjectLanguageEquals('js')
    }

    @test()
    protected async resolvesToTsIfBothTsConfigAndPackageJsonExist() {
        this.randomizeCwd()
        this.writePackageJson()
        this.writeTsConfig()
        this.assertProjectLanguageEquals('ts')
    }

    @test()
    protected async resolvesToTsIfHasEverything() {
        this.randomizeCwd()
        this.writePackageJson()
        this.writeTsConfig()
        diskUtil.writeFile(this.resolvePath('go.mod'), '')
        this.assertProjectLanguageEquals('ts')
    }

    @test()
    protected async resolvesToUnknownIfNothingExists() {
        this.randomizeCwd()
        this.assertProjectLanguageEquals('unknown')
    }

    private assertProjectLanguageEquals(expected: ProjectLanguage) {
        const lang = diskUtil.detectProjectLanguage(this.cwd)
        assert.isEqual(
            lang,
            expected,
            `diskUtil.detectProjectLanguage did not return expected language.`
        )
    }

    private writePackageJson() {
        const packageJsonPath = this.resolvePath('package.json')
        diskUtil.writeFile(packageJsonPath, '{}')
    }

    private writeTsConfig() {
        const tsConfigPath = this.resolvePath('tsconfig.json')
        diskUtil.writeFile(tsConfigPath, '{}')
    }

    private assertResolvesFile(filepath: string[], filename: string) {
        this.randomizeCwd()
        const file = this.resolvePath(...filepath)
        diskUtil.writeFile(file, generateId())
        this.resolveFileInHashSpruce(filename)
    }

    private randomizeCwd() {
        this.cwd = diskUtil.createRandomTempDir()
    }

    private resolveFileInHashSpruce(file: string): any {
        return diskUtil.resolveFileInHashSpruceDir(this.cwd, file)
    }
}

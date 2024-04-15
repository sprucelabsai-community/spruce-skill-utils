import AbstractSpruceTest from '@sprucelabs/test'
import { assert, generateId, test } from '@sprucelabs/test-utils'
import diskUtil from '../../utilities/disk.utility'

export default class DiskUtilTest extends AbstractSpruceTest {
    @test()
    protected static canCreateDiskUtil() {
        assert.isTruthy(diskUtil)
    }

    @test()
    protected static hasResolveFiles() {
        assert.isFunction(diskUtil.resolveFile)
    }

    @test()
    protected static resolvingToAFileThatDoesNotExistReturnsFalse() {
        assert.isFalse(diskUtil.resolveFile('not', 'found') as boolean)
    }

    @test('resolves to file that exists', ['test.ts'])
    @test('resolves to file that exists 2', ['pathitem', 'test.ts'])
    protected static findsFileThatExists(fileItems: string[]) {
        const destinationDir = diskUtil.createRandomTempDir()
        const filepath = this.resolvePath(destinationDir, ...fileItems)

        diskUtil.writeFile(filepath, 'go team!')

        const actual = diskUtil.resolveFile(destinationDir, ...fileItems)
        assert.isEqual(filepath, actual)
    }

    @test('resolves to ts files', '.ts')
    @test('resolves to ts files', '.js')
    protected static resolveFileExtensions(extension: string) {
        const destinationDir = diskUtil.createRandomTempDir()
        const filepath = this.resolvePath(destinationDir, 'test' + extension)

        diskUtil.writeFile(filepath, 'go team!')

        const actual = diskUtil.resolveFile(destinationDir, 'test')

        assert.isEqual(actual, filepath)
    }

    @test()
    protected static resolvesToJsFilesFirst() {
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
    protected static canResolveRelativePaths(
        path1: string,
        path2: string,
        expected: string
    ) {
        const actual = diskUtil.resolveRelativePath(path1, path2)
        assert.isEqual(actual, expected)
    }

    @test()
    protected static throwsWhenPassedBadPath() {
        this.randomCwd()
        assert.doesThrow(() => this.resolveFileInHashSpruce('test'))
    }

    @test()
    protected static async canResolveFileInHashSpruceDir() {
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

    private static assertResolvesFile(filepath: string[], filename: string) {
        this.randomCwd()
        const file = this.resolvePath(...filepath)
        diskUtil.writeFile(file, generateId())
        this.resolveFileInHashSpruce(filename)
    }

    private static randomCwd() {
        this.cwd = diskUtil.createRandomTempDir()
    }

    private static resolveFileInHashSpruce(file: string): any {
        return diskUtil.resolveFileInHashSpruceDir(this.cwd, file)
    }
}

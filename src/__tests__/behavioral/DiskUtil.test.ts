import AbstractSpruceTest, { test, assert } from '@sprucelabs/test'
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
}

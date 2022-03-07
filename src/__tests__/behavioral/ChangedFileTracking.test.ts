import AbstractSpruceTest, { test, assert } from '@sprucelabs/test'
import { errorAssert } from '@sprucelabs/test-utils'
import diskUtil from '../../utilities/disk.utility'

export default class ChangedFileTrackingTest extends AbstractSpruceTest {
	@test()
	protected static async hasHasFileChangedMethod() {
		assert.isFunction(diskUtil.hasFileChanged)
	}

	@test()
	protected static async throwsWhenMissingFileParamForHasFileChanged() {
		//@ts-ignore
		const err = assert.doesThrow(() => diskUtil.hasFileChanged())

		errorAssert.assertError(err, 'MISSING_PARAMETERS', {
			parameters: ['file'],
		})
	}

	@test()
	protected static async returnsTrueForNewFile() {
		this.cwd = diskUtil.createRandomTempDir()
		const file = this.resolvePath('somefile')

		diskUtil.writeFile(file, new Date().getTime().toString())

		const result = diskUtil.hasFileChanged(this.cwd, file)
		assert.isTrue(result)
	}

	@test()
	protected static async returnsTrueIfFileDoesntExist() {
		this.cwd = diskUtil.createRandomTempDir()
		const file = this.resolvePath('somefile')

		const result = diskUtil.hasFileChanged(this.cwd, file)

		assert.isTrue(result)
	}

	@test()
	protected static async returnsFalseForUnchangedFile() {
		this.cwd = diskUtil.createRandomTempDir()
		const file = this.resolvePath('somefile')
		diskUtil.writeFile(file, 'panda')

		diskUtil.hasFileChanged(this.cwd, file)
		const result = diskUtil.hasFileChanged(this.cwd, file)

		assert.isFalse(result)
	}

	@test()
	protected static async returnsTrueForChangedFile() {
		this.cwd = diskUtil.createRandomTempDir()
		const file = this.resolvePath('somefile')
		diskUtil.writeFile(file, 'panda')

		diskUtil.hasFileChanged(this.cwd, file)

		await this.wait(100)

		diskUtil.writeFile(file, 'panda2')
		const result = diskUtil.hasFileChanged(this.cwd, file)

		assert.isTrue(result)
	}

	@test()
	protected static async returnsFalseIfDifferentFileIsChanged() {
		this.cwd = diskUtil.createRandomTempDir()
		const file1 = this.resolvePath('somefile')

		this.cwd = diskUtil.createRandomTempDir()
		const file2 = this.resolvePath('somefile2')

		diskUtil.writeFile(file1, 'panda')
		const result1 = diskUtil.hasFileChanged(this.cwd, file1)
		assert.isTrue(result1)

		diskUtil.writeFile(file2, 'panda2')
		const result2 = diskUtil.hasFileChanged(this.cwd, file2)
		assert.isTrue(result2)

		const result3 = diskUtil.hasFileChanged(file1)

		assert.isFalse(result3)
	}

	@test()
	protected static async returnsTrueIfBothFilesAreChanged() {
		this.cwd = diskUtil.createRandomTempDir()
		const file1 = this.resolvePath('somefile')

		this.cwd = diskUtil.createRandomTempDir()
		const file2 = this.resolvePath('somefile2')

		diskUtil.writeFile(file1, 'panda')
		const result1 = diskUtil.hasFileChanged(this.cwd, file1)
		assert.isTrue(result1)

		diskUtil.writeFile(file2, 'panda2')
		const result2 = diskUtil.hasFileChanged(this.cwd, file2)
		assert.isTrue(result2)

		await this.wait(100)

		diskUtil.writeFile(file1, 'panda2')
		const result3 = diskUtil.hasFileChanged(this.cwd, file1)

		assert.isTrue(result3)
	}

	@test()
	protected static async trackingFolderShouldHaveGitIgnore() {
		this.cwd = diskUtil.createRandomTempDir()
		const file = this.resolvePath('somefile')
		diskUtil.writeFile(file, 'panda')

		diskUtil.hasFileChanged(this.cwd, file)

		const gitignoreFile = this.resolvePath(
			diskUtil.resolveCacheDirForDir(this.cwd),
			'.gitignore'
		)

		assert.isTrue(diskUtil.doesFileExist(gitignoreFile))

		const contents = diskUtil.readFile(gitignoreFile)
		assert.isEqual(contents, '*')
	}

	@test()
	protected static async canUpdateTrackedHash() {
		this.cwd = diskUtil.createRandomTempDir()
		const file = this.resolvePath('somefile')
		diskUtil.writeFile(file, 'panda')

		let result = diskUtil.hasFileChanged(this.cwd, file)
		assert.isTrue(result)

		await this.wait(100)
		diskUtil.writeFile(file, 'panda2')
		result = diskUtil.hasFileChanged(this.cwd, file)
		assert.isTrue(result)

		result = diskUtil.hasFileChanged(this.cwd, file)
		assert.isFalse(result)

		diskUtil.markFileAsUnchanged(this.cwd, file)
		result = diskUtil.hasFileChanged(this.cwd, file)
		assert.isFalse(result)

		diskUtil.markFileAsUnchanged(this.cwd, file)

		await this.wait(100)

		diskUtil.writeFile(file, 'panda')
		result = diskUtil.hasFileChanged(this.cwd, file)
		assert.isTrue(result)
	}
}

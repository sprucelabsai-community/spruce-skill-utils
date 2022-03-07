import AbstractSpruceTest, { test, assert } from '@sprucelabs/test'
import { errorAssert } from '@sprucelabs/test-utils'
import fsUtil from 'fs-extra'
import diskUtil from '../../utilities/disk.utility'

export default class CleaningEmptyDirsTest extends AbstractSpruceTest {
	@test()
	protected static throwsWhenMissingDir() {
		//@ts-ignore
		const err = assert.doesThrow(() => diskUtil.deleteEmptyDirs())

		errorAssert.assertError(err, 'MISSING_PARAMETERS', {
			parameters: ['dir'],
		})
	}

	@test()
	protected static throwsWhenDirNotFound() {
		const err = assert.doesThrow(() =>
			diskUtil.deleteEmptyDirs('/aoseuthaosenuthaosneuth')
		)

		errorAssert.assertError(err, 'INVALID_PARAMETERS', {
			parameters: ['dir'],
		})
	}

	@test()
	protected static async cleansEmptyDirs() {
		this.cwd = diskUtil.createRandomTempDir()

		for (const name of ['one', 'two', 'three']) {
			const dir = this.resolvePath(name)
			diskUtil.createDir(dir)
		}

		const read = fsUtil.readdirSync(this.cwd)
		assert.isEqual(read.length, 3)

		diskUtil.deleteEmptyDirs(this.cwd)
		const read2 = fsUtil.readdirSync(this.cwd)
		assert.isEqual(read2.length, 0)
	}
}

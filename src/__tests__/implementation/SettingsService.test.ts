import AbstractSpruceTest, { test, assert } from '@sprucelabs/test'
import diskUtil from '../../disk.utility'
import SettingsService from '../../services/SettingsService'

export default class SettingsServiceTest extends AbstractSpruceTest {
	private static service: SettingsService

	protected static async beforeEach() {
		await super.beforeEach()
		this.cwd = diskUtil.createRandomTempDir()
		this.service = new SettingsService(this.cwd)
	}

	@test()
	protected static async canInstantiate() {
		assert.isTruthy(this.service)
	}

	@test()
	protected static defaultsFeatureAsNotInstalled() {
		const actual = this.service.isMarkedAsInstalled('feature')
		assert.isFalse(actual)
	}

	@test()
	protected static canMarkFeatureAsInstalled() {
		this.service.markAsInstalled('feature')
		const actual = this.service.isMarkedAsInstalled('feature')
		assert.isTrue(actual)
	}

	@test()
	protected static isNotSkippedToStart() {
		const actual = this.service.isMarkedAsPermanentlySkipped('feature')
		assert.isFalse(actual)
	}

	@test()
	protected static canMarkAsSkipped() {
		let actual = this.service.isMarkedAsPermanentlySkipped('feature')
		assert.isFalse(actual)
		this.service.markAsPermanentlySkipped('feature')
		actual = this.service.isMarkedAsPermanentlySkipped('feature')
		assert.isTrue(actual)
	}
}

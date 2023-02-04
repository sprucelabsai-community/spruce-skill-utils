import AbstractSpruceTest from '@sprucelabs/test'
import { assert, test } from '@sprucelabs/test-utils'
import SettingsService from '../../services/SettingsService'
import diskUtil from '../../utilities/disk.utility'

export default class SettingsServiceTest extends AbstractSpruceTest {
	private static settings: SettingsService

	protected static async beforeEach() {
		await super.beforeEach()
		this.cwd = diskUtil.createRandomTempDir()
		this.settings = new SettingsService(this.cwd)
	}

	@test()
	protected static async canInstantiate() {
		assert.isTruthy(this.settings)
	}

	@test()
	protected static defaultsFeatureAsNotInstalled() {
		const actual = this.settings.isMarkedAsInstalled('feature')
		assert.isFalse(actual)
	}

	@test()
	protected static canMarkFeatureAsInstalled() {
		this.settings.markAsInstalled('feature')
		const actual = this.settings.isMarkedAsInstalled('feature')
		assert.isTrue(actual)
	}

	@test()
	protected static isNotSkippedToStart() {
		const actual = this.settings.isMarkedAsPermanentlySkipped('feature')
		assert.isFalse(actual)
	}

	@test()
	protected static canMarkAsSkipped() {
		let actual = this.settings.isMarkedAsPermanentlySkipped('feature')
		assert.isFalse(actual)
		this.settings.markAsPermanentlySkipped('feature')
		actual = this.settings.isMarkedAsPermanentlySkipped('feature')
		assert.isTrue(actual)
	}

	@test()
	protected static canSetAndGetArbitrarySettings() {
		this.settings.set('test', true)
		assert.isTrue(this.settings.get('test'))

		this.settings.set('test2', 'hello')
		assert.isEqual(this.settings.get('test2'), 'hello')
	}

	@test()
	protected static canUnsetArbitrarySetting() {
		this.settings.set('test', true)
		this.settings.unset('test')
		assert.isUndefined(this.settings.get('test'))
	}

	@test()
	protected static savesNestedObjects() {
		this.settings.set('nested.object', { hey: 'there!' })
		//@ts-ignore
		const path = this.settings.getSettingsPath()
		const contents = diskUtil.readFile(path)
		const settings = JSON.parse(contents)

		assert.isEqualDeep(settings, {
			nested: {
				object: {
					hey: 'there!',
				},
			},
		})
	}

	@test()
	protected static canGetNestedObject() {
		this.settings.set('nested.object', { hey: 'there!' })
		const actual = this.settings.get('nested.object.hey')
		assert.isEqual(actual, 'there!')
	}

	@test()
	protected static canUnsetNestedObjects() {
		this.settings.set('nested.object', { hey: 'there!' })
		this.settings.unset('nested.object.hey')
		const actual = this.settings.get('nested.object.hey')
		assert.isFalsy(actual)
	}

	@test()
	protected static unsettingClearsCache() {
		this.settings.set('nested.object', { hey: 'there!' })
		this.settings.unset('nested.object.hey')
		//@ts-ignore
		assert.isFalsy(this.settings.settings)
	}

	@test()
	protected static async markingAsSkippedMeansNoLongerInstalled() {
		this.markAsInstalled('events')
		this.markAsPermanentlySkipped('events')
		this.assertNotInstalled('events')
	}

	@test()
	protected static async onlyDisablesTheInstalledCodeWhenSkipped() {
		this.markAsInstalled('feature1')
		this.markAsInstalled('feature2')
		this.markAsPermanentlySkipped('feature2')
		this.assertNotInstalled('feature2')
		this.assertInstalled('feature1')
	}

	@test()
	protected static async disablesEvenIfFeatureInMiddleOfOthers() {
		this.markAsPermanentlySkipped('feature1111')
		this.markAsInstalled('feature1')
		this.markAsInstalled('feature11')
		this.markAsInstalled('feature111')
		this.markAsPermanentlySkipped('feature11')
		this.assertInstalled('feature111')
		this.assertNotInstalled('feature11')
	}

	private static assertNotInstalled(code: string) {
		assert.isFalse(this.settings.isMarkedAsInstalled(code))
	}

	private static assertInstalled(code: string) {
		assert.isTrue(this.settings.isMarkedAsInstalled(code))
	}

	private static markAsPermanentlySkipped(code: string) {
		this.settings.markAsPermanentlySkipped(code)
	}

	private static markAsInstalled(code: string) {
		this.settings.markAsInstalled(code)
	}
}
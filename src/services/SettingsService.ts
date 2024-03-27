import get from 'lodash/get'
import set from 'lodash/set'
import unset from 'lodash/unset'
import { HASH_SPRUCE_DIR } from '../constants'
import diskUtil from '../utilities/disk.utility'

export default class SettingsService<FeatureCode extends string = string> {
	private cwd: string
	private settings?: Settings
	private fileName = 'settings.json'

	public constructor(cwd: string) {
		this.cwd = cwd
	}

	public isMarkedAsInstalled(code: FeatureCode): boolean {
		const settings = this.loadSettings()
		return !!settings.installed?.find((c) => c === code)
	}

	public markAsInstalled(code: FeatureCode) {
		if (!this.isMarkedAsInstalled(code)) {
			const settings = this.loadSettings()
			if (!settings.installed) {
				settings.installed = []
			}
			if (settings.installed.indexOf(code) === -1) {
				settings.installed.push(code)
				this.saveSettings(settings)
			}
		}
	}

	public markAsPermanentlySkipped(code: FeatureCode) {
		const settings = this.loadSettings()
		if (!settings.skipped) {
			settings.skipped = []
		}

		if (settings.installed) {
			settings.installed = settings.installed.filter((c) => c !== code)
		}

		if (settings.skipped.indexOf(code) === -1) {
			settings.skipped.push(code)
			this.saveSettings(settings)
		}
	}

	public isMarkedAsPermanentlySkipped(code: FeatureCode): boolean {
		const settings = this.loadSettings()
		return !!settings.skipped?.find((c) => c === code)
	}

	public get(key: string): any {
		return get(this.loadSettings(), key)
	}

	public set(key: string, value: any) {
		const settings = this.loadSettings()
		set(settings, key, value)
		this.saveSettings(settings)
	}

	public unset(key: string) {
		const settings = this.loadSettings()
		unset(settings, key)
		this.saveSettings(settings)
		this.settings = undefined
	}

	private loadSettings(): Settings {
		const path = this.getSettingsPath()
		if (!this.settings) {
			try {
				const contents = diskUtil.readFile(path)
				this.settings = JSON.parse(contents)
			} catch {
				this.settings = {}
			}
		}
		return this.settings as Settings
	}

	protected getSettingsPath() {
		return diskUtil.resolvePath(this.cwd, HASH_SPRUCE_DIR, this.fileName)
	}

	private saveSettings(settings: Settings) {
		const path = diskUtil.resolvePath(
			this.cwd,
			HASH_SPRUCE_DIR,
			'settings.json'
		)
		const contents = JSON.stringify(settings, null, 2)
		diskUtil.writeFile(path, contents)
	}

	public setFile(name: string) {
		this.fileName = name
	}
}

export interface Settings<FeatureCode extends string = string> {
	installed?: FeatureCode[]
	skipped?: FeatureCode[]
	[key: string]: any
}

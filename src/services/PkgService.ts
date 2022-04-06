import pathUtil from 'path'
import fs from 'fs-extra'
import get from 'lodash/get'
import set from 'lodash/set'
import SpruceError from '../errors/SpruceError'
import { NpmPackage } from '../types/skill.types'
import diskUtil from '../utilities/disk.utility'

export default class PkgService {
	protected _parsedPkg?: Record<string, any>
	protected cwd: string

	public constructor(cwd: string) {
		this.cwd = cwd
	}

	public get(path: string | string[]) {
		const contents = this.readPackage()
		return get(contents, path)
	}

	public set(options: {
		path: string | string[]
		value: string | Record<string, any> | undefined
	}) {
		const { path, value } = options
		const contents = this.readPackage()
		const updated = set(contents, path, value)
		const destination = this.buildPath()

		fs.outputFileSync(destination, JSON.stringify(updated, null, 2))
		this._parsedPkg = undefined
	}

	public doesExist() {
		return diskUtil.doesFileExist(this.buildPath())
	}

	public unset(path: string | string[]) {
		this.set({ path, value: undefined })
	}

	public readPackage(): Record<string, any | undefined> {
		if (this._parsedPkg) {
			return this._parsedPkg
		}
		const packagePath = this.buildPath()

		try {
			const contents = fs.readFileSync(packagePath).toString()
			const parsed = JSON.parse(contents)
			this._parsedPkg = parsed

			return parsed
		} catch (err: any) {
			throw new SpruceError({
				code: 'INVALID_PACKAGE_JSON',
				path: packagePath,
				originalError: err,
				errorMessage: err.message,
			})
		}
	}

	private buildPath() {
		return pathUtil.join(this.cwd, 'package.json')
	}

	public isInstalled(pkg: string) {
		try {
			const contents = this.readPackage()

			return !!contents.dependencies?.[pkg] || !!contents.devDependencies?.[pkg]
		} catch (e) {
			return false
		}
	}

	public deleteLockFile() {
		const files = ['package-lock.json', 'yarn.lock']
		for (const file of files) {
			const lock = pathUtil.join(this.cwd, file)
			if (diskUtil.doesFileExist(lock)) {
				diskUtil.deleteFile(lock)
			}
		}
	}

	public stripLatest(name: string): string {
		return name.replace('@latest', '')
	}

	public buildPackageName(dep: NpmPackage): string {
		const { name, version } = dep
		if (!version) {
			return name
		}

		return `${name}@${version}`
	}
}

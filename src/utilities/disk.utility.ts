import { exec } from 'child_process'
import os from 'os'
import pathUtil from 'path'
import { SchemaError } from '@sprucelabs/schema'
import fsUtil from 'fs-extra'
import * as uuid from 'uuid'
import { HASH_SPRUCE_BUILD_DIR, HASH_SPRUCE_DIR } from '../constants'

export interface CreateFile {
	/** The relative path from the cwd, without a leading forward slash */
	relativePath: string
	/** The file contents, built with the template data */
	contents: string
}

const diskUtil = {
	writeFile(destination: string, contents: string) {
		fsUtil.outputFileSync(destination, contents)
	},

	readDir(destination: string) {
		return fsUtil.readdirSync(destination)
	},

	readFile(source: string) {
		if (!fsUtil.existsSync(source)) {
			throw new Error(`No file to read at ${source}`)
		}
		return fsUtil.readFileSync(source).toString()
	},

	deleteFile(destination: string) {
		if (fsUtil.existsSync(destination)) {
			fsUtil.removeSync(destination)
		}
	},

	createDir(destination: string) {
		fsUtil.ensureDirSync(destination)
	},

	moveDir(source: string, destination: string) {
		fsUtil.moveSync(source, destination)
	},

	moveFile(source: string, destination: string) {
		fsUtil.moveSync(source, destination)
	},

	async copyDir(source: string, destination: string) {
		this.createDir(destination)
		return new Promise((resolve, reject) => {
			exec(
				`cd ${source} && tar cf - . | (cd ${destination}; tar xf -)`,
				{ maxBuffer: 1024 * 1024 * 5 },
				(err, stdout) => {
					if (err) {
						reject(err)
						return
					}
					resolve(stdout)
				}
			)
		})
	},

	deleteDir(target: string) {
		const resolved = this.resolvePath(target)
		if (fsUtil.existsSync(resolved)) {
			fsUtil.removeSync(resolved)
		}
	},

	doesFileExist(target: string) {
		const resolved = this.resolvePath(target)
		return fsUtil.existsSync(resolved)
	},

	isDir(target: string) {
		const resolved = this.resolvePath(target)
		if (this.doesDirExist(resolved)) {
			return fsUtil.lstatSync(resolved).isDirectory()
		}

		return false
	},

	isDirPath(path: string) {
		const resolved = this.resolvePath(path)
		if (this.isDir(resolved)) {
			return true
		}

		return pathUtil.extname(resolved).length === 0
	},

	isFile(target: string) {
		const resolved = this.resolvePath(target)
		if (this.doesFileExist(resolved)) {
			return fsUtil.lstatSync(resolved).isFile()
		}

		return false
	},

	doesDirExist(target: string) {
		const resolved = this.resolvePath(target)
		return fsUtil.existsSync(resolved)
	},

	resolveHashSprucePath(cwd: string, ...filePath: string[]): string {
		const parts = cwd.split(pathUtil.sep)

		do {
			const path = pathUtil.join('/', ...parts, HASH_SPRUCE_DIR)
			if (this.doesDirExist(path)) {
				return this.resolvePath(path, ...filePath)
			}
			parts.pop()
		} while (parts.length > 0)

		throw new Error(`.spruce directory not found at ${cwd}`)
	},

	doesHashSprucePathExist(cwd: string, ...filePath: string[]): boolean {
		try {
			this.resolveHashSprucePath(cwd, ...filePath)
			return true
		} catch {
			return false
		}
	},

	resolveBuiltHashSprucePath(cwd: string, ...filePath: string[]): string {
		const parts = cwd.split(pathUtil.sep)

		do {
			const path = pathUtil.join('/', ...parts, HASH_SPRUCE_BUILD_DIR)
			if (this.doesDirExist(path)) {
				return this.resolvePath(path, ...filePath)
			}
			parts.pop()
		} while (parts.length > 0)

		throw new Error(
			`Built .spruce directory not found at ${cwd}. Try \`spruce build\` and try again.`
		)
	},

	doesBuiltHashSprucePathExist(cwd: string, ...filePath: string[]): boolean {
		try {
			this.resolveBuiltHashSprucePath(cwd, ...filePath)
			return true
		} catch {
			return false
		}
	},

	isFileDifferent(destination: string, contents: string) {
		const currentContents = this.readFile(destination)
		return currentContents != contents
	},

	deleteEmptyDirs(dir: string) {
		if (!dir) {
			throw new SchemaError({
				code: 'MISSING_PARAMETERS',
				parameters: ['dir'],
			})
		}

		if (!this.doesDirExist(dir)) {
			throw new SchemaError({
				code: 'INVALID_PARAMETERS',
				parameters: ['dir'],
				friendlyMessage: `No directory found at ${dir} to clean.`,
			})
		}

		const dirname = pathUtil.resolve(dir)

		const remove = (dir: string, depth = 0): void => {
			const thisDepth = depth + 1
			if (!diskUtil.isDir(dir)) {
				return
			}

			let files = fsUtil.readdirSync(dir)

			for (let filepath of files) {
				remove(pathUtil.join(dir, filepath), thisDepth)
			}

			let filesAfter = fsUtil.readdirSync(dir)
			if (depth > 0 && filesAfter.length === 0) {
				diskUtil.deleteDir(dir)
			}
		}

		return remove(dirname)
	},

	resolvePath(cwd: string, ...filePath: string[]): string {
		let builtPath = pathUtil.join(...filePath)

		if (builtPath[0] !== '/') {
			// Relative to the cwd
			if (builtPath.substr(0, 2) === './') {
				builtPath = builtPath.substr(1)
			}

			builtPath = pathUtil.join(cwd, builtPath)
		}

		if (builtPath.search('#') > -1) {
			builtPath = builtPath.replace('#spruce', HASH_SPRUCE_DIR)
		}

		return builtPath
	},

	resolveRelativePath(path1: string, path2: string) {
		const path = pathUtil.relative(path1, path2)
		if (path[0] !== '.') {
			return `.${pathUtil.sep}${path}`
		}

		return path
	},

	resolveFile(...pathItems: string[]) {
		const extensions = ['', '.js', '.ts']

		for (const extension of extensions) {
			const items = [...pathItems]
			items[pathItems.length - 1] += extension

			//@ts-ignore
			const resolved = this.resolvePath(...items)

			if (this.doesFileExist(resolved)) {
				return resolved
			}
		}

		return false
	},

	createTempDir(...files: string[]) {
		const tmpDir = os.tmpdir()
		const targetDir = pathUtil.join(tmpDir, ...files)
		this.createDir(targetDir)

		return targetDir
	},

	createRandomTempDir() {
		return this.createTempDir(uuid.v4())
	},

	hasFileChanged(...filePath: string[]): boolean {
		if (!filePath || !(filePath.length > 0)) {
			throw new SchemaError({
				code: 'MISSING_PARAMETERS',
				parameters: ['file'],
			})
		}

		//@ts-ignore
		const file = this.resolvePath(...filePath)
		const cacheFile = this.getFileChangedCacheFile(file)

		let fileStat
		try {
			fileStat = fsUtil.statSync(file)
		} catch (err) {
			return true
		}

		let cacheFileStat
		try {
			cacheFileStat = fsUtil.statSync(cacheFile)
		} catch (err) {
			//@ts-ignore
		}

		if (!cacheFileStat || cacheFileStat.ctimeMs < fileStat.ctimeMs) {
			this.writeFile(cacheFile, '')
			return true
		}

		return false
	},

	markFileAsUnchanged(...filePath: string[]) {
		const cacheCheckFile = this.getFileChangedCacheFile(
			//@ts-ignore
			this.resolvePath(...filePath)
		)
		diskUtil.writeFile(cacheCheckFile, '')
	},

	resolveCacheDirForDir(dir: string): string {
		return this.resolvePath(dir, '.change_cache')
	},

	getFileChangedCacheFile(file: string) {
		if (!file) {
			throw new SchemaError({
				code: 'MISSING_PARAMETERS',
				parameters: ['file'],
			})
		}

		const dirname = pathUtil.dirname(file)
		const filename = pathUtil.basename(file)
		const changeCacheDir = this.resolveCacheDirForDir(dirname)

		const cacheFile = this.resolvePath(
			changeCacheDir,
			filename.replace(/\.\./g, '__')
		)

		if (!this.doesDirExist(changeCacheDir)) {
			fsUtil.mkdirSync(changeCacheDir, { recursive: true })
		}

		const gitignoreFile = diskUtil.resolvePath(changeCacheDir, '.gitignore')

		if (!diskUtil.doesFileExist(gitignoreFile)) {
			diskUtil.writeFile(gitignoreFile, '*')
		}

		return cacheFile
	},
}
export default diskUtil

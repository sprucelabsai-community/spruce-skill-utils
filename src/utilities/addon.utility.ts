import pathUtil from 'path'
import globby from 'globby'

const addonUtil = {
	async import(options: any, ...path: string[]) {
		const results = await globby(pathUtil.join(...path, '**', '*.addon.[t|j]s'))

		const all = results.map((path) => {
			const result = require(path)
			if (typeof result?.default === 'function') {
				return result.default(options)
			}
		})

		await Promise.all(all)
	},
	importSync(options: any, ...path: string[]) {
		const results = globby.sync(pathUtil.join(...path, '**', '*.addon.[t|j]s'))

		results.forEach((path) => {
			const result = require(path)
			if (typeof result?.default === 'function') {
				result.default(options)
			}
		})
	},
}

export default addonUtil

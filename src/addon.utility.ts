import pathUtil from 'path'
import globby from 'globby'

const addonUtil = {
	async import(options: any, ...path: string[]) {
		const results = await globby(pathUtil.join(...path, '**', '*.addon.[t|j]s'))

		const all = results.map((path) => {
			const result = require(path)
			if (typeof result === 'function') {
				return result(options)
			}
		})

		await Promise.all(all)
	},
}

export default addonUtil

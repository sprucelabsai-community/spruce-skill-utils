export default function cloneDeep<T>(obj: T, filter?: Filter): T {
	const o = obj as any
	let result: any = o
	let type = {}.toString.call(o).slice(8, -1)
	if (type == 'Set') {
		return new Set([...o].map((value) => cloneDeep(value, filter))) as any
	}
	if (type == 'Map') {
		const items: any[] = []
		;[...o.entries()].forEach((kv) => {
			if (filter?.(kv[1], kv[0]) !== false) {
				items.push([cloneDeep(kv[0]), cloneDeep(kv[1])])
			}
		})
		return new Map(items) as any
	}
	if (type == 'Date') {
		return new Date(o.getTime()) as any
	}
	if (type == 'RegExp') {
		return RegExp(o.source, getRegExpFlags(o)) as any
	}
	if (type == 'Array' || type == 'Object') {
		result = Array.isArray(o) ? [] : {}
		for (let key in o) {
			if (filter?.(o[key], key) !== false) {
				result[key] = cloneDeep(o[key], filter)
			}
		}
	}

	// primitives and non-supported objects (e.g. functions) land here
	return result
}
function getRegExpFlags(regExp: any) {
	if (typeof regExp.source.flags == 'string') {
		return regExp.source.flags
	} else {
		let flags = []
		regExp.global && flags.push('g')
		regExp.ignoreCase && flags.push('i')
		regExp.multiline && flags.push('m')
		regExp.sticky && flags.push('y')
		regExp.unicode && flags.push('u')
		return flags.join('')
	}
}
type Filter = (value: any, key: string) => void | boolean

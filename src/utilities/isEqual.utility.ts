//@TODO write tests maybe? this is extracted from the calendar skill
export default function isEqual(a: any, b: any): boolean {
	if (a === b) {
		return true
	}
	if (a instanceof Date && b instanceof Date) {
		return a.getTime() === b.getTime()
	}
	if (!a || !b || (typeof a !== 'object' && typeof b !== 'object')) {
		return a === b
	}
	if (a.prototype !== b.prototype) {
		return false
	}
	a = removeUndefinedAndNullFields({ ...a })
	b = removeUndefinedAndNullFields({ ...b })
	const keys = Object.keys(a)
	if (keys.length !== Object.keys(b).length) {
		return false
	}
	return keys.every((k) => isEqual(a[k], b[k]))
}

function removeUndefinedAndNullFields(obj: any) {
	for (const key in obj) {
		if (obj[key] === undefined || obj[key] === null) {
			delete obj[key]
		}
	}

	return obj
}

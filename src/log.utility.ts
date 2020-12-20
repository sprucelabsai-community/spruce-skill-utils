import chalk from 'chalk'

export interface Log {
	info: (...args: string[]) => void
	error: (...args: string[]) => void
}

type Color = keyof typeof chalk

export function buildLog(
	prefix: string | undefined = undefined,
	colors?: { info?: Color; error?: Color }
) {
	const { info = 'yellow', error = 'red' } = colors ?? {}

	const logUtil: Log = {
		info(...args: string[]) {
			console.log((chalk[info] as typeof chalk).italic(prefix, ...args))
		},

		error(...args: string[]) {
			console.log((chalk[error] as typeof chalk).bold(prefix, ...args))
		},
	}

	return logUtil
}

export const mockLogUtil: Log = {
	info() {},
	error() {},
}

export default buildLog()

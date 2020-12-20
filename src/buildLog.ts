import chalk, { Chalk } from 'chalk'

interface LogOptions {
	log?: (...args: any[]) => void
	useColors?: boolean
	colors?: {
		info?: Color
		error?: Color
	}
}

export interface Log {
	readonly prefix: string | undefined
	info: (...args: string[]) => void
	error: (...args: string[]) => void
	buildLog(prefix: string | undefined, options?: LogOptions): Log
}

type Color = keyof typeof chalk

export default function buildLog(
	prefix: string | undefined = undefined,
	options?: LogOptions
) {
	const { colors = {}, log = console.log.bind(console), useColors } =
		options ?? {}
	const { info = 'yellow', error = 'red' } = colors

	const pre = prefix ? `${prefix} ::` : undefined

	const logUtil: Log = {
		prefix,

		info(...args: string[]) {
			const level = 'INFO'
			write('italic', args, level)
		},

		error(...args: string[]) {
			useColors
				? log((chalk[error] as typeof chalk).bold(pre, ...args))
				: log(`(ERROR)${pre ? ` ${pre}` : ''}`, ...args)
		},

		buildLog(prefix: string | undefined = undefined, options?: LogOptions) {
			return buildLog(`${pre ? `${pre} ` : ''}${prefix}`, { log, ...options })
		},
	}

	return logUtil

	function write(chalkMethod: keyof Chalk, args: any[], level: string) {
		useColors
			? log((chalk[info] as any)[chalkMethod](pre, ...args))
			: log(`(${level})${pre ? ` ${pre}` : ''}`, ...args)
	}
}

export const mockLogUtil: Log = {
	info() {},
	error() {},
	prefix: '',
	buildLog(prefix: string | undefined = undefined, options?: LogOptions) {
		return buildLog(prefix, options)
	},
}

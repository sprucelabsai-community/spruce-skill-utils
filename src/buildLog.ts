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
			//@ts-ignore
			write(chalk.italic[info], args, 'INFO')
		},

		error(...args: string[]) {
			//@ts-ignore
			write(chalk.bold[error], args, 'ERROR')
		},

		buildLog(prefix: string | undefined = undefined, options?: LogOptions) {
			return buildLog(`${pre ? `${pre} ` : ''}${prefix}`, {
				log,
				useColors,
				...options,
			})
		},
	}

	return logUtil

	function write(chalkMethod: Chalk, args: any[], level: string) {
		let chalkArgs = [...args]
		if (pre) {
			chalkArgs = [pre, ...chalkArgs]
		}

		useColors === false
			? log(`(${level})${pre ? ` ${pre}` : ''}`, ...args)
			: log(chalkMethod(...chalkArgs))
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

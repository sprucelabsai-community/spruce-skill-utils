import chalk, { Chalk } from 'chalk'

export interface LogOptions {
	log?: (...args: any[]) => void
	useColors?: boolean
	colors?: {
		info?: Color
		error?: Color
	}
}

export interface Log {
	readonly prefix: string | undefined
	info: (...args: string[]) => string
	error: (...args: string[]) => string
	warn: (...args: string[]) => string
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
			return write(chalk.green[info], args, 'INFO')
		},

		warn(...args: string[]) {
			//@ts-ignore
			return write(chalk.yellow[info], args, 'WARN')
		},

		error(...args: string[]) {
			//@ts-ignore
			return write(chalk.red[error], args, 'ERROR')
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

		const message =
			useColors === false
				? `(${level})${pre ? ` ${pre}` : ''}`
				: chalkMethod(...chalkArgs)

		if (useColors === false) {
			log(message, ...args)
		} else {
			log(message)
		}

		return message
	}
}

export const mockLogUtil: Log = {
	info: (m: string) => m,
	error: (m: string) => m,
	warn: (m: string) => m,
	prefix: '',
	buildLog() {
		return mockLogUtil
	},
}

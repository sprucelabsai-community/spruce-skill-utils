import chalk, { Chalk } from 'chalk'

export interface LogOptions {
	log?: (...args: any[]) => void
	useColors?: boolean
	colors?: {
		info?: Color
		error?: Color
	}
}

export type Level = 'ERROR' | 'INFO' | 'WARN'
type Transport = (...messageParts: string[]) => void
const transports: Record<Level, Transport> = {}

export function setLogTransport(level: Level, cb: Transport) {
	transports[level] = cb
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
	const { colors = {}, log, useColors } = options ?? {}
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

	function getTransport(level: Level) {
		if (transports[level]) {
			return transports[level]
		}
		return (
			log ??
			(level === 'ERROR'
				? (...args: []) => {
						process.stderr.write(args.join('\n') + '\n')
				  }
				: console.log.bind(console))
		)
	}

	function write(chalkMethod: Chalk, args: any[], level: Level) {
		let chalkArgs = [...args]
		if (pre) {
			chalkArgs = [pre, ...chalkArgs]
		}

		let transport = getTransport(level)

		const message =
			useColors === false
				? `(${level})${pre ? ` ${pre}` : ''}`
				: chalkMethod(...chalkArgs)

		if (useColors === false) {
			transport(message, ...args)
		} else {
			transport(message)
		}

		return message
	}
}

export const mockLog: Log = {
	info: (m: string) => m,
	error: (m: string) => m,
	warn: (m: string) => m,
	prefix: '',
	buildLog() {
		return mockLog
	},
}

export const testLog = buildLog('TEST', {
	log: (...parts: any[]) => {
		process.stderr.write(parts.join(' ') + '\n')
	},
})

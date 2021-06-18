import chalk, { Chalk } from 'chalk'

export interface LogOptions {
	log?: (...args: any[]) => void
	useColors?: boolean
	transportsByLevel?: Partial<TransportMap>
	colors?: {
		info?: Color
		error?: Color
	}
}

export type Level = 'ERROR' | 'INFO' | 'WARN'
export type LogTransport = (...messageParts: string[]) => void
type TransportMap = Record<Level, LogTransport | null | undefined>

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

	const transports: TransportMap = {
		ERROR: options?.transportsByLevel?.ERROR,
		INFO: options?.transportsByLevel?.INFO,
		WARN: options?.transportsByLevel?.WARN,
	}

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
				transportsByLevel: transports,
				...options,
			})
		},
	}

	return logUtil

	function getTransport(level: Level): LogTransport {
		return transports[level] as LogTransport
	}

	function write(chalkMethod: Chalk, args: any[], level: Level) {
		let chalkArgs = [...args]
		if (pre) {
			chalkArgs = [pre, ...chalkArgs]
		}
		const prefix = `${pre ? ` ${pre}` : ''}`

		let transport = getTransport(level)
		if (transport) {
			transport(...[prefix.trim(), ...args])
			return prefix
		}

		transport =
			log ??
			(level === 'ERROR'
				? (...args: []) => {
						process.stderr.write(args.join('\n') + '\n')
				  }
				: console.log.bind(console))

		const message =
			useColors === false ? `(${level})${prefix}` : chalkMethod(...chalkArgs)

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

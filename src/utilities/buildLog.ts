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

const getMaxLogPrefixesLength = () => {
	return typeof process?.env?.MAXIMUM_LOG_PREFIXES_LENGTH === 'string'
		? +process.env.MAXIMUM_LOG_PREFIXES_LENGTH
		: undefined
}

export default function buildLog(
	prefix: string | undefined = undefined,
	options?: LogOptions
) {
	const { colors = {}, log, useColors } = options ?? {}
	const { info = 'yellow', error = 'red' } = colors
	let lastLogTimeMs = Date.now()

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
		let builtPrefix = pre
		if (pre) {
			const length = getMaxLogPrefixesLength()
			if (typeof length === 'number' && !isNaN(length)) {
				const parts = pre.split(' :: ')
				builtPrefix = parts.splice(parts.length - length, length).join(' :: ')
			}
			chalkArgs = [builtPrefix, ...chalkArgs]
		}
		const prefix = `${builtPrefix ? ` ${builtPrefix}` : ''}`

		let transport = getTransport(level)
		if (transport) {
			transport(...[prefix.trim(), ...args].filter((t) => t && t.length > 0))
			return prefix
		}

		transport =
			log ??
			(level === 'ERROR'
				? (...args: []) => {
						process.stderr.write(args.join(' ') + '\n')
				  }
				: console.log.bind(console))

		let message =
			useColors === false ? `(${level})${prefix}` : chalkMethod(...chalkArgs)

		if (process.env.SHOULD_LOG_TIME_DETLAS !== 'false') {
			const now = Date.now()
			const diff = now - lastLogTimeMs
			lastLogTimeMs = now
			message = `(${diff}ms) ${message}`
		}

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

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
type TransportMap = Record<
    Level,
    LogTransport | LogTransport[] | null | undefined
>

function getProcess() {
    if (typeof process !== 'undefined') {
        return process
    }
    return null
}

type Anything = string | number | boolean | null | undefined | Error

export type LoggableType = Anything | Anything[] | Record<string, Anything>

export interface Log {
    readonly prefix: string | undefined
    info: (...args: LoggableType[]) => string
    error: (...args: LoggableType[]) => string
    warn: (...args: LoggableType[]) => string
    buildLog(prefix: string | undefined, options?: LogOptions): Log
}

type Color = keyof typeof chalk

let lastLogTimeMs = Date.now()

const getMaxLogPrefixesLength = () => {
    return typeof getProcess()?.env?.MAXIMUM_LOG_PREFIXES_LENGTH === 'string'
        ? +(getProcess()?.env?.MAXIMUM_LOG_PREFIXES_LENGTH as string)
        : undefined
}

export default function buildLog(
    prefix: string | undefined = undefined,
    options?: LogOptions
) {
    const { colors = {}, log, useColors } = options ?? {}
    const { info = 'yellow', error = 'red' } = colors

    const isInteractive = getProcess()?.stdout?.isTTY
    const shouldUseColors = useColors !== false && isInteractive

    const pre = prefix ? `${prefix} ::` : undefined

    const transports: TransportMap = {
        ERROR: options?.transportsByLevel?.ERROR,
        INFO: options?.transportsByLevel?.INFO,
        WARN: options?.transportsByLevel?.WARN,
    }

    const logUtil: Log = {
        prefix,
        info(...args: LoggableType[]) {
            //@ts-ignore
            return write(chalk?.green?.[info], args, 'INFO')
        },

        warn(...args: LoggableType[]) {
            //@ts-ignore
            return write(chalk?.yellow?.[info], args, 'WARN')
        },

        error(...args: LoggableType[]) {
            //@ts-ignore
            return write(chalk?.red?.[error], args, 'ERROR')
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

    function getTransports(level: Level): LogTransport[] {
        const t = transports[level]
        if (!t) {
            return []
        }
        if (!Array.isArray(t)) {
            return [t] as LogTransport[]
        }

        return t as LogTransport[]
    }

    function write(chalkMethod: Chalk, rawArgs: any[], level: Level) {
        const args = rawArgs.map((a) => a?.toString?.() ?? 'undefined')
        let chalkArgs = [...args]
        let builtPrefix = pre

        if (pre) {
            const length = getMaxLogPrefixesLength()
            if (typeof length === 'number' && !isNaN(length)) {
                const parts = pre.split(' :: ')
                builtPrefix = parts
                    .splice(parts.length - length, length)
                    .join(' :: ')
            }
            chalkArgs = [builtPrefix, ...chalkArgs]
        }
        const prefix = `${builtPrefix ? ` ${builtPrefix}` : ''}`

        let transports = getTransports(level)
        if (transports.length > 0) {
            for (const transport of transports) {
                transport(
                    ...[prefix.trim(), ...args].filter((t) => t && t.length > 0)
                )
            }
            return prefix
        }

        const env = getProcess()?.env ?? {}
        let logMethod: 'log' | 'warn' | 'error' = 'log'

        switch (level) {
            case 'ERROR':
                logMethod = 'error'
                break
            case 'WARN':
                logMethod = 'warn'
                break
            default:
                logMethod = 'log'
                break
        }

        const transport =
            log ??
            (level === 'ERROR' && getProcess()?.stderr?.write
                ? (...args: []) => {
                      getProcess()?.stderr.write(args.join(' ') + '\n')
                  }
                : (console[logMethod] ?? console.log).bind(console))

        let message =
            shouldUseColors === false
                ? `(${level})${prefix}`
                : chalkMethod(...chalkArgs)

        if (env.SHOULD_LOG_TIME_DETLAS !== 'false') {
            const now = Date.now()
            const diff = now - lastLogTimeMs
            lastLogTimeMs = now
            message = `(${diff}ms) ${message}`
        }

        if (env.SHOULD_LOG_TIME !== 'false') {
            message = `(${new Date().toISOString()}) ${message}`
        }

        if (shouldUseColors === false) {
            transport(message, ...args)
        } else {
            transport(message)
        }

        return message
    }
}

export const testLog = buildLog('TEST', {
    log: (...parts: any[]) => {
        getProcess()?.stderr?.write?.(parts.join(' ') + '\n')
    },
})

export const stubLog = buildLog('STUB', {
    log: () => {},
    useColors: false,
})

import chalk, { Chalk } from 'chalk'

export class Logger implements Log {
    public readonly prefix: string | undefined

    private readonly baseLog?: (...args: any[]) => void
    private readonly useColorsOption?: boolean
    private readonly transports: TransportMap
    private readonly colors: { info: Color; error: Color }
    private readonly pre: string | undefined
    private readonly shouldUseColors: boolean
    private static history: string[] = []
    private static historyLimit = 0

    public constructor(
        prefix: string | undefined = undefined,
        options?: LogOptions
    ) {
        const { colors = {}, log, useColors, transportsByLevel } = options ?? {}
        const { info = 'yellow', error = 'red' } = colors

        this.prefix = prefix
        this.baseLog = log
        this.useColorsOption = useColors
        this.transports = {
            ERROR: transportsByLevel?.ERROR,
            INFO: transportsByLevel?.INFO,
            WARN: transportsByLevel?.WARN,
        }

        this.colors = { info, error }
        this.pre = prefix ? `${prefix} ::` : undefined

        const isInteractive = getProcess()?.stdout?.isTTY ?? false
        this.shouldUseColors = useColors !== false && isInteractive
    }

    public info(...args: LoggableType[]): string {
        return this.write(
            this.resolveChalk('green', this.colors.info),
            args,
            'INFO'
        )
    }

    public warn(...args: LoggableType[]): string {
        return this.write(
            this.resolveChalk('yellow', this.colors.info),
            args,
            'WARN'
        )
    }

    public error(...args: LoggableType[]): string {
        return this.write(
            this.resolveChalk('red', this.colors.error),
            args,
            'ERROR'
        )
    }

    public buildLog(
        prefix: string | undefined = undefined,
        options?: LogOptions
    ): Log {
        const childPrefix = this.combinePrefixes(prefix)

        return new Logger(childPrefix, {
            log: this.baseLog,
            useColors: this.useColorsOption,
            transportsByLevel: this.transports,
            ...options,
        })
    }

    private get history() {
        return Logger.history
    }

    private get historyLimit() {
        return Logger.historyLimit
    }

    private set historyLimit(value: number) {
        Logger.historyLimit = value
    }

    public static getHistory() {
        return this.history
    }

    private write(
        chalkMethod: Chalk | undefined,
        rawArgs: LoggableType[],
        level: Level
    ): string {
        if (!this.shouldWrite(level)) {
            return ''
        }

        const shouldLog = this.shouldLog()

        const formattedArgs = this.formatArgs(rawArgs)
        const { prefix, logArgs: logArgs } = this.buildPrefixes(formattedArgs)

        const joined = rawArgs.join(' ')
        const flattened = prefix ? prefix + ' ' + joined : joined

        if (this.historyLimit > 0) {
            this.history.push(flattened)
            if (this.history.length > this.historyLimit) {
                this.history.shift()
            }
        }

        if (
            !shouldLog ||
            this.dispatchToTransports(level, prefix, formattedArgs)
        ) {
            return flattened
        }

        const transport = this.resolveTransport(
            level,
            this.resolveConsoleMethod(level)
        )
        const message = this.buildMessage(chalkMethod, logArgs, level, prefix)

        this.emit(transport, message, formattedArgs, rawArgs)

        return message
    }

    private shouldLog() {
        return (
            this.isMainModule() ||
            (this.prefix &&
                this.env.SPRUCE_LOGS?.split(',')
                    .map((s) => s.trim())
                    .includes(this.prefix))
        )
    }

    private resolveChalk(base: Color, modifier: Color): Chalk | undefined {
        const baseMethod = (chalk as any)?.[base] as Chalk | undefined
        if (!baseMethod) {
            return undefined
        }
        const styled = (baseMethod as any)?.[modifier]
        return (styled as Chalk | undefined) ?? baseMethod
    }

    private combinePrefixes(next: string | undefined): string | undefined {
        if (next === undefined) {
            return this.prefix
        }

        if (!this.pre) {
            return next
        }

        return `${this.pre} ${next}`
    }

    private formatArgs(rawArgs: LoggableType[]): string[] {
        return rawArgs.map((arg) => this.formatArg(arg))
    }

    private buildPrefixes(args: string[]): {
        prefix: string
        logArgs: string[]
    } {
        if (!this.pre) {
            return {
                prefix: '',
                logArgs: [...args],
            }
        }

        const reducedPrefix = this.reducePrefix(this.pre)
        const prefixValue = reducedPrefix.length > 0 ? ` ${reducedPrefix}` : ''
        const logArgs =
            reducedPrefix.length > 0 ? [reducedPrefix, ...args] : [...args]
        return {
            prefix: prefixValue.trim(),
            logArgs,
        }
    }

    private reducePrefix(prefix: string): string {
        const length = getMaxLogPrefixesLength()
        if (typeof length === 'number' && !Number.isNaN(length)) {
            if (length <= 0) {
                return ''
            }
            const parts = prefix.split(' :: ')
            return parts.slice(-length).join(' :: ')
        }
        return prefix
    }

    private dispatchToTransports(
        level: Level,
        prefix: string,
        args: string[]
    ): boolean {
        const transports = this.getTransports(level)
        if (transports.length === 0) {
            return false
        }

        const payload = [prefix, ...args].filter(
            (part): part is string => part.length > 0
        )

        for (const transport of transports) {
            transport(...payload)
        }

        return true
    }

    private buildMessage(
        chalkMethod: Chalk | undefined,
        logArgs: string[],
        level: Level,
        prefix: string
    ): string {
        const baseMessage =
            this.shouldUseColors && chalkMethod
                ? chalkMethod(...logArgs)
                : this.buildPlainMessage(level, prefix)

        const withDelta = this.shouldLogTimeDeltas
            ? this.decorateWithTimeDelta(baseMessage)
            : baseMessage

        return this.shouldLogTime
            ? this.decorateWithTimestamp(withDelta)
            : withDelta
    }

    private buildPlainMessage(level: Level, prefix: string): string {
        return `(${level})${prefix ? ' ' + prefix : ''}`
    }

    private decorateWithTimeDelta(message: string): string {
        const now = Date.now()
        const diff = now - lastLogTimeMs
        lastLogTimeMs = now
        return `(${diff}ms) ${message}`
    }

    private decorateWithTimestamp(message: string): string {
        return `(${new Date().toISOString()}) ${message}`
    }

    private emit(
        transport: TransportDescriptor,
        message: string,
        formattedArgs: string[],
        rawArgs: LoggableType[]
    ): void {
        if (transport.isConsole) {
            transport.fn(message, ...rawArgs)
            return
        }

        if (this.shouldUseColors === false) {
            transport.fn(message, ...formattedArgs)
            return
        }

        transport.fn(message)
    }

    private getTransports(level: Level): LogTransport[] {
        const transport = this.transports[level]
        if (!transport) {
            return []
        }
        return Array.isArray(transport) ? transport : [transport]
    }

    private resolveConsoleMethod(level: Level): 'log' | 'warn' | 'error' {
        switch (level) {
            case 'ERROR':
                return 'error'
            case 'WARN':
                return 'warn'
            default:
                return 'log'
        }
    }

    private resolveTransport(
        level: Level,
        logMethod: 'log' | 'warn' | 'error'
    ): TransportDescriptor {
        if (this.baseLog) {
            const logFn = this.baseLog
            return {
                fn: (...parts: LoggableType[]) => {
                    logFn(...parts)
                },
                isConsole: false,
            }
        }

        if (level === 'ERROR' && getProcess()?.stderr?.write) {
            return {
                fn: (...parts: LoggableType[]) => {
                    const stringParts = parts.map((part) =>
                        typeof part === 'string' ? part : this.formatArg(part)
                    )
                    getProcess()?.stderr?.write?.(stringParts.join(' ') + '\n')
                },
                isConsole: false,
            }
        }

        const consoleMethod = (console[logMethod] ?? console.log).bind(console)
        return {
            fn: (...parts: LoggableType[]) => {
                consoleMethod(...parts)
            },
            isConsole: true,
        }
    }

    private get env(): NodeJS.ProcessEnv {
        return getProcess()?.env ?? {}
    }

    private get logLevel(): string | undefined {
        return this.env.LOG_LEVEL ?? undefined
    }

    private get shouldWrite(): (level: Level) => boolean {
        const levelSetting = this.logLevel
        return (level: Level) => shouldWrite(levelSetting, level)
    }

    private get shouldLogTimeDeltas(): boolean {
        return this.env.SHOULD_LOG_TIME_DELTAS !== 'false'
    }

    private get shouldLogTime(): boolean {
        return this.env.SHOULD_LOG_TIME !== 'false'
    }

    private formatArg(value: LoggableType): string {
        const formatter = (value as any)?.toString
        if (typeof formatter === 'function') {
            return formatter.call(value)
        }
        return 'undefined'
    }

    protected isMainModule(): boolean {
        return true
    }

    public startTrackingHistory(limit: number): void {
        this.historyLimit = limit
    }

    public stopTrackingHistory() {
        this.historyLimit = 0
    }

    public getIsTrackingHistory() {
        return this.historyLimit > 0
    }

    public getHistoryLimit() {
        return this.historyLimit
    }
}

export default function buildLog(
    prefix: string | undefined = undefined,
    options?: LogOptions
): Log {
    return new Logger(prefix, options)
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

function shouldWrite(logLevel: string | undefined, level: Level): boolean {
    switch (logLevel?.toLowerCase()) {
        case 'none':
            return false
        case 'error':
            return level === 'ERROR'
        case 'warn':
            return level !== 'INFO'
        default:
            return true
    }
}

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
type Anything = string | number | boolean | null | undefined | Error | unknown

export type LoggableType = Anything | Anything[] | Record<string, Anything>

export type LogTransport = (...messageParts: string[]) => void
type TransportMap = Record<
    Level,
    LogTransport | LogTransport[] | null | undefined
>

interface TransportDescriptor {
    fn: (...messageParts: LoggableType[]) => void
    isConsole: boolean
}

function getProcess() {
    if (typeof process !== 'undefined') {
        return process
    }
    return null
}

export interface Log {
    readonly prefix: string | undefined
    stopTrackingHistory: () => void
    getIsTrackingHistory: () => boolean
    getHistoryLimit: () => number
    startTrackingHistory: (limit: number) => void
    getHistory: () => string[]
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

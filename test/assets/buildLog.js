const chalk = null;
class Logger {
    constructor(prefix = undefined, options) {
        var _a, _b, _c;
        const { colors = {}, log, useColors, transportsByLevel } = options !== null && options !== void 0 ? options : {};
        const { info = 'yellow', error = 'red' } = colors;
        this.prefix = prefix;
        this.baseLog = log;
        this.useColorsOption = useColors;
        this.transports = {
            ERROR: transportsByLevel === null || transportsByLevel === void 0 ? void 0 : transportsByLevel.ERROR,
            INFO: transportsByLevel === null || transportsByLevel === void 0 ? void 0 : transportsByLevel.INFO,
            WARN: transportsByLevel === null || transportsByLevel === void 0 ? void 0 : transportsByLevel.WARN,
        };
        this.colors = { info, error };
        this.pre = prefix ? `${prefix} ::` : undefined;
        const isInteractive = (_c = (_b = (_a = getProcess()) === null || _a === void 0 ? void 0 : _a.stdout) === null || _b === void 0 ? void 0 : _b.isTTY) !== null && _c !== void 0 ? _c : false;
        this.shouldUseColors = useColors !== false && isInteractive;
    }
    info(...args) {
        return this.write(this.resolveChalk('green', this.colors.info), args, 'INFO');
    }
    warn(...args) {
        return this.write(this.resolveChalk('yellow', this.colors.info), args, 'WARN');
    }
    error(...args) {
        return this.write(this.resolveChalk('red', this.colors.error), args, 'ERROR');
    }
    buildLog(prefix = undefined, options) {
        const childPrefix = this.combinePrefixes(prefix);
        return new Logger(childPrefix, Object.assign({ log: this.baseLog, useColors: this.useColorsOption, transportsByLevel: this.transports }, options));
    }
    write(chalkMethod, rawArgs, level) {
        if (!this.shouldWrite(level)) {
            return '';
        }
        const formattedArgs = this.formatArgs(rawArgs);
        const { prefix, chalkArgs } = this.buildPrefixes(formattedArgs);
        if (this.dispatchToTransports(level, prefix, formattedArgs)) {
            return prefix;
        }
        const transport = this.resolveTransport(level, this.resolveConsoleMethod(level));
        const message = this.buildMessage(chalkMethod, chalkArgs, level, prefix);
        this.emit(transport, message, formattedArgs, rawArgs);
        return message;
    }
    resolveChalk(base, modifier) {
        var _a;
        const baseMethod = chalk === null || chalk === void 0 ? void 0 : chalk[base];
        if (!baseMethod) {
            return undefined;
        }
        const styled = baseMethod === null || baseMethod === void 0 ? void 0 : baseMethod[modifier];
        return (_a = styled) !== null && _a !== void 0 ? _a : baseMethod;
    }
    combinePrefixes(next) {
        if (next === undefined) {
            return this.prefix;
        }
        if (!this.pre) {
            return next;
        }
        return `${this.pre} ${next}`;
    }
    formatArgs(rawArgs) {
        return rawArgs.map((arg) => this.formatArg(arg));
    }
    buildPrefixes(args) {
        if (!this.pre) {
            return {
                prefix: '',
                chalkArgs: [...args],
            };
        }
        const reducedPrefix = this.reducePrefix(this.pre);
        const prefixValue = reducedPrefix.length > 0 ? ` ${reducedPrefix}` : '';
        const chalkArgs = reducedPrefix.length > 0 ? [reducedPrefix, ...args] : [...args];
        return {
            prefix: prefixValue,
            chalkArgs,
        };
    }
    reducePrefix(prefix) {
        const length = getMaxLogPrefixesLength();
        if (typeof length === 'number' && !Number.isNaN(length)) {
            if (length <= 0) {
                return '';
            }
            const parts = prefix.split(' :: ');
            return parts.slice(-length).join(' :: ');
        }
        return prefix;
    }
    dispatchToTransports(level, prefix, args) {
        const transports = this.getTransports(level);
        if (transports.length === 0) {
            return false;
        }
        const payload = [prefix.trim(), ...args].filter((part) => part.length > 0);
        for (const transport of transports) {
            transport(...payload);
        }
        return true;
    }
    buildMessage(chalkMethod, chalkArgs, level, prefix) {
        const baseMessage = this.shouldUseColors && chalkMethod
            ? chalkMethod(...chalkArgs)
            : this.buildPlainMessage(level, prefix);
        const withDelta = this.shouldLogTimeDeltas
            ? this.decorateWithTimeDelta(baseMessage)
            : baseMessage;
        return this.shouldLogTime
            ? this.decorateWithTimestamp(withDelta)
            : withDelta;
    }
    buildPlainMessage(level, prefix) {
        return `(${level})${prefix}`;
    }
    decorateWithTimeDelta(message) {
        const now = Date.now();
        const diff = now - lastLogTimeMs;
        lastLogTimeMs = now;
        return `(${diff}ms) ${message}`;
    }
    decorateWithTimestamp(message) {
        return `(${new Date().toISOString()}) ${message}`;
    }
    emit(transport, message, formattedArgs, rawArgs) {
        if (transport.isConsole) {
            transport.fn(message, ...rawArgs);
            return;
        }
        if (this.shouldUseColors === false) {
            transport.fn(message, ...formattedArgs);
            return;
        }
        transport.fn(message);
    }
    getTransports(level) {
        const transport = this.transports[level];
        if (!transport) {
            return [];
        }
        return Array.isArray(transport) ? transport : [transport];
    }
    resolveConsoleMethod(level) {
        switch (level) {
            case 'ERROR':
                return 'error';
            case 'WARN':
                return 'warn';
            default:
                return 'log';
        }
    }
    resolveTransport(level, logMethod) {
        var _a, _b, _c;
        if (this.baseLog) {
            const logFn = this.baseLog;
            return {
                fn: (...parts) => {
                    logFn(...parts);
                },
                isConsole: false,
            };
        }
        if (level === 'ERROR' && ((_b = (_a = getProcess()) === null || _a === void 0 ? void 0 : _a.stderr) === null || _b === void 0 ? void 0 : _b.write)) {
            return {
                fn: (...parts) => {
                    var _a, _b, _c;
                    const stringParts = parts.map((part) => typeof part === 'string' ? part : this.formatArg(part));
                    (_c = (_b = (_a = getProcess()) === null || _a === void 0 ? void 0 : _a.stderr) === null || _b === void 0 ? void 0 : _b.write) === null || _c === void 0 ? void 0 : _c.call(_b, stringParts.join(' ') + '\n');
                },
                isConsole: false,
            };
        }
        const consoleMethod = ((_c = console[logMethod]) !== null && _c !== void 0 ? _c : console.log).bind(console);
        return {
            fn: (...parts) => {
                consoleMethod(...parts);
            },
            isConsole: true,
        };
    }
    get env() {
        var _a, _b;
        return (_b = (_a = getProcess()) === null || _a === void 0 ? void 0 : _a.env) !== null && _b !== void 0 ? _b : {};
    }
    get logLevel() {
        var _a;
        return (_a = this.env.LOG_LEVEL) !== null && _a !== void 0 ? _a : undefined;
    }
    get shouldWrite() {
        const levelSetting = this.logLevel;
        return (level) => shouldWrite(levelSetting, level);
    }
    get shouldLogTimeDeltas() {
        return this.env.SHOULD_LOG_TIME_DELTAS !== 'false';
    }
    get shouldLogTime() {
        return this.env.SHOULD_LOG_TIME !== 'false';
    }
    formatArg(value) {
        const formatter = value === null || value === void 0 ? void 0 : value.toString;
        if (typeof formatter === 'function') {
            return formatter.call(value);
        }
        return 'undefined';
    }
}
export default function buildLog(prefix = undefined, options) {
    return new Logger(prefix, options);
}
export const testLog = buildLog('TEST', {
    log: (...parts) => {
        var _a, _b, _c;
        (_c = (_b = (_a = getProcess()) === null || _a === void 0 ? void 0 : _a.stderr) === null || _b === void 0 ? void 0 : _b.write) === null || _c === void 0 ? void 0 : _c.call(_b, parts.join(' ') + '\n');
    },
});
export const stubLog = buildLog('STUB', {
    log: () => { },
    useColors: false,
});
function shouldWrite(logLevel, level) {
    switch (logLevel === null || logLevel === void 0 ? void 0 : logLevel.toLowerCase()) {
        case 'none':
            return false;
        case 'error':
            return level === 'ERROR';
        case 'warn':
            return level !== 'INFO';
        default:
            return true;
    }
}
function getProcess() {
    if (typeof process !== 'undefined') {
        return process;
    }
    return null;
}
let lastLogTimeMs = Date.now();
const getMaxLogPrefixesLength = () => {
    var _a, _b, _c, _d;
    return typeof ((_b = (_a = getProcess()) === null || _a === void 0 ? void 0 : _a.env) === null || _b === void 0 ? void 0 : _b.MAXIMUM_LOG_PREFIXES_LENGTH) === 'string'
        ? +((_d = (_c = getProcess()) === null || _c === void 0 ? void 0 : _c.env) === null || _d === void 0 ? void 0 : _d.MAXIMUM_LOG_PREFIXES_LENGTH)
        : undefined;
};

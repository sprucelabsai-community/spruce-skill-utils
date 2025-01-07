import AbstractSpruceTest from '@sprucelabs/test'
import { assert, generateId, test } from '@sprucelabs/test-utils'
import buildLog, { testLog } from '../../utilities/buildLog'

const ROOT_PREFIX = 'root prefix'

export default class LoggingTest extends AbstractSpruceTest {
    protected static async beforeEach(): Promise<void> {
        await super.beforeEach()
        delete process.env.MAXIMUM_LOG_PREFIXES_LENGTH
        process.env.SHOULD_LOG_TIME_DETLAS = 'false'
        process.env.SHOULD_LOG_TIME = 'false'
    }

    @test()
    protected static canGetLogger() {
        assert.isFunction(buildLog)
    }

    @test()
    protected static canBuildLog() {
        const log = buildLog()
        assert.isTruthy(log)
    }

    @test()
    protected static canBuildLogWithPrefix() {
        const log = buildLog(ROOT_PREFIX)
        assert.isEqual(log.prefix, ROOT_PREFIX)
    }

    @test()
    protected static logsWithPrefix() {
        let m: any
        const log = buildLog(ROOT_PREFIX, {
            useColors: false,
            log: (...message: any) => {
                m = message.join(' ')
            },
        })

        log.info('message')
        assert.isEqual(m, '(INFO) root prefix :: message')
    }

    @test()
    protected static logsWithoutPrefix() {
        let m: any
        const log = buildLog(undefined, {
            useColors: false,
            log: (...message: any) => {
                m = message.join(' ')
            },
        })

        log.info('message')
        assert.isEqual(m, '(INFO) message')
    }

    @test.skip()
    protected static logsWithChalk() {
        const log = buildLog()

        const m = log.info('go team')
        assert.doesInclude(m, '[')
    }

    @test()
    protected static logsbuildLogs() {
        let m: any

        const log = buildLog(ROOT_PREFIX, {
            useColors: false,
            log: (...message: any) => {
                m = message.join(' ')
            },
        })

        log.info('message')
        assert.isEqual(m, '(INFO) root prefix :: message')

        const log2 = log.buildLog('second level prefix')

        log2.error('an error occurred')
        assert.isEqual(
            m,
            '(ERROR) root prefix :: second level prefix :: an error occurred'
        )

        log2.info('information logged')
        assert.isEqual(
            m,
            '(INFO) root prefix :: second level prefix :: information logged'
        )
    }

    @test()
    protected static testLogLogsToStdErr() {
        const old = process.stderr.write
        let lastWrite: any[] = []

        //@ts-ignore
        process.stderr.write = (...parts: any[]) => {
            lastWrite = parts
        }

        testLog.info('go team!')

        assert.doesInclude(lastWrite[0], 'go team!')

        process.stderr.write = old
    }

    @test()
    protected static testLogBuildsLogThatLogsToStdErr() {
        const old = process.stderr.write
        let lastWrite: any[] = []

        //@ts-ignore
        process.stderr.write = (...parts: any[]) => {
            lastWrite = parts
        }

        testLog.buildLog('waka').info('go team!')

        assert.doesInclude(lastWrite[0], 'go team!')
        assert.doesInclude(lastWrite[0], 'waka')

        process.stderr.write = old
    }

    @test()
    protected static canSetTransportForErrorType() {
        let infoMessage: string | undefined
        let errorMessage: string | undefined

        const log = buildLog('TEST', {
            useColors: false,
            transportsByLevel: {
                INFO: (...messageParts: string[]) => {
                    infoMessage = messageParts.join(' ')
                },
                ERROR: (...messageParts: string[]) => {
                    errorMessage = messageParts.join(' ')
                },
            },
        })
        log.info('go team')
        assert.isEqual(infoMessage, 'TEST :: go team')

        const secondLog = log.buildLog('TEST2')
        secondLog.info('go again team')

        assert.isEqual(infoMessage, 'TEST :: TEST2 :: go again team')

        log.error('error me scotty')
        assert.isEqual(errorMessage, 'TEST :: error me scotty')
    }

    @test()
    protected static async canSetMupltipleTransportsPerType() {
        let info1Message: string | undefined
        let info2Message: string | undefined
        let error1Message: string | undefined
        let error2Message: string | undefined

        const log = buildLog('TEST', {
            useColors: false,
            transportsByLevel: {
                INFO: [
                    (...messageParts: string[]) => {
                        info1Message = messageParts.join(' ')
                    },
                    (...messageParts: string[]) => {
                        info2Message = messageParts.join(' ')
                    },
                ],
                ERROR: [
                    (...messageParts: string[]) => {
                        error1Message = messageParts.join(' ')
                    },
                    (...messageParts: string[]) => {
                        error2Message = messageParts.join(' ')
                    },
                ],
            },
        })

        log.info('go team')
        assert.isEqual(info1Message, 'TEST :: go team')
        assert.isEqual(info2Message, 'TEST :: go team')

        log.error('error me scotty')
        assert.isEqual(error1Message, 'TEST :: error me scotty')
        assert.isEqual(error2Message, 'TEST :: error me scotty')
    }

    @test()
    protected static transportGetsMessagesWithoutPaddingWhenNoPrefixSupplied() {
        let infoMessage: string | undefined

        const log = buildLog(undefined, {
            useColors: true,
            transportsByLevel: {
                INFO: (...messageParts: string[]) => {
                    infoMessage = messageParts.join(' ')
                },
            },
        })

        log.info('go team')
        assert.isEqual(infoMessage, 'go team')
    }

    @test('can set max prefixes length 1', '1', 'Last time :: what the!?')
    @test(
        'can set max prefixes length 2',
        '2',
        'AGAIN :: Last time :: what the!?'
    )
    @test('can set max prefixes length 3', '0', 'what the!?')
    @test(
        'can set max prefixes length 4',
        undefined,
        'TEST :: AGAIN :: Last time :: what the!?'
    )
    protected static canSetMaximumPrefixesLength(
        max: string,
        expected: string
    ) {
        process.env.MAXIMUM_LOG_PREFIXES_LENGTH = max

        let infoMessage = ''
        const log = buildLog('TEST', {
            transportsByLevel: {
                INFO: (...messageParts: string[]) => {
                    infoMessage = messageParts.join(' ')
                },
            },
        })
            .buildLog('AGAIN')
            .buildLog('Last time')

        log.info('what the!?')

        assert.isEqual(infoMessage, expected)
    }

    @test('outputs time by default (always passes, check logs)')
    protected static async rendersTimeSinceLastRenderAndDateTimeByDefault() {
        this.resetTimeLogEnv()

        const log = buildLog('TIMESTAMPS', { useColors: false })

        log.error('first!')

        await this.wait(1)

        log.error('second!')

        await this.wait(10)

        log.error('third!')
    }

    @test()
    protected static async doesNotCrashWhenLoggingUndefined() {
        const log = buildLog()
        log.info('test', undefined, 'test')
    }

    @test()
    protected static async doesNotColorIfNotTty() {
        process.env.SHOULD_LOG_TIME_DETLAS = 'false'
        process.env.SHOULD_LOG_TIME = 'false'
        process.stdout.isTTY = false

        let lastMessage: string | undefined

        console.log = (...message: any[]) => {
            lastMessage = message.join(' ')
        }

        const log = buildLog('TTY', {})

        log.info('go team')
        assert.isEqual(lastMessage, '(INFO) TTY :: go team')
    }

    @test()
    protected static async canLogErrorsBecauseTheyHaveToString() {
        let errorMessage: string | undefined

        const error = new Error(generateId())
        const expected = error.toString()

        const log = buildLog(undefined, {
            useColors: true,
            transportsByLevel: {
                ERROR: (...messageParts: string[]) => {
                    errorMessage = messageParts.join(' ')
                },
            },
        })

        log.error(error)
        assert.isEqual(errorMessage, expected)
    }

    @test(
        "When LOG_LEVEL is 'none', then console is silent after log.error()",
        'none',
        'error',
        []
    )
    @test(
        "When LOG_LEVEL is 'none', then console is silent after log.warn()",
        'none',
        'warn',
        []
    )
    @test(
        "When LOG_LEVEL is 'none', then console is silent after log.info()",
        'none',
        'info',
        []
    )
    @test(
        "When LOG_LEVEL is 'error', then console is used after log.error()",
        'error',
        'error',
        ['(ERROR) go team\n']
    )
    @test(
        "When LOG_LEVEL is 'error', then console is silent after log.warn()",
        'error',
        'warn',
        []
    )
    @test(
        "When LOG_LEVEL is 'error', then console is silent after log.info()",
        'error',
        'info',
        []
    )
    @test(
        "When LOG_LEVEL is 'info', then console is used after log.warn()",
        'info',
        'warn',
        []
    )
    protected static doesLoggingWrite(
        logLevel: string,
        writtenLevel: 'error' | 'warn' | 'info',
        expected: any[]
    ) {
        const stream = outputstream[writtenLevel]
        const oldWrite = process[stream].write
        const actual: any[] = []
        process[stream].write = (data) => {
            actual.push(data)
            return true
        }
        try {
            process.env.LOG_LEVEL = logLevel
            const log = buildLog()
            log[writtenLevel]('go team')
            assert.isEqualDeep(actual, expected)
        } catch (err) {
            throw err
        } finally {
            process[stream].write = oldWrite
        }
    }

    private static resetTimeLogEnv() {
        delete process.env.SHOULD_LOG_TIME_DETLAS
        delete process.env.SHOULD_LOG_TIME
    }
}

const outputstream = {
    error: 'stderr',
    warn: 'stderr',
    info: 'stdout',
} as const

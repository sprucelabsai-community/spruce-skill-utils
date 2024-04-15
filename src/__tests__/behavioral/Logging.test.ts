import AbstractSpruceTest, { test } from '@sprucelabs/test'
import { assert, generateId } from '@sprucelabs/test-utils'
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

    private static resetTimeLogEnv() {
        delete process.env.SHOULD_LOG_TIME_DETLAS
        delete process.env.SHOULD_LOG_TIME
    }
}

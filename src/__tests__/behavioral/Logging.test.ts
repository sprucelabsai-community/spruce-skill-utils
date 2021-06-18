import AbstractSpruceTest, { test, assert } from '@sprucelabs/test'
import buildLog, { mockLog, testLog } from '../../utilities/buildLog'

const ROOT_PREFIX = 'root prefix'

export default class LoggingTest extends AbstractSpruceTest {
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

	@test()
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
	protected static mockLogsBuildMockLogs() {
		const log = mockLog.buildLog('')
		assert.isEqual(log, mockLog)
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

		const log = buildLog('TEST', {
			useColors: true,
			transportsByLevel: {
				INFO: (...messageParts: string[]) => {
					infoMessage = messageParts.join(' ')
				},
			},
		})
		log.info('go team')

		assert.isEqual(infoMessage, '(INFO) TEST :: go team')

		const secondLog = log.buildLog('TEST2')
		secondLog.info('go again team')

		assert.isEqual(infoMessage, '(INFO) TEST :: TEST2 :: go again team')
	}
}

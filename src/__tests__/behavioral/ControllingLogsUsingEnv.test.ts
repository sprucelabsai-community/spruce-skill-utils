import AbstractSpruceTest, {
    test,
    suite,
    assert,
    generateId,
} from '@sprucelabs/test-utils'
import { Log, Logger } from '../../utilities/buildLog'

@suite()
export default class ControllingLogsUsingEnvTest extends AbstractSpruceTest {
    private logger!: MainControllerLogger
    private didLog = false

    public async beforeEach() {
        await super.beforeEach()

        process.env.SHOULD_LOG_TIME_DELTAS = 'false'
        process.env.SHOULD_LOG_TIME = 'false'

        this.setup()
    }

    @test()
    protected async doesNotWriteIfIsMainModuleIsFalse() {
        this.logAndAssertReturnsJoined([generateId()])
        this.assertDidNotWrite()
    }

    @test()
    protected async infoReturnsJoinedMultipleInputsWhenIsMainModuleIsFalse() {
        const inputs = [generateId(), generateId(), generateId()]
        this.logAndAssertReturnsJoined(inputs)
    }

    @test()
    protected async warnDoesNotWriteIfIsMainModuleIsFalse() {
        this.logAndAssertReturnsJoined([generateId()], 'warn')
        this.assertDidNotWrite()
    }

    @test()
    protected async canEnableUsingPrefix() {
        process.env.SPRUCE_LOGS = 'Taco'
        this.setup('Taco')
        this.logInfo()
        this.assertDidLog()
    }

    @test()
    protected async ignorseIfPrefixDoesNotMatch() {
        process.env.SPRUCE_LOGS = 'Burrito'
        this.setup('Cheese')
        this.logInfo()
        this.assertDidNotWrite()
    }

    @test()
    protected async canWriteWithMultiplePrefixes() {
        process.env.SPRUCE_LOGS = 'Taco,Burrito,Cheese'
        this.setup('Hamburger')
        this.logInfo()
        this.assertDidNotWrite()
        this.setup('Burrito')
        this.logInfo()
        this.assertDidLog()
    }

    @test()
    protected async doesNotFlipOnPartialPrefixMatch() {
        process.env.SPRUCE_LOGS = 'Taco'
        this.setup('Tac')
        this.logInfo()
        this.assertDidNotWrite()
    }

    @test()
    protected async doesNotGetThrownOffBySpaces() {
        process.env.SPRUCE_LOGS = '  Taco , Burrito  , Cheese '
        this.setup('Burrito')
        this.logInfo()
        this.assertDidLog()
    }

    private logInfo() {
        this.logAndAssertReturnsJoined([generateId()], 'info')
    }

    private assertDidLog() {
        assert.isTruthy(this.didLog, 'Should have logged')
    }

    private logAndAssertReturnsJoined(
        inputs: string[],
        func: Omit<keyof Log, 'prefix' | 'buildLog'> = 'info'
    ) {
        //@ts-ignore
        const log = this.logger[func]?.(...inputs) as string
        if (this.logger.prefix) {
            inputs.unshift(this.logger.prefix + ' ::')
        }
        assert.isEqual(log, inputs.join(' '), 'Should return input')
    }

    private assertDidNotWrite() {
        assert.isFalse(this.didLog, 'Should not have logged')
    }

    private setup(prefix = '') {
        this.logger = new MainControllerLogger(prefix, {
            useColors: false,
            transportsByLevel: {
                INFO: () => {
                    this.didLog = true
                },
                WARN: () => {
                    this.didLog = true
                },
                ERROR: () => {
                    this.didLog = true
                },
            },
        })
    }
}

class MainControllerLogger extends Logger {
    private _isMainModule = false
    public setIsMainModule(isMainModule: boolean) {
        this._isMainModule = isMainModule
    }

    protected isMainModule(): boolean {
        return this._isMainModule
    }
}

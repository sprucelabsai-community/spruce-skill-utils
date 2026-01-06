import AbstractSpruceTest, { test, suite, assert } from '@sprucelabs/test-utils'
import buildLog from '../../utilities/buildLog'

@suite()
export default class CanTrackMemoryTest extends AbstractSpruceTest {
    private logger = buildLog()

    @test()
    protected async tracksNothingByDefault() {
        this.info('howdy')
        this.assertHistoryEquals([])
    }

    @test()
    protected async canTrackOneItem() {
        this.startTrackingHistory(1)
        this.info('waka')
        this.assertHistoryEquals(['waka'])
        this.info('taco')
        this.assertHistoryEquals(['taco'])
    }

    @test()
    protected async canTrackWithPrefix() {
        this.logger = buildLog('PREFIX')
        this.startTrackingHistory(1)
        this.info('first')
        this.assertHistoryEquals(['PREFIX :: first'])
    }

    @test()
    protected async canTrack2HistoryItems() {
        this.startTrackingHistory(2)
        this.info('one')
        this.info('two')
        this.assertHistoryEquals(['one', 'two'])
        this.info('three')
        this.assertHistoryEquals(['two', 'three'])
    }

    private startTrackingHistory(length: number) {
        this.logger.startTrackingHistory(length)
    }

    private assertHistoryEquals(expected: string[]) {
        const history = this.getHistory()
        assert.isEqualDeep(
            history,
            expected,
            'History is not equal to expected.'
        )
    }

    private info(log: string) {
        this.logger.info(log)
    }

    private getHistory() {
        return this.logger.getHistory()
    }
}

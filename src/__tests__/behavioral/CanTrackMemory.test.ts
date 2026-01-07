import AbstractSpruceTest, { test, suite, assert } from '@sprucelabs/test-utils'
import buildLog, { Logger } from '../../utilities/buildLog'

@suite()
export default class CanTrackMemoryTest extends AbstractSpruceTest {
    private logger = buildLog()

    protected async beforeEach() {
        await super.beforeEach()
        this.logger.stopTrackingHistory()
    }

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

    @test()
    protected async tracksHistoryBetweenInstances() {
        this.startTrackingHistory(4)
        const logger = buildLog()

        this.info('item 1')
        logger.info('item 2')
        this.info('item 3')
        logger.info('item 4')

        this.assertHistoryEquals(['item 1', 'item 2', 'item 3', 'item 4'])
        this.logger = logger
        this.assertHistoryEquals(['item 1', 'item 2', 'item 3', 'item 4'])
    }

    @test()
    protected async canGetIsTrackingAndHistoryLimit() {
        this.assertIsNotTrackingHistory()
        this.startTrackingHistory(10)
        this.assertIsTrackingHistory()
        this.assertHistoryLimitEquals(10)
        this.startTrackingHistory(5)
        this.assertHistoryLimitEquals(5)
    }

    private assertHistoryLimitEquals(expected: number) {
        assert.isEqual(
            this.logger.getHistoryLimit(),
            expected,
            'History limit not equal to expected.'
        )
    }

    private assertIsNotTrackingHistory() {
        assert.isEqual(
            this.logger.getIsTrackingHistory(),
            false,
            'Should not be tracking history.'
        )
    }

    private assertIsTrackingHistory() {
        assert.isEqual(
            this.logger.getIsTrackingHistory(),
            true,
            'Should be tracking history.'
        )
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
        return Logger.getHistory()
    }
}

import { AddressFieldValue } from '@sprucelabs/schema'
import AbstractSpruceTest, { test, assert } from '@sprucelabs/test'
import locationRenderer from '../../renderers/locationRenderer'

export default class RenderingLocationsTest extends AbstractSpruceTest {
	@test('Renders All Present Address Fields and Not Undefined 1', {
		city: 'Denver',
		country: 'US',
		province: 'Colorado',
		street1: '123 Panda',
		street2: 'Apt 5',
		zip: 80202,
	})
	@test('Renders All Present Address Fields and Not Undefined 2', {
		city: 'Battle Creek',
		country: undefined,
		province: 'MI',
		street1: '456 Main',
		street2: undefined,
		zip: undefined,
	})
	@test('Renders All Present Address Fields and Not Undefined 3', {
		city: undefined,
		country: undefined,
		province: undefined,
		street1: undefined,
		street2: undefined,
		zip: undefined,
	})
	protected static async rendersAllPresentAddressFieldsAndNotUndefined(
		address: AddressFieldValue
	) {
		const actual = locationRenderer.renderAddress(address)
		assert.doesNotInclude(actual, 'undefined')

		for (const value of Object.values(address)) {
			if (typeof value !== 'undefined') {
				assert.doesInclude(actual, `${value}`)
			}
		}
	}
}

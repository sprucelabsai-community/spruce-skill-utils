import { AddressFieldValue } from '@sprucelabs/schema'

const locationRenderer = {
	renderAddress(address?: AddressFieldValue) {
		return `${
			address
				? `${address.street1}${address.street2 ? ` ${address.street2}` : ``} ${
						address.city
				  } ${address.zip}`
				: ``
		}`
	},
}

export default locationRenderer

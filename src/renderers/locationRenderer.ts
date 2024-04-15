import { AddressFieldValue } from '@sprucelabs/schema'

const locationRenderer = {
    renderAddress(address?: AddressFieldValue) {
        return `${
            address
                ? `${address.street1 ?? ''} ${address.street2 ?? ''} ${
                      address.city ?? ''
                  } ${address.province ?? ''} ${address.zip ?? ''} ${
                      address.country ?? ''
                  }`
                : ``
        }`
            .replace(/\s\s+/g, ' ')
            .trim()
    },
}

export default locationRenderer

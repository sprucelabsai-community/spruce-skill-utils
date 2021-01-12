import AbstractSpruceError, {
	SpruceErrorOptions,
	ErrorOptions as IErrorOptions,
} from '@sprucelabs/error'

interface FailedToLoadPluginErrorOptions extends IErrorOptions {
	code: 'FAILED_TO_LOAD_PLUGIN'
	file: string
}

export type ErrorOptions = FailedToLoadPluginErrorOptions | SpruceErrorOptions

export default class SpruceError extends AbstractSpruceError<ErrorOptions> {
	public friendlyMessage() {
		let message = super.friendlyMessage()

		switch (this.options.code) {
			case 'FAILED_TO_LOAD_PLUGIN':
				message = `Failed to load the plugin at ${this.options.file}.\n\n`
				message += this.options.friendlyMessage
				break
		}

		return message
	}
}

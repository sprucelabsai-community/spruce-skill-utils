import AbstractSpruceError, {
    ErrorOptions as IErrorOptions,
} from '@sprucelabs/error'

interface FailedToLoadPluginErrorOptions extends IErrorOptions {
    code: 'FAILED_TO_LOAD_PLUGIN'
    file: string
}

interface InvalidFeatureCodeErrorOptions extends IErrorOptions {
    code: 'INVALID_FEATURE_CODE'
    suppliedCode: string
    validCodes: string[]
}

interface InvalidPackageJsonErrorOptions extends IErrorOptions {
    code: 'INVALID_PACKAGE_JSON'
    path: string
    errorMessage: string
}

interface SkillCrashedErrorOptions extends IErrorOptions {
    code: 'SKILL_CRASHED'
}

interface InvalidPluginErrorOptions extends IErrorOptions {
    code: 'INVALID_PLUGIN'
    file: string
}

export type ErrorOptions =
    | FailedToLoadPluginErrorOptions
    | InvalidFeatureCodeErrorOptions
    | SkillCrashedErrorOptions
    | InvalidPluginErrorOptions
    | InvalidPackageJsonErrorOptions

export default class SpruceError extends AbstractSpruceError<ErrorOptions> {
    public friendlyMessage() {
        let message = super.friendlyMessage()

        switch (this.options.code) {
            case 'FAILED_TO_LOAD_PLUGIN':
                message = `Failed to load the plugin at ${this.options.file}.\n\n`
                message += this.options.friendlyMessage
                break
            case 'INVALID_FEATURE_CODE':
                message = `"${
                    this.options.suppliedCode
                }" is not a valid feature code. Valid codes are: ${this.options.validCodes.join(
                    ', '
                )}`
                break
            case 'SKILL_CRASHED':
                message = `Shoot, your skill crashed. Here are some deets:\n\n${
                    this.options.originalError?.message ?? 'UNKNOWN'
                }`
                break

            case 'INVALID_PACKAGE_JSON':
                message = `I could not open the package.json for this skill. Error was: ${this.options.errorMessage}`
                break
        }

        return message
    }
}

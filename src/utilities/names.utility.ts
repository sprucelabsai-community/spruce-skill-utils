/* eslint-disable @typescript-eslint/naming-convention */
import path from 'path'
import inflection from 'inflection'
import camelCase from 'lodash/camelCase'
import kebabCase from 'lodash/kebabCase'
import snakeCase from 'lodash/snakeCase'
import upperFirst from 'lodash/upperFirst'

const namesUtil = {
	/** Gets you a name good for using in an import statement based off a file path */
	toFileNameWithoutExtension(filePath: string) {
		return filePath
			.replace(path.dirname(filePath), '')
			.replace(path.extname(filePath), '')
			.replace('/', '')
	},
	/** First name => FirstName */
	toCamel(name: string) {
		return camelCase(name)
	},
	/** First name => FirstName */
	toPascal(name: string) {
		return upperFirst(this.toCamel(name))
	},
	/** First name => FIRST_NAME */
	toConst(name: string) {
		return snakeCase(name).toUpperCase()
	},
	/** First name => First names */
	toPlural(name: string) {
		return inflection.pluralize(name)
	},
	/** First name => First name */
	toSingular(name: string) {
		return inflection.singularize(name)
	},

	/** First name => first-name */
	toKebab(name: string) {
		return kebabCase(name)
	},

	/** First name => first_name */
	toSnake(name: string) {
		return snakeCase(name)
	},
}

export default namesUtil

import diskUtil from '../utilities/disk.utility'
const dotenv = require('dotenv')

type EnvValue = string | boolean | number

export default class EnvService {
	private cwd: string
	public constructor(cwd: string) {
		this.cwd = cwd
	}

	public set(key: string, value: EnvValue) {
		const env = this.parseEnv()
		env[key] = value

		this.writeConfig(env)
	}

	private writeConfig(env: any) {
		const path = this.getEnvPath()
		const lines: string[] = []

		for (const key in env) {
			let valueLiteral = this.generateValueLiteral(env[key])
			lines.push(`${key}=${valueLiteral}`)
		}

		diskUtil.writeFile(path, lines.join('\n'))
	}

	public get(key: string): EnvValue {
		if (process.env[key]) {
			return this.coerceType(process.env[key] as EnvValue)
		}

		const env = this.parseEnv()
		const value = env[key]

		return this.coerceType(value)
	}

	private coerceType(value: EnvValue) {
		//@ts-ignore
		const numValue = parseInt(value, 10)
		//@ts-ignore
		if (/^-?\d+$/.test(value) && !isNaN(numValue)) {
			return numValue
		} else if (value === 'true') {
			return true
		} else if (value === 'false') {
			return false
		}

		return value
	}

	public unset(key: string) {
		const env = this.parseEnv()
		delete env[key]
		this.writeConfig(env)
	}

	private parseEnv() {
		const path = this.getEnvPath()
		if (!diskUtil.doesFileExist(path)) {
			return {}
		}
		const contents = diskUtil.readFile(path)
		const config = dotenv.parse(contents)
		return config
	}

	private generateValueLiteral(value: string | number | boolean) {
		let valueLiteral = ''

		if (typeof value === 'string') {
			valueLiteral = `"${this.escape(value)}"`
		} else if (typeof value === 'boolean') {
			valueLiteral = value ? 'true' : 'false'
		} else {
			valueLiteral = `${value}`
		}
		return valueLiteral
	}

	private escape(value: string) {
		return value.replace(/\n/g, '\\n')
	}

	private getEnvPath() {
		return diskUtil.resolvePath(this.cwd, '.env')
	}
}

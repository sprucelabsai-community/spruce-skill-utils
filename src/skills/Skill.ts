import buildLog, { Log } from '../buildLog'
import {
	HealthCheckResults,
	SkillFeature,
	Skill as ISkill,
} from '../skill.types'

export default class Skill implements ISkill {
	public rootDir
	public activeDir
	public hashSpruceDir

	private featureMap: Record<string, SkillFeature> = {}
	private log = buildLog('skill')

	public constructor(options: {
		rootDir: string
		activeDir: string
		hashSpruceDir: string
	}) {
		this.rootDir = options.rootDir
		this.activeDir = options.activeDir
		this.hashSpruceDir = options.hashSpruceDir
	}

	public isFeatureInstalled = async (featureCode: string) => {
		if (!this.featureMap[featureCode]) {
			return false
		}

		return this.featureMap[featureCode].isInstalled()
	}

	public registerFeature = async (
		featureCode: string,
		feature: SkillFeature
	) => {
		this.log.info(`Registering feature.${featureCode}`)
		this.featureMap[featureCode] = feature
	}

	public checkHealth = async (): Promise<HealthCheckResults> => {
		const results: HealthCheckResults = {
			skill: {
				status: 'passed',
			},
		}

		await Promise.all(
			this.getFeaturesWithCode().map(async (featureWithCode) => {
				const isInstalled = await featureWithCode.feature.isInstalled()
				if (isInstalled) {
					try {
						const item = await featureWithCode.feature.checkHealth()
						//@ts-ignore
						results[featureWithCode.code] = item
					} catch (err) {
						//@ts-ignore
						results[featureWithCode.code] = {
							status: 'failed',
							errors: [err],
						}
					}
				}
			})
		)

		return results
	}

	public execute = async () => {
		await Promise.all(this.getFeatures().map((feature) => feature.execute()))
		this.log.info('All features have finished execution.')
		this.log.info('Shutting down in 3')
		await new Promise((resolve) =>
			setTimeout(() => {
				this.log.info('.................2')
				resolve(null)
			}, 1000)
		)
		await new Promise((resolve) =>
			setTimeout(() => {
				this.log.info('.................1')
				resolve(null)
			}, 1000)
		)
		await new Promise((resolve) =>
			setTimeout(() => {
				this.log.info('.................Good bye 👋')
				resolve(null)
			}, 1000)
		)
		await new Promise((resolve) =>
			setTimeout(() => {
				resolve(null)
			}, 1000)
		)
	}

	public getFeatures() {
		return Object.values(this.featureMap)
	}

	private getFeaturesWithCode() {
		return Object.keys(this.featureMap).map((code) => ({
			code,
			feature: this.featureMap[code],
		}))
	}

	public buildLog(...args: any[]): Log {
		//@ts-ignore
		return this.log.buildLog(...args)
	}
}

import AbstractSpruceError from '@sprucelabs/error'

export interface Skill {
	rootDir: string
	/** Source or build depending on running with .local */
	activeDir: string
	hashSpruceDir: string
	registerFeature(code: string, feature: SkillFeature): void
}

export interface SkillFeature {
	execute(): Promise<void>
	checkHealth(): Promise<HealthCheckItem>
	isInstalled(): Promise<boolean>
}

export interface SchemaHealthCheckItem extends HealthCheckItem {
	schemas: {
		id: string
		name?: string
		namespace: string
		version?: string
		description?: string
	}[]
}

export interface ErrorHealthCheckItem extends HealthCheckItem {
	errorSchemas: {
		id: string
		name: string
		description?: string
	}[]
}

export interface EventHealthCheckItem extends HealthCheckItem {
	listeners: Omit<EventFeatureListener, 'callback'>[]
	contracts: { eventNameWithOptionalNamespace: string }[]
}

export interface HealthCheckResults {
	skill: HealthCheckItem
	schema?: SchemaHealthCheckItem
	error?: ErrorHealthCheckItem
	event?: EventHealthCheckItem
}

export interface HealthCheckItem {
	status: 'failed' | 'passed'
	errors?: AbstractSpruceError<any>[]
}

export interface EventFeatureListener {
	eventName: string
	eventNamespace: string
	version: string
	callback(skill: Skill): Promise<void>
}

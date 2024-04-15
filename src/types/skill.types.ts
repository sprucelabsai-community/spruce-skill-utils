import AbstractSpruceError from '@sprucelabs/error'
import { Log, LogOptions } from '../utilities/buildLog'

export interface SkillContext {}

export type BootCallback = () => void | Promise<void>

export interface Skill {
    rootDir: string
    /** Source or build depending on running with .local */
    activeDir: string
    hashSpruceDir: string
    registerFeature(code: string, feature: SkillFeature): void
    getFeatureByCode(code: string): SkillFeature
    getFeatures(): SkillFeature[]
    isRunning(): boolean
    isBooted(): boolean
    onBoot(cb: BootCallback): void
    onPostBoot(cb: BootCallback): void
    checkHealth(): Promise<HealthCheckResults>
    buildLog(prefix?: string, options?: LogOptions): Log
    execute(): Promise<void>
    kill(): Promise<void>
    getContext(): SkillContext
    updateContext<Key extends keyof SkillContext>(
        key: Key,
        value: SkillContext[Key]
    ): void
}

export interface SkillFeature {
    execute(): Promise<void>
    checkHealth(): Promise<HealthCheckItem>
    isInstalled(): Promise<boolean>
    destroy(): Promise<void>
    isBooted(): boolean
    onBoot(cb: BootCallback): void
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

export interface HealthCheckResults {
    skill: HealthCheckItem
    schema?: SchemaHealthCheckItem
    error?: ErrorHealthCheckItem
}

export interface HealthCheckItem {
    status: 'failed' | 'passed'
    errors?: AbstractSpruceError<any>[]
}

export type EnvValue = string | boolean | number

export interface NpmPackage {
    name: string
    version?: string
    isDev?: boolean
}

export interface SkillAuth {
    id: string
    apiKey: string
    name: string
    slug: string
}

export interface PersonWithToken {
    id: string
    casualName: string
    token: string
    isLoggedIn?: boolean | undefined | null
}

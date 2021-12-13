import {
	buildSchema,
	normalizeSchemaValues,
	SchemaError,
	validateSchemaValues,
} from '@sprucelabs/schema'
import { PersonWithToken, SkillAuth } from '../types/skill.types'
import namesUtil from '../utilities/names.utility'
import EnvService from './EnvService'
import PkgService from './PkgService'

const LOGGED_IN_PERSON_KEY = 'LOGGED_IN_PERSON'

const personWithTokenSchema = buildSchema({
	id: 'personWithToken',
	version: 'v2020_07_22',
	namespace: 'SpruceCli',
	name: '',
	description: 'A stripped down cli user with token details for login',
	fields: {
		/** Id. */
		id: {
			label: 'Id',
			type: 'id',
			isRequired: true,
			options: undefined,
		},
		/** Casual name. The name you can use when talking to this person. */
		casualName: {
			label: 'Casual name',
			type: 'text',
			isRequired: true,
			hint: 'The name you can use when talking to this person.',
			options: undefined,
		},
		/** . */
		token: {
			type: 'text',
			isRequired: true,
			options: undefined,
		},
		/** Logged in. */
		isLoggedIn: {
			label: 'Logged in',
			type: 'boolean',
			options: undefined,
		},
	},
})

export default class AuthService {
	private env: EnvService
	private pkg: PkgService

	public static Auth(cwd: string) {
		if (!cwd) {
			throw new SchemaError({
				code: 'MISSING_PARAMETERS',
				parameters: ['cwd'],
			})
		}

		const pkgService = new PkgService(cwd)
		const envService = new EnvService(cwd)

		try {
			const namespace = pkgService.get('skill.namespace')
			if (!namespace) {
				throw new Error(
					"It does not look like you're in a skill. I expected to find 'skill.namespace' in there, but didn't!"
				)
			}

			const auth = new this(envService, pkgService)
			return auth
		} catch (err: any) {
			throw new SchemaError({
				code: 'INVALID_PARAMETERS',
				parameters: ['cwd'],
				friendlyMessage: err.message,
			})
		}
	}

	private constructor(envService: EnvService, pkgService: PkgService) {
		this.env = envService
		this.pkg = pkgService
	}

	public getLoggedInPerson(): PersonWithToken | null {
		const p = this.env.get(LOGGED_IN_PERSON_KEY)
		if (typeof p === 'string') {
			return JSON.parse(p)
		}

		return null
	}

	public setLoggedInPerson(person: PersonWithToken) {
		const normalized = normalizeSchemaValues(personWithTokenSchema, person)
		validateSchemaValues(personWithTokenSchema, normalized)

		this.env.set(
			LOGGED_IN_PERSON_KEY,
			JSON.stringify({
				...normalized,
				isLoggedIn: true,
			})
		)
	}

	public logOutPerson() {
		this.env.unset(LOGGED_IN_PERSON_KEY)
	}

	public getCurrentSkill(): SkillAuth | null {
		const id = this.env.get('SKILL_ID') as string
		const apiKey = this.env.get('SKILL_API_KEY') as string
		const name = this.env.get('SKILL_NAME') as string
		const slug = this.pkg.get('skill.namespace') as string

		if (id && apiKey) {
			return {
				id,
				apiKey,
				name,
				slug,
			}
		}

		return null
	}

	public logoutCurrentSkill() {
		this.env.unset('SKILL_ID')
		this.env.unset('SKILL_API_KEY')
		this.env.unset('SKILL_NAME')
	}

	public updateCurrentSkill(skill: SkillAuth) {
		this.env.set('SKILL_ID', skill.id)
		this.env.set('SKILL_API_KEY', skill.apiKey)
		this.env.set('SKILL_NAME', skill.name)

		this.updateCurrentSkillNamespace(skill.slug)
	}

	public updateCurrentSkillNamespace(namespace: string) {
		this.pkg.set({
			path: 'skill.namespace',
			value: namesUtil.toKebab(namespace),
		})
	}
}

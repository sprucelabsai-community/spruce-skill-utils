import os from 'os'
import {
    buildSchema,
    normalizeSchemaValues,
    SchemaError,
    validateSchemaValues,
} from '@sprucelabs/schema'
import { PersonWithToken, SkillAuth } from '../types/skill.types'
import diskUtil from '../utilities/disk.utility'
import namesUtil from '../utilities/names.utility'
import EnvService from './EnvService'
import PkgService from './PkgService'

export default class AuthService {
    public static homeDir = os.homedir()

    private env: EnvService
    private pkg: PkgService

    public static Class?: typeof AuthService

    protected constructor(envService: EnvService, pkgService: PkgService) {
        this.env = envService
        this.pkg = pkgService
    }

    public static Auth(cwd: string) {
        if (!cwd) {
            throw new SchemaError({
                code: 'MISSING_PARAMETERS',
                parameters: ['cwd'],
            })
        }

        const pkgService = new PkgService(cwd)
        const envService = new EnvService(cwd)

        if (!pkgService.doesExist()) {
            throw new SchemaError({
                code: 'INVALID_PARAMETERS',
                parameters: ['cwd'],
                friendlyMessage: 'Could not find a package.json file!',
            })
        }

        const auth = new (this.Class ?? this)(envService, pkgService)
        return auth
    }

    public getLoggedInPerson(): PersonWithToken | null {
        if (diskUtil.doesFileExist(this.personJsonPath)) {
            const contents = diskUtil.readFile(this.personJsonPath)
            const person = JSON.parse(contents)
            return person as PersonWithToken
        }
        return null
    }

    public setLoggedInPerson(person: PersonWithToken) {
        const normalized = normalizeSchemaValues(personWithTokenSchema, person)
        validateSchemaValues(personWithTokenSchema, normalized)

        const destination = this.personJsonPath
        diskUtil.writeFile(
            destination,
            JSON.stringify({ ...normalized, isLoggedIn: true }, null, 2)
        )
    }

    public logOutPerson() {
        diskUtil.deleteFile(this.personJsonPath)
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

    private get personJsonPath() {
        return diskUtil.resolvePath(
            AuthService.homeDir,
            '.spruce',
            'person.json'
        )
    }
}

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

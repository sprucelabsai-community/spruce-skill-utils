import pathUtil from 'path'
import globby from '@sprucelabs/globby'
import { SchemaError } from '@sprucelabs/schema'
import SpruceError from '../errors/SpruceError'
import diskUtil from './disk.utility'

const pluginUtil = {
    async import(args: any[], ...path: string[]) {
        const lookup = pathUtil.join(...path, '**', '*.plugin.[t|j]s')
        const results = await globby(lookup)
        const plugins: any[] = []

        const all = results.map(async (path) => {
            const plugin = require(path)

            if (!plugin || !plugin.default) {
                throw new SpruceError({
                    code: 'FAILED_TO_LOAD_PLUGIN',
                    file: path,
                    friendlyMessage:
                        'You must export your plugin as the default.',
                })
            }

            const result = await plugin.default(...args)
            plugins.push(result)
        })

        await Promise.all(all)

        return plugins
    },

    importSync(args: any[], ...path: string[]) {
        const missing: string[] = []

        if (!args) {
            missing.push('args')
        }

        if (path.length === 0) {
            missing.push('path')
        }

        if (missing.length > 0) {
            throw new SchemaError({
                code: 'MISSING_PARAMETERS',
                parameters: missing,
                friendlyMessage: `You have to pass path as a string to load the plugins and args[] to what will be ...unrolled as the args to the plugin's callback function.`,
            })
        }

        if (!Array.isArray(args)) {
            throw new SchemaError({
                code: 'INVALID_PARAMETERS',
                parameters: ['args'],
                friendlyMessage: `You have to pass args[] as an array to what will be ...unrolled as the args to the plugin's callback function.`,
            })
        }

        //@ts-ignore
        const lookup = diskUtil.resolvePath(...path)

        if (!diskUtil.isDir(lookup)) {
            throw new SchemaError({
                code: 'INVALID_PARAMETERS',
                parameters: ['path'],
                friendlyMessage: `I couldn't find the directory at ${lookup}.`,
            })
        }

        const query = pathUtil.join(lookup, '**', '*.plugin.[t|j]s')
        const results = globby.sync(query)

        const pluginResults: any[] = []

        for (const match of results) {
            const imported = require(match).default

            if (typeof imported !== 'function') {
                throw new SpruceError({
                    code: 'INVALID_PLUGIN',
                    file: match,
                    friendlyMessage: `You must export a function as the default export to ${match}.`,
                })
            }

            pluginResults.push(imported())
        }

        return pluginResults
    },
}

export default pluginUtil

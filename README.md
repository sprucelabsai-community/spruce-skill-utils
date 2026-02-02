# Spruce Skill Utils

Utilities and services used across Spruce skills and tooling. Exports are available from `src/index.ts`.

## Utilities

### `buildLog` (Logging)
Structured logger with prefixes, transports, time decorations, log gating, and history tracking.

#### Quick start
```ts
import buildLog from '@sprucelabs/spruce-skill-utils'

const log = buildLog('APP', { useColors: false })
log.info('booting')
log.warn('cache miss', { key: 'users:1' })
log.error('boom', new Error('Something failed'))
```

#### Prefixes and hierarchy
Prefixes are chained via `buildLog`. Returned strings include the prefixes, and transports receive the prefix as a separate first argument.
```ts
const root = buildLog('ROOT', { useColors: false })

root.info('message')

const child = root.buildLog('CHILD')
child.error('an error occurred')
```
Outputs:
1. `(INFO) ROOT :: message`
2. `(ERROR) ROOT :: CHILD :: an error occurred`

#### Maximum prefix length
Use `MAXIMUM_LOG_PREFIXES_LENGTH` to limit how many prefix segments are included.
```ts
process.env.MAXIMUM_LOG_PREFIXES_LENGTH = '2'

const log = buildLog('ONE')
  .buildLog('TWO')
  .buildLog('THREE')

log.info('value')
```
Transport receives: `TWO :: THREE :: value`

Set to `0` to suppress prefixes entirely.

#### Log level gating
Control which levels are emitted using `LOG_LEVEL`.
```ts
process.env.LOG_LEVEL = 'warn'

const log = buildLog('APP', { useColors: false })

log.info('info message')
log.warn('warn message')
log.error('error message')
```
With `LOG_LEVEL=warn`, only `warn` and `error` are emitted.

#### Time decorations
By default, log output includes a timestamp and a time-since-last-log delta. Disable with env flags.
```ts
process.env.SHOULD_LOG_TIME = 'false'
process.env.SHOULD_LOG_TIME_DELTAS = 'false'

const log = buildLog('TIMESTAMPS', { useColors: false })
log.info('first')
```

#### Transports
You can route logs per level to custom transports. Transports receive prefix and args only (no `(INFO)` or timestamps).
```ts
let infoMessage = ''
let errorMessage = ''

const log = buildLog('TEST', {
  useColors: false,
  transportsByLevel: {
    INFO: (...parts) => { infoMessage = parts.join(' ') },
    ERROR: (...parts) => { errorMessage = parts.join(' ') },
  },
})

log.info('go team')
log.error('error me')
```
Captured values:
1. `infoMessage` becomes `TEST :: go team`
2. `errorMessage` becomes `TEST :: error me`

You can also provide multiple transports per level:
```ts
const log = buildLog('MULTI', {
  transportsByLevel: {
    INFO: [
      (...parts) => console.log('one', parts.join(' ')),
      (...parts) => console.log('two', parts.join(' ')),
    ],
  },
})
```

#### Custom log override (rare)
If you provide `log`, it overrides the output target entirely (no console/stderr). This is typically only useful in tests.
```ts
const log = buildLog('NOOP', { useColors: false, log: () => {} })

log.info('this returns a string, but nothing is emitted')
```

#### Colors and TTY
Colors are enabled only when `stdout.isTTY` is true and `useColors !== false`.
```ts
process.stdout.isTTY = false
const log = buildLog('TTY', {})
log.info('go team')
```
Output: `(INFO) TTY :: go team`

#### Prefix-based logging control
If `isMainModule()` is false, logging is disabled unless `SPRUCE_LOGS` includes the logger’s prefix.
```ts
process.env.SPRUCE_LOGS = 'Billing,Auth'
const log = buildLog('Auth', { useColors: false })
log.info('allowed')
```

#### History tracking
Logging history is shared across all logger instances.
```ts
const log = buildLog()
log.startTrackingHistory(2)

log.info('one')
log.info('two')
log.info('three')

log.getHistory()
```
History contains: `["two", "three"]`

#### API
1. `buildLog(prefix?: string, options?: LogOptions): Log`
2. `Logger` class (implements `Log`)
3. `testLog` and `stubLog`

### `testLog`
Logger preconfigured to write to `stderr`. Useful in tests.

### `stubLog`
Logger preconfigured to do nothing. Colors disabled.

### `diskUtil`
Filesystem helper utilities.

Key behaviors
1. `resolvePath` resolves relative paths to a cwd and expands `#spruce` to `.spruce`.
2. `resolveFile` searches for bare, `.js`, and `.ts` files in order.
3. `hasFileChanged` tracks file changes using `.change_cache` and a `.gitignore` in that cache directory.
4. `deleteEmptyDirs` removes empty directories recursively and validates inputs.
5. `detectProjectLanguage` infers `ts`, `js`, `go`, or `unknown`.

### `versionUtil`
Versioned-path helper that works with `vYYYY_MM_DD` directories and `{{@latest}}` tokens.

Key behaviors
1. `resolvePath` replaces `{{@latest}}` with the latest version directory.
2. `resolveNewLatestPath` creates a new latest path using today’s date.
3. `getAllVersions` returns sorted version metadata.
4. `latestVersionAtPath` throws if no versioning exists.

### `namesUtil`
String and naming helpers.

API
1. `toFileNameWithoutExtension`
2. `toCamel`
3. `toPascal`
4. `toConst`
5. `toPlural`
6. `toSingular`
7. `toKebab`
8. `toSnake`

### `addonUtil`
Discovers and loads `*.addon.[t|j]s` files.

Key behaviors
1. `import` loads all addons under a path and awaits results.
2. `importSync` loads all addons synchronously.
3. If a module has a default export function, it is invoked with `options`.

### `pluginUtil`
Discovers and loads `*.plugin.[t|j]s` files.

Key behaviors
1. `import` loads plugins asynchronously and returns their results.
2. `importSync` loads plugins synchronously and validates inputs.
3. Plugins must export a default function or an error is thrown.

### `randomUtil`
Random selection helper.

API
1. `rand<T>(possibilities: T[]): T`

### `joinIntoSentence`
Joins words into a human-readable sentence with an `&` before the last item.

Example
1. `['hey', 'there']` → `hey & there`
2. `['a', 'b', 'c']` → `a, b & c`

### `slug`
Creates a lowercase, dash-separated slug from an input string.

### `cloneDeep`
Deprecated wrapper around `@sprucelabs/schema` `cloneDeep`. Prefer importing directly from `@sprucelabs/schema`.

### `isEqual`
Deep equality check with special handling for `Date` and with `null`/`undefined` field removal.

## Renderers

### `locationRenderer`
Renders an `AddressFieldValue` into a single, trimmed line with missing fields omitted.

## Services

### `SettingsService`
Persists feature flags and settings to a JSON file under `.spruce`.

Key behaviors
1. Supports `markAsInstalled` and `markAsPermanentlySkipped`.
2. Supports nested `get`, `set`, and `unset`.
3. Uses `.spruce/settings.json` for JS/TS projects and `.spruce/settings.json` in the repo root for Go projects.
4. Supports custom settings filename via `setFile`.

### `EnvService`
Reads and writes a `.env` file in the current working directory.

Key behaviors
1. `set` writes literals with quoting and escapes newlines.
2. `get` coerces booleans and integers.
3. `unset` removes keys from both the file and `process.env`.

### `PkgService`
Reads and writes `package.json`.

Key behaviors
1. `get`, `set`, and `unset` for package fields.
2. `doesExist` checks for `package.json`.
3. `isInstalled` checks dependencies and devDependencies.
4. `deleteLockFile` removes `package-lock.json` and `yarn.lock`.
5. `buildPackageName` formats `name@version`.

### `AuthService`
Manages local auth state for skills.

Key behaviors
1. `Auth(cwd)` validates a `package.json` exists and returns a service instance.
2. Persists a logged-in person to `~/.spruce/person.json`.
3. Reads and updates current skill credentials from `.env` and `package.json`.
4. Normalizes and validates person data against a schema.

## Types and constants
Exports include `Skill`, `SkillAuth`, `PersonWithToken`, `EnvValue`, and constants such as `HASH_SPRUCE_DIR`, `LATEST_HANDLEBARS`, and `CORE_SCHEMA_VERSION`.

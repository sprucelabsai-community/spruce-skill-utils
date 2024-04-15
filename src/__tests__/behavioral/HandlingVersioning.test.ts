import pathUtil from 'path'
import AbstractSpruceTest, { assert, test } from '@sprucelabs/test'
import versionUtil, { formatDate } from '../../utilities/version.utility'

export default class HandlesVersioningTest extends AbstractSpruceTest {
    @test()
    protected static hasResolvePathFunction() {
        assert.isFunction(versionUtil.resolvePath)
    }

    @test()
    protected static canResolveLatest() {
        const expected = this.resolveTestPath('services/v2020_01_10/index.md')

        const resolved = versionUtil.resolvePath(
            this.resolveTestPath(),
            'services/{{@latest}}/index.md'
        )

        assert.isEqual(resolved, expected)
    }

    @test()
    protected static canResolveLatestOnDifferentDirectory() {
        const expected = this.resolveTestPath('utilities/v2020_02_15/index.md')

        const resolved = versionUtil.resolvePath(
            this.resolveTestPath(),
            'utilities/{{@latest}}/index.md'
        )

        assert.isEqual(resolved, expected)
    }

    @test()
    protected static canGenerateLatestPath() {
        const date = formatDate(new Date())
        const expected = this.resolveTestPath(`utilities/v${date}/index.md`)

        const resolved = versionUtil.resolveNewLatestPath(
            this.resolveTestPath(),
            'utilities/{{@latest}}/index.md'
        )

        assert.isEqual(resolved, expected)
    }

    @test()
    protected static canGetLatestVersionBasedOnDir() {
        const resolved = versionUtil.latestVersionAtPath(
            this.resolveTestPath('utilities')
        )

        assert.isEqualDeep(resolved, {
            intValue: 20200215,
            dirValue: 'v2020_02_15',
            constValue: 'v2020_02_15',
        })
    }

    @test()
    protected static getAllVersionsReturnsEmptyArrayOnDirThatDoesNotExist() {
        assert.isEqualDeep(versionUtil.getAllVersions('/does-not-exist'), [])
    }

    @test()
    protected static passingPatternThatFindsNothingReturnsEmptyArray() {
        const path = this.resolveTestPath('utilities', 'nothing', '**')

        const version = versionUtil.getAllVersions(path)
        assert.isLength(version, 0)
    }

    @test(
        'pattern matches single dir 1',
        ['**', 'create', '**', '*'],
        ['2020_01_01', '2021_11_25']
    )
    @test(
        'pattern matches accross several dirs and removes dups',
        ['**', 'events', '**', '*'],
        ['2019_11_25', '2020_01_01', '2021_11_25']
    )
    protected static versionsInSingleDir(
        pattern: string[],
        expectedMatches: string[]
    ) {
        const path = this.resolveTestPath('utilities', ...pattern)
        const versions = versionUtil.getAllVersions(path)

        const allExpected = []
        for (const expected of expectedMatches) {
            const version = {
                intValue: parseInt(expected.replace(/_/g, ''), 10),
                constValue: `v${expected}`,
                dirValue: `v${expected}`,
            }

            allExpected.push(version)
        }

        assert.isEqualDeep(versions, allExpected)
    }

    protected static resolveTestPath(...pathAfterTestDirsAndFiles: string[]) {
        return pathUtil.join(
            __dirname,
            '..',
            'testDirsAndFiles',
            ...pathAfterTestDirsAndFiles
        )
    }
}

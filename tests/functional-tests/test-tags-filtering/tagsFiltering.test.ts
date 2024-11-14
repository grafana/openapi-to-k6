import fs from 'fs'
import os from 'os'
import path from 'path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { Mode } from '../../../src/constants'
import { NoFilesGeneratedError } from '../../../src/errors'
import generator from '../../../src/generator'

import { loadFixture, mkdtemp, readFile, rmdir, writeFile } from '../helper'

describe('validate tags filtering', () => {
  let tempDir: string, openApiPath: string
  const tagsFilteringSchema = loadFixture(
    path.join(__dirname, 'fixtures', 'tags_filtering.json')
  )

  beforeAll(async () => {
    tempDir = await mkdtemp(path.join(os.tmpdir(), 'tags-filtering-test-'))
    openApiPath = path.join(tempDir, 'openapi-schema.json')
    await writeFile(openApiPath, JSON.stringify(tagsFilteringSchema))
  })

  afterAll(async () => {
    await rmdir(tempDir, { recursive: true })
  })

  const generateAndTest = async (
    mode: Mode,
    tags: string[],
    expectedFiles: string[],
    expectedContents: string[],
    unexpectedContents: string[]
  ) => {
    const generatedSchemaPath = path.join(
      tempDir,
      `generated-schema-${mode}-${tags.join('-')}`
    )
    await generator({
      openApiPath,
      outputDir: generatedSchemaPath,
      tags,
      mode,
    })

    const generatedFiles = fs.readdirSync(generatedSchemaPath)
    expect(generatedFiles).to.have.members(expectedFiles)

    for (const file of expectedFiles) {
      if (file.includes('.schemas.ts')) {
        // Skip schemas file
        continue
      }
      const generatedFilePath = path.join(generatedSchemaPath, file)
      const generatedContent = await readFile(generatedFilePath, 'utf-8')

      for (const content of expectedContents) {
        expect(generatedContent).to.contain(content)
      }

      for (const content of unexpectedContents) {
        expect(generatedContent).not.to.contain(content)
      }
    }
  }

  it('should generate only endpoints with specified tags in single mode', async () => {
    await generateAndTest(
      Mode.SINGLE,
      ['users'],
      ['sampleAPI.ts'],
      ['/users'],
      ['/user-profiles', '/pets', '/auth']
    )

    await generateAndTest(
      Mode.SINGLE,
      ['users', 'userProfiles'],
      ['sampleAPI.ts'],
      ['/users', '/user-profiles'],
      ['/pets', '/auth']
    )

    // Invalid tag should not generate any endpoints
    await generateAndTest(
      Mode.SINGLE,
      ['invalid-tag'],
      ['sampleAPI.ts'],
      [],
      ['/users', '/user-profiles', '/pets', '/auth']
    )

    // Empty tags should generate all endpoints
    await generateAndTest(
      Mode.SINGLE,
      [],
      ['sampleAPI.ts'],
      ['/users', '/user-profiles', '/pets', '/auth'],
      []
    )
  })

  it('should generate only endpoints with specified tags in split mode', async () => {
    await generateAndTest(
      Mode.SPLIT,
      ['users'],
      ['sampleAPI.ts', 'sampleAPI.schemas.ts'],
      ['/users'],
      ['/user-profiles', '/pets', '/auth']
    )

    // Test empty tags
    await generateAndTest(
      Mode.SPLIT,
      [],
      ['sampleAPI.ts', 'sampleAPI.schemas.ts'],
      ['/users', '/user-profiles', '/pets', '/auth'],
      []
    )

    // Invalid tag should not generate any endpoints
    // In the single mode it will create the client file which will have only the schemas
    await expect(
      generateAndTest(
        Mode.SPLIT,
        ['invalid-tag'],
        [],
        [],
        ['/users', '/user-profiles', '/pets', '/auth']
      )
    ).rejects.toThrow(NoFilesGeneratedError)

    // Empty tags should generate all endpoints
    await generateAndTest(
      Mode.SPLIT,
      [],
      ['sampleAPI.ts', 'sampleAPI.schemas.ts'],
      ['/users', '/user-profiles', '/pets', '/auth'],
      []
    )
  })

  it('should generate only endpoints with specified tags in tags mode', async () => {
    await generateAndTest(
      Mode.TAGS,
      ['users'],
      ['users.ts', 'sampleAPI.schemas.ts'],
      ['/users'],
      ['/user-profiles', '/pets', '/auth']
    )

    // Empty tags should generate all endpoints
    await generateAndTest(
      Mode.TAGS,
      [],
      [
        'users.ts',
        'sampleAPI.schemas.ts',
        'auth.ts',
        'pets.ts',
        'user-profiles.ts',
      ],
      [], // Skipping test for content
      []
    )
  })
})

import fs from 'fs'
import os from 'os'
import path from 'path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { Mode } from '../../../src/constants'
import generator from '../../../src/generator'
import {
  loadFixture,
  mkdtemp,
  readFile,
  replaceSpacesAndNewLineToSingleSpace,
  rmdir,
  writeFile,
} from '../helper'

describe('validate sample k6 script', async () => {
  const schemaNameToAssertionsMap = {
    'schema_with_no_variables.json': {
      common: {
        expected_string: [],
        unexpected_string: [],
      },
      [Mode.TAGS]: {
        expected_number_of_files: 3,
        expected_string: [],
        unexpected_string: [],
      },
      [Mode.SINGLE]: {
        expected_number_of_files: 2,
        expected_string: [],
        unexpected_string: [],
      },
      [Mode.SPLIT]: {
        expected_number_of_files: 3,
        expected_string: [],
        unexpected_string: [],
      },
    },
    'schema_with_examples.json': {
      common: {
        expected_string: [
          `let id, postItemsIdBody, putItemsIdBody, patchItemsIdBody, postItemsFormUrlEncodedBody, postItemsFormDataBody, params, userId, postId, headers;`,
          `id = "12345-getItemById";`,
          `id = "123450-createItemById";`,
          `id = "123450-updateItemById";`,
          `id = "123450-patchItemById";`,
          `id = "123450-deleteItemById";`,
          `id = "123450-checkItemById";`,
          `userId = "`, // This is generated as random word using faker hence to validating the value
          `postId = "`, // This is generated as random word using faker hence to validating the value
          `postItemsIdBody = { name: "Sample Item", description: "This is a sample description for the item.", };`,
          `putItemsIdBody = { name: "Updated Item Name", description: "Updated description for the item.", };`,
          `patchItemsIdBody = { name: "Partially Updated Item Name", };`,
          `postItemsFormUrlEncodedBody = { name: "Form Encoded Item", description: "Description for form-urlencoded item.", };`,
          `postItemsFormDataBody = { name: "Form Data Item", };`,
          `params = { id: "123450-getItemByIdWithHeader", };`,
          `params = { itemId: "67890", };`,
          `headers = { "X-Auth-Token": "Bearer abcdef12345", "X-Correlation-ID": "correlation-12345", };`,
        ],
        unexpected_string: [],
      },
      [Mode.TAGS]: {
        expected_number_of_files: 6,
        expected_string: [
          `import { ItemsClient } from "./items.ts";`,
          `import { ItemsFormClient } from "./items-form.ts";`,
          `import { ItemsHeaderClient } from "./items-header.ts";`,
          `import { UsersPostsClient } from "./users-posts.ts";`,
          `const itemsClient = new ItemsClient({ baseUrl });`,
          `const itemsFormClient = new ItemsFormClient({ baseUrl });`,
          `const itemsHeaderClient = new ItemsHeaderClient({ baseUrl });`,
          `const usersPostsClient = new UsersPostsClient({ baseUrl });`,
        ],
        unexpected_string: [
          `import { DefaultClient } from "./default.ts";`,
          `const defaultClient = new DefaultClient({ baseUrl });`,
        ],
      },
      [Mode.SINGLE]: {
        expected_number_of_files: 2,
        expected_string: [
          `const comprehensiveAPIClient = new ComprehensiveAPIClient({ baseUrl });`,
        ],
        unexpected_string: [
          `import { ItemsClient } from "./items.ts";`,
          `import { ItemsFormClient } from "./items-form.ts";`,
          `import { ItemsHeaderClient } from "./items-header.ts";`,
          `import { UsersPostsClient } from "./users-posts.ts";`,
          `const itemsClient = new ItemsClient({ baseUrl });`,
          `const itemsFormClient = new ItemsFormClient({ baseUrl });`,
          `const itemsHeaderClient = new ItemsHeaderClient({ baseUrl });`,
          `const usersPostsClient = new UsersPostsClient({ baseUrl });`,
        ],
      },
      [Mode.SPLIT]: {
        expected_number_of_files: 3,
        expected_string: [
          `const comprehensiveAPIClient = new ComprehensiveAPIClient({ baseUrl });`,
        ],
        unexpected_string: [
          `import { ItemsClient } from "./items.ts";`,
          `import { ItemsFormClient } from "./items-form.ts";`,
          `import { ItemsHeaderClient } from "./items-header.ts";`,
          `import { UsersPostsClient } from "./users-posts.ts";`,
          `const itemsClient = new ItemsClient({ baseUrl });`,
          `const itemsFormClient = new ItemsFormClient({ baseUrl });`,
          `const itemsHeaderClient = new ItemsHeaderClient({ baseUrl });`,
          `const usersPostsClient = new UsersPostsClient({ baseUrl });`,
        ],
      },
    },
    'schema_using_ref_models.json': {
      expected_number_of_files: 3,
      common: {
        expected_string: [
          `let id, itemBase, updatedItem, patchItem, formUrlEncodedItem, formDataItem, params, headers, userId, postId;`,
          `id = "12345-getItemById";`,
          `userId = "`, // This is generated as random word using faker hence to validating the value
          `postId = "`, // This is generated as random word using faker hence to validating the value
          `itemBase = { name: "Sample Item", description: "This is a sample description for the item.", };`,
          `updatedItem = { name: "Updated Item Name", description: "Updated description for the item.", };`,
          `patchItem = { name: "Partially Updated Item Name", };`,
          `formUrlEncodedItem = { name: "Form Encoded Item", description: "Description for form-urlencoded item.", };`,
          `formDataItem = { name: "Form Data Item", };`,
          `params = { id: "123450-getItemByIdWithHeader", };`,
          `headers = { "X-Client-ID": "client-123", };`,
          `params = { itemId: "67890", };`,
          `headers = { "X-Auth-Token": "Bearer abcdef12345", "X-Correlation-ID": "correlation-12345", };`,
        ],
        unexpected_string: [],
      },
      [Mode.TAGS]: {
        expected_number_of_files: 6,
        expected_string: [
          `import { ItemsClient } from "./items.ts";`,
          `import { ItemsFormClient } from "./items-form.ts";`,
          `import { ItemsHeaderClient } from "./items-header.ts";`,
          `import { DefaultClient } from "./default.ts";`,
          `const itemsClient = new ItemsClient({ baseUrl });`,
          `const itemsFormClient = new ItemsFormClient({ baseUrl });`,
          `const itemsHeaderClient = new ItemsHeaderClient({ baseUrl });`,
          `const defaultClient = new DefaultClient({ baseUrl });`,
        ],
        unexpected_string: [
          `import { UsersPostsClient } from "./users-posts.ts";`,
          `const usersPostsClient = new UsersPostsClient({ baseUrl });`,
        ],
      },
      [Mode.SINGLE]: {
        expected_number_of_files: 2,
        expected_string: [],
        unexpected_string: [
          `import { ItemsClient } from "./items.ts";`,
          `import { ItemsFormClient } from "./items-form.ts";`,
          `import { ItemsHeaderClient } from "./items-header.ts";`,
          `import { DefaultClient } from "./default.ts";`,
          `const itemsClient = new ItemsClient({ baseUrl });`,
          `const itemsFormClient = new ItemsFormClient({ baseUrl });`,
          `const itemsHeaderClient = new ItemsHeaderClient({ baseUrl });`,
          `const defaultClient = new DefaultClient({ baseUrl });`,
        ],
      },
      [Mode.SPLIT]: {
        expected_number_of_files: 3,
        expected_string: [],
        unexpected_string: [],
      },
    },
  }

  for (const [schemaName, assertions] of Object.entries(
    schemaNameToAssertionsMap
  )) {
    describe(`test ${schemaName} schema`, () => {
      let tempDir: string, openapiSchemaPath: string

      beforeAll(async () => {
        tempDir = await mkdtemp(
          path.join(os.tmpdir(), `example-k6-script-test-${schemaName}`)
        )
        openapiSchemaPath = path.join(tempDir, 'openapi-schema.json')
        await writeFile(
          openapiSchemaPath,
          JSON.stringify(
            loadFixture(path.join(__dirname, 'fixtures', schemaName))
          )
        )
      })

      afterAll(async () => {
        await rmdir(tempDir, { recursive: true })
      })

      for (const mode of Object.values(Mode)) {
        it(`should generate sample k6 script with correct example values in ${mode} mode for ${schemaName}`, async () => {
          const generatedClientPath = path.join(
            tempDir,
            mode,
            `generated-client`
          )

          await generator({
            openApiPath: openapiSchemaPath,
            outputDir: generatedClientPath,
            mode,
            shouldGenerateSampleK6Script: true,
          })

          const generatedFiles = fs.readdirSync(generatedClientPath)
          expect(generatedFiles.length).toBe(
            assertions[mode].expected_number_of_files
          )

          // Get the k6 script file
          const k6ScriptFile = generatedFiles.find((file) =>
            file.includes('k6-script.sample.ts')
          )
          expect(k6ScriptFile).toBeDefined()

          const k6ScriptFilePath = path.join(generatedClientPath, k6ScriptFile!)
          const k6ScriptContent = await readFile(k6ScriptFilePath, 'utf-8')

          const allExpectedStrings = [
            ...assertions.common.expected_string,
            ...assertions[mode].expected_string,
          ]

          for (const expectedString of allExpectedStrings) {
            expect(
              replaceSpacesAndNewLineToSingleSpace(k6ScriptContent)
            ).toContain(expectedString)
          }

          const allUnexpectedStrings = [
            ...assertions.common.unexpected_string,
            ...assertions[mode].unexpected_string,
          ]

          for (const unexpectedString of allUnexpectedStrings) {
            expect(
              replaceSpacesAndNewLineToSingleSpace(k6ScriptContent)
            ).not.toContain(unexpectedString)
          }
        })
      }
    })
  }
})

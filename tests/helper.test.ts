import fs from 'fs'
import os from 'os'
import path from 'path'
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'
import * as helper from '../src/helper'
import { PackageDetails } from '../src/type'

// Mock the package.json file
vi.mock('../package.json', () => ({
  default: {
    name: 'test-package-name',
    description: 'This is a test package',
    bin: { 'test-package': 'bin/test-package.js' },
    version: '1.0.0',
  },
}))

describe('getPackageDetails', () => {
  it('should return the package details', () => {
    const expectedDetails: PackageDetails = {
      name: 'test-package-name',
      commandName: 'test-package',
      description: 'This is a test package',
      version: '1.0.0',
    }

    const details = helper.getPackageDetails()
    expect(details).toEqual(expectedDetails)
  })
})

describe('djb2Hash', () => {
  it('should return a hash for a given string', () => {
    const input = 'test'
    const expectedHash = 2087956275
    const hash = helper.djb2Hash(input)
    expect(hash).toEqual(expectedHash)
  })
})

describe('formatFileWithPrettier', () => {
  let tempDir: string
  const unformattedContent = `const x= {foo: "bar",baz:"qux"}`
  const prettierOptions = {
    semi: false,
    singleQuote: true,
  }
  const formattedContentWithOptions = `const x = { foo: 'bar', baz: 'qux' }
`
  const formattedContent = `const x = { foo: "bar", baz: "qux" };
`

  beforeAll(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'test-prettier-'))
  })

  afterAll(() => {
    fs.rmdirSync(tempDir, { recursive: true })
  })

  it('should format the file using Prettier', async () => {
    const filePath = path.join(tempDir, 'test-file-1.ts')
    fs.writeFileSync(filePath, unformattedContent)

    await helper.formatFileWithPrettier(filePath)

    const fileContents = fs.readFileSync(filePath, 'utf-8')
    expect(fileContents).toEqual(formattedContent)
  })

  it('should use Prettier config if available', async () => {
    // Add a new directory for the second test
    const testDir = path.join(tempDir, 'prettier-config-test')
    fs.mkdirSync(testDir)

    // Create prettier config file
    const prettierConfigPath = path.join(testDir, '.prettierrc')
    fs.writeFileSync(prettierConfigPath, JSON.stringify(prettierOptions))

    // Create a new file
    const filePath = path.join(testDir, 'test-file-2.ts')
    fs.writeFileSync(filePath, unformattedContent)

    await helper.formatFileWithPrettier(filePath)

    const fileContents = fs.readFileSync(filePath, 'utf-8')
    expect(fileContents).toEqual(formattedContentWithOptions)
  })
})

describe('OutputOverrider', () => {
  let outputOverrider: helper.OutputOverrider

  beforeEach(() => {
    outputOverrider = helper.OutputOverrider.getInstance()
  })

  it('should redirect output to null stream for the callback function', async () => {
    const originalStdoutWrite = process.stdout.write
    const originalStderrWrite = process.stderr.write

    await outputOverrider.redirectOutputToNullStream(async () => {
      expect(process.stdout.write).not.toBe(originalStdoutWrite)
      expect(process.stderr.write).not.toBe(originalStderrWrite)
    })

    expect(process.stdout.write).toBe(originalStdoutWrite)
    expect(process.stderr.write).toBe(originalStderrWrite)
  })

  it('should restore output automatically after the call', async () => {
    const originalStdoutWrite = process.stdout.write
    const originalStderrWrite = process.stderr.write

    await outputOverrider.redirectOutputToNullStream()

    expect(process.stdout.write).toBe(originalStdoutWrite)
    expect(process.stderr.write).toBe(originalStderrWrite)
  })
})

describe('getDirectoryForPath', () => {
  it('should return the directory path for a given file path', () => {
    const filePath = path.join(os.tmpdir(), 'file.txt')
    const expectedDirectory = os.tmpdir()

    const directory = helper.getDirectoryForPath(filePath)
    expect(directory).toEqual(expectedDirectory)
  })
  it('should return the directory path for a given directory path', () => {
    const directoryPath = os.tmpdir()
    const expectedDirectory = os.tmpdir()

    const directory = helper.getDirectoryForPath(directoryPath)
    expect(directory).toEqual(expectedDirectory)
  })
  it('should return correct directory if it has period in the name', () => {
    const directoryPath = path.join(os.tmpdir(), 'test.dir', 'file.txt')
    const expectedDirectory = path.join(os.tmpdir(), 'test.dir')

    const directory = helper.getDirectoryForPath(directoryPath)
    expect(directory).toEqual(expectedDirectory)
  })
  it('should return correct directory for relative paths', () => {
    const directoryPath = './test.dir/file.txt'
    const expectedDirectory = './test.dir'

    const directory = helper.getDirectoryForPath(directoryPath)
    expect(directory).toEqual(expectedDirectory)
  })
})

describe('hasOnlyComments', () => {
  it('should return true if the file has only comments', () => {
    const expectedResultsAndData = [
      {
        fileContent: '// This is a comment',
        expectedResult: true,
      },
      {
        fileContent: '/* This is a comment */',
        expectedResult: true,
      },
      {
        fileContent: '// This is a comment\nconst x = 1',
        expectedResult: false,
      },
      {
        fileContent: '/* This is a comment */\nconst x = 1',
        expectedResult: false,
      },
      {
        fileContent: 'const x = 1',
        expectedResult: false,
      },
      {
        fileContent: '',
        expectedResult: true,
      },
      {
        fileContent: '// This is a comment\n// This is another comment',
        expectedResult: true,
      },
      {
        fileContent: '/* This is a comment */\n/* This is another comment */',
        expectedResult: true,
      },
      {
        fileContent: '// This is a comment\n/* This is another comment */',
        expectedResult: true,
      },
      {
        fileContent: `/**
 * This is a comment
 */
`,
        expectedResult: true,
      },
    ]
    for (const { fileContent, expectedResult } of expectedResultsAndData) {
      const result = helper.hasOnlyComments(fileContent)
      try {
        expect(result).toBe(expectedResult)
      } catch (error) {
        console.log(`Expected ${expectedResult} for content:\n${fileContent}`)
        throw error
      }
    }
  })
})

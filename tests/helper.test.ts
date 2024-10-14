import fs from 'fs'
import * as prettier from 'prettier'
import {
  djb2Hash,
  formatFileWithPrettier,
  getPackageDetails,
  isTsNode,
  OutputOverrider,
} from '../src/helper'
import { PackageDetails } from '../src/type'

jest.mock('fs')
jest.mock('path')
jest.mock('prettier')
// jest.mock('@orval/core');

// Mock the package.json file
jest.mock(
  '../package.json',
  () => ({
    name: 'test-package-name',
    description: 'This is a test package',
    bin: { 'test-package': 'bin/test-package.js' },
    version: '1.0.0',
  }),
  { virtual: true }
)

describe('getPackageDetails', () => {
  it('should return the package details', () => {
    const expectedDetails: PackageDetails = {
      name: 'test-package-name',
      commandName: 'test-package',
      description: 'This is a test package',
      version: '1.0.0',
    }

    const details = getPackageDetails()
    expect(details).toEqual(expectedDetails)
  })
})

describe('djb2Hash', () => {
  it('should return a hash for a given string', () => {
    const input = 'test'
    const expectedHash = 2087956275
    const hash = djb2Hash(input)
    expect(hash).toEqual(expectedHash)
  })
})

describe('formatFileWithPrettier', () => {
  const mockFilePath = '/mock-directory/mock-file.ts'
  const mockFileContent = 'const x = 1;'
  const mockFormattedContent = 'const x = 1; // formatted'

  beforeEach(() => {
    ;(fs.readFileSync as jest.Mock).mockReturnValue(mockFileContent)
    ;(fs.writeFileSync as jest.Mock).mockImplementation(() => {})
    ;(prettier.resolveConfig as jest.Mock).mockResolvedValue({})
    ;(prettier.format as jest.Mock).mockReturnValue(mockFormattedContent)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should format the file using Prettier', async () => {
    await formatFileWithPrettier(mockFilePath)

    expect(fs.readFileSync).toHaveBeenCalledWith(mockFilePath, 'utf-8')
    expect(prettier.format).toHaveBeenCalledWith(mockFileContent, {
      filepath: mockFilePath,
    })
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      mockFilePath,
      mockFormattedContent
    )
  })

  it('should use Prettier config if available', async () => {
    const mockPrettierConfig = { semi: false }
    ;(prettier.resolveConfig as jest.Mock).mockResolvedValue(mockPrettierConfig)

    await formatFileWithPrettier(mockFilePath)

    expect(prettier.format).toHaveBeenCalledWith(mockFileContent, {
      ...mockPrettierConfig,
      filepath: mockFilePath,
    })
  })
})

describe('OutputOverrider', () => {
  let outputOverrider: OutputOverrider

  beforeEach(() => {
    outputOverrider = OutputOverrider.getInstance()
  })

  it('should redirect output to null stream', () => {
    const originalStdoutWrite = process.stdout.write
    const originalStderrWrite = process.stderr.write

    outputOverrider.redirectOutputToNullStream()

    expect(process.stdout.write).not.toBe(originalStdoutWrite)
    expect(process.stderr.write).not.toBe(originalStderrWrite)

    outputOverrider.restoreOutput()
  })

  it('should restore output', () => {
    const originalStdoutWrite = process.stdout.write
    const originalStderrWrite = process.stderr.write

    outputOverrider.redirectOutputToNullStream()
    outputOverrider.restoreOutput()

    console.log(process.stdout.write)
    expect(process.stdout.write).toBe(originalStdoutWrite)
    expect(process.stderr.write).toBe(originalStderrWrite)
  })
})

describe('isTsNode', () => {
  it('should return true if running with ts-node', () => {
    const originalArgv = process.argv
    process.argv = ['node', 'script.ts']

    expect(isTsNode()).toBe(true)

    process.argv = originalArgv
  })

  it('should return false if not running with ts-node', () => {
    const originalArgv = process.argv
    process.argv = ['node', 'script.js']

    expect(isTsNode()).toBe(false)

    process.argv = originalArgv
  })
})

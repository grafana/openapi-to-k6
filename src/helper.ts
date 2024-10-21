import { camel, getFileInfo } from '@orval/core'
import fs from 'fs'
import path from 'path'
import { format, resolveConfig } from 'prettier'
import packageJson from '../package.json'
import { SAMPLE_K6_SCRIPT_FILE_NAME } from './constants'
import { logger } from './logger'
import { PackageDetails } from './type'

export const getPackageDetails = (): PackageDetails => {
  const commandName = Object.keys(packageJson.bin)[0] || 'openapi-to-k6'
  return {
    name: packageJson.name,
    commandName,
    description: packageJson.description,
    version: packageJson.version,
  }
}

/**
 * Format the given file using Prettier.
 *
 * @param filePath - Path to the file to format.
 */
export async function formatFileWithPrettier(filePath: string) {
  // Read file contents
  const content = fs.readFileSync(filePath, 'utf-8')
  // Format using Prettier
  const options = await resolveConfig(filePath)
  const formatted = await format(content, {
    ...options,
    filepath: filePath,
  })

  // Write formatted content back to the file
  fs.writeFileSync(filePath, formatted)
  logger.debug(`Formatted: ${filePath}`)
}

/**
 * Format the generated files using Prettier.
 *
 * @param outputTarget - Path to the generated files.
 * @param schemaTitle - Title of the schema.
 */
export async function formatGeneratedFiles(
  outputTarget: string,
  schemaTitle: string,
  isSampleK6ScriptGenerated: boolean
) {
  // Here we call the original function from @orval/core used by the library to generate the
  // file name with same defaults.
  const { path: clientPath } = await getGeneratedClientPath(
    outputTarget,
    schemaTitle
  )

  logger.debug('Following are the details for formatting generated files:')
  logger.debug(`Path: ${path}`)
  logger.debug(`Schema Title: ${schemaTitle}`)
  logger.debug(`Output Target: ${outputTarget}`)

  await exports.formatFileWithPrettier(clientPath)

  if (isSampleK6ScriptGenerated) {
    const k6ScriptPath = path.join(
      getDirectoryForPath(clientPath),
      SAMPLE_K6_SCRIPT_FILE_NAME
    )
    logger.debug(`Generated sample K6 Script Path: ${k6ScriptPath}`)

    if (fs.existsSync(k6ScriptPath)) {
      logger.debug('Formatting sample k6 script file')
      await exports.formatFileWithPrettier(k6ScriptPath)
    } else {
      logger.error(
        'Unable to format sample K6 script file as it does not exist!'
      )
    }
  }
}

/**
 * Get the path for the generated client file.
 *
 * @param outputTarget - Path to the generated files.
 * @param schemaTitle - Title of the schema.
 *
 * @returns Path to the generated client file.
 */

export async function getGeneratedClientPath(
  outputTarget: string,
  schemaTitle: string
): Promise<{
  path: string
  filename: string
  extension: string
}> {
  const { path, filename, extension } = getFileInfo(outputTarget, {
    backupFilename: camel(schemaTitle),
    extension: '.ts',
  })

  return { path, filename, extension }
}

/**
 * A singleton Class to allow redirecting stdout and stderr to a null stream.
 * This is used to supress the output from third-party libraries.
 *
 * Note: Make sure to call restoreOutput() after the third-party library call to restore the output.
 *
 * @example
 * ```typescript
 * const outputOverrider = OutputOverrider.getInstance();
 * outputOverrider.redirectOutputToNullStream();
 * // Call the third-party library
 * outputOverrider.restoreOutput();
 * ```
 *
 * @export
 * @class OutputOverrider
 */
export class OutputOverrider {
  private static instance: OutputOverrider | null = null
  private originalStdoutWrite: any // eslint-disable-line @typescript-eslint/no-explicit-any
  private originalStderrWrite: any // eslint-disable-line @typescript-eslint/no-explicit-any

  // Making the constructor private to prevent direct instantiation
  private constructor() {
    this.originalStdoutWrite = process.stdout.write
    this.originalStderrWrite = process.stderr.write
  }
  // Static method to get the single instance of the class
  public static getInstance() {
    if (OutputOverrider.instance === null) {
      OutputOverrider.instance = new OutputOverrider()
    }
    return OutputOverrider.instance
  }

  public async redirectOutputToNullStream(callback?: () => Promise<void>) {
    process.stdout.write = process.stderr.write = () => true

    try {
      if (callback) {
        await callback()
      }
    } finally {
      this._restoreOutput()
    }
  }

  private _restoreOutput() {
    process.stdout.write = this.originalStdoutWrite
    process.stderr.write = this.originalStderrWrite
  }
}

/**
 * Check if the current script is running with ts-node. i.e. directly from source.
 *
 * @export
 * @returns {boolean}
 */
export function isTsNode(): boolean {
  const scriptPath = process.argv[1]
  if (scriptPath) {
    return scriptPath.endsWith('.ts') || scriptPath.includes('ts-node')
  } else {
    return false
  }
}

/**
 * Create a hash from the given string using the djb2 algorithm.
 *
 * @param str
 * @returns generated hash
 */
export function djb2Hash(str: string): number {
  let hash = 5381
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i)
  }
  return hash >>> 0 // Ensure the hash is a positive integer
}

/**
 * Returns the directory for the given path.
 *
 * If the path is a file, the directory of the file is returned.
 * If the path is a directory, the path itself is returned.
 *
 * @param path - The path to get the directory for.
 *
 * @returns The directory for the given path.
 */
export function getDirectoryForPath(pathString: string): string {
  const extensionName = path.extname(pathString)

  if (!extensionName) {
    // If the path does not have an extension, it is a directory
    return pathString
  }

  // If the path has an extension, it is a file
  return path.dirname(pathString)
}

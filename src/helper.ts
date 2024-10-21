import { camel, getFileInfo } from '@orval/core'
import fs from 'fs'
import path from 'path'
import { format, resolveConfig } from 'prettier'
import packageJson from '../package.json'
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
  if (!fs.existsSync(filePath)) {
    logger.debug(
      `formatFileWithPrettier ~ File does not exist: ${filePath}, skipping formatting with prettier.`
    )
    return
  }
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
    if (!logger.getVerbose()) {
      // Redirect stdout and stderr to null stream only if not running in verbose mode
      process.stdout.write = process.stderr.write = () => true
    }

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

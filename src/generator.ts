import fs from 'fs'
import { InfoObject } from 'openapi3-ts/oas30'
import orval from 'orval'
import path from 'path'
import { DEFAULT_SCHEMA_TITLE } from './constants'
import {
  formatFileWithPrettier,
  getPackageDetails,
  OutputOverrider,
} from './helper'
import { getK6ClientBuilder } from './k6SdkClient'
import { logger } from './logger'
import { GenerateK6SDKOptions, SchemaDetails } from './type'

const outputOverrider = OutputOverrider.getInstance()
const packageDetails = getPackageDetails()

const generatedFileHeaderGenerator = (info: InfoObject) => {
  return [
    `Automatically generated by ${packageDetails.name}: ${packageDetails.version}`,
    `Do not edit manually.`,
    ...(info.title ? [info.title] : []),
    ...(info.description ? [info.description] : []),
    ...(info.version ? [`OpenAPI spec version: ${info.version}`] : []),
  ]
}

const afterAllFilesWriteHandler = async (filePaths: string[]) => {
  for (const filePath of filePaths) {
    await formatFileWithPrettier(filePath)

    const fileName = path.basename(filePath)

    if (fileName === '.ts') {
      // Generated SDK had no name because there was no title in the schema
      // Rename it to the default name
      const directoryPath = path.dirname(filePath)
      const newPath = path.join(directoryPath, `${DEFAULT_SCHEMA_TITLE}.ts`)
      logger.debug(
        `afterAllFilesWriteHandler ~ Renaming ${filePath} to ${newPath}`
      )
      fs.renameSync(filePath, newPath)
    }
  }
}

export default async ({
  openApiPath,
  outputDir,
  shouldGenerateSampleK6Script,
  analyticsData,
}: GenerateK6SDKOptions) => {
  const schemaDetails: SchemaDetails = {
    title: '',
  }

  /**
   * Note!
   * 1. override.requestOptions is not supported for the custom K6 client
   * 2. override.mutator is not supported for the custom K6 client
   */
  await outputOverrider.redirectOutputToNullStream(async () => {
    await orval({
      input: openApiPath,
      output: {
        target: outputDir,
        mode: 'single',
        client: () =>
          getK6ClientBuilder(
            schemaDetails,
            shouldGenerateSampleK6Script,
            analyticsData
          ),
        override: {
          header: generatedFileHeaderGenerator,
        },
        headers: true,
      },
      hooks: {
        afterAllFilesWrite: afterAllFilesWriteHandler,
      },
    })
  })

  if (!schemaDetails.title) {
    logger.warning(
      'Could not find schema title in the OpenAPI spec. Please provide a `title` in the schema in `info` block to generate proper file names'
    )
  }
}

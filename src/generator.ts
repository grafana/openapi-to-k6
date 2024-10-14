import { InfoObject } from 'openapi3-ts/oas30'
import orval from 'orval'
import {
  formatGeneratedFiles,
  getPackageDetails,
  OutputOverrider,
} from './helper'
import { getK6ClientBuilder } from './k6SdkClient'
import { logger } from './logger'
import { AnalyticsData, SchemaDetails } from './type'

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

export default async (
  openApiPath: string,
  outputDir: string,
  analyticsData?: AnalyticsData
) => {
  const schemaDetails: SchemaDetails = {
    title: '',
  }

  /**
   * Note!
   * 1. override.requestOptions is not supported for the custom K6 client
   * 2. override.mutator is not supported for the custom K6 client
   */
  outputOverrider.redirectOutputToNullStream()

  await orval({
    input: openApiPath,
    output: {
      target: outputDir,
      mode: 'single',
      client: () => getK6ClientBuilder(schemaDetails, analyticsData),
      override: {
        header: generatedFileHeaderGenerator,
      },
    },
  })
  outputOverrider.restoreOutput()

  if (!schemaDetails.title) {
    logger.warning(
      'Could not find schema title in the OpenAPI spec. Please provide a `title` in the schema in `info` block to generate proper file names'
    )
  }

  await formatGeneratedFiles(outputDir, schemaDetails.title)
}

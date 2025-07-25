#!/usr/bin/env node

import chalk from 'chalk'
import { Command, InvalidArgumentError } from 'commander'
import { generateDefaultAnalyticsData, reportUsageAnalytics } from './analytics'
import { EnumGenerationType, Mode } from './constants'
import { NoFilesGeneratedError } from './errors'
import generateK6SDK from './generator'
import { getPackageDetails } from './helper'
import { logger } from './logger'
import { AnalyticsData, GenerateK6SDKOptions } from './type'

const program = new Command()
const packageDetails = getPackageDetails()

/**
 * Validate that the mode argument is one of the supported modes.
 *
 * @param {string} value - The mode value to validate
 * @return {Mode} - The validated mode value
 */
function validateMode(value: string): Mode {
  if (!Object.values(Mode).includes(value as Mode)) {
    throw new InvalidArgumentError(
      `Supported modes: ${Object.values(Mode).join(', ')}`
    )
  }
  return value as Mode
}

/**
 * Validate that the enum generation type argument is one of the supported types.
 *
 * @param {string} value - The enum generation type value to validate
 * @return {EnumGenerationType} - The validated enum generation type value
 */
function validateEnumGenerationType(value: string): EnumGenerationType {
  if (
    !Object.values(EnumGenerationType).includes(value as EnumGenerationType)
  ) {
    throw new InvalidArgumentError(
      `Supported enum generation types: ${Object.values(EnumGenerationType).join(', ')}`
    )
  }
  return value as EnumGenerationType
}

async function generateSDK({
  openApiPath,
  outputDir,
  shouldGenerateSampleK6Script,
  analyticsData,
  mode,
  tags,
  enumGenerationType,
}: GenerateK6SDKOptions) {
  logger.logMessage(
    'Generating TypeScript client for k6...\n' +
      'OpenAPI schema: ' +
      chalk.cyan(openApiPath) +
      '\n' +
      'Output: ' +
      chalk.cyan(outputDir) +
      '\n' +
      (tags?.length
        ? 'Filtering by tag(s): ' + chalk.cyan(tags.join(', ')) + '\n'
        : '') +
      (enumGenerationType
        ? 'Enum generation type: ' + chalk.cyan(enumGenerationType) + '\n'
        : '')
  )

  await generateK6SDK({
    openApiPath,
    outputDir,
    shouldGenerateSampleK6Script,
    analyticsData,
    mode,
    tags,
    enumGenerationType,
  })

  const message = shouldGenerateSampleK6Script
    ? 'TypeScript client and sample k6 script generated successfully.'
    : 'TypeScript client generated successfully.'
  logger.logMessage(message, chalk.green)
}

program
  .name(packageDetails.commandName)
  .description(packageDetails.description)
  .version(packageDetails.version)
  .argument('<openApiPath>', 'Path or URL for the OpenAPI schema file')
  .argument('<outputDir>', 'Directory where the SDK should be generated')
  .option(
    '-m, --mode <string>',
    `mode to use for generating the client. Valid values - ${Object.values(Mode).join(', ')}`,
    validateMode,
    Mode.SINGLE
  )
  .option(
    '--only-tags <filters...>',
    'list of tags to filter on. Generated client will only include operations with these tags'
  )
  .option(
    '--enum-generation-type <type>',
    `Enum generation type to use. Valid values - ${Object.values(EnumGenerationType).join(', ')}`,
    validateEnumGenerationType,
    EnumGenerationType.CONST
  )
  .option('-v, --verbose', 'enable verbose mode to show debug logs')
  .option('--include-sample-script', 'generate a sample k6 script')
  .option('--disable-analytics', 'disable anonymous usage data collection')
  .action(
    async (
      openApiPath,
      outputDir,
      options: {
        verbose?: boolean
        mode: Mode
        onlyTags?: (string | RegExp)[]
        disableAnalytics?: boolean
        includeSampleScript?: boolean
        enumGenerationType?: EnumGenerationType
      }
    ) => {
      let analyticsData: AnalyticsData | undefined
      const shouldDisableAnalytics =
        options.disableAnalytics || process.env.DISABLE_ANALYTICS === 'true'

      if (options.verbose) {
        logger.setVerbose(true)
        logger.debug('Verbose mode enabled, showing debug logs')
      }

      if (shouldDisableAnalytics) {
        logger.debug('Anonymous usage data collection disabled')
      } else {
        logger.debug('Anonymous usage data collection enabled')
        analyticsData = generateDefaultAnalyticsData(
          packageDetails,
          !!options.includeSampleScript
        )
      }

      logger.debug(`
            Supplied OpenAPI schema: ${openApiPath}
            Supplied output directory: ${outputDir}
            `)
      try {
        await generateSDK({
          openApiPath,
          outputDir,
          shouldGenerateSampleK6Script: !!options.includeSampleScript,
          analyticsData,
          mode: options.mode,
          tags: options.onlyTags,
          enumGenerationType: options.enumGenerationType,
        })
      } catch (error) {
        if (error instanceof NoFilesGeneratedError) {
          logger.logMessage(error.message, chalk.yellow)
        } else {
          logger.error('Failed to generate SDK:')
          console.error(error)
        }
      }

      if (!shouldDisableAnalytics && analyticsData) {
        logger.debug('Reporting following usage analytics data:')
        logger.debug(JSON.stringify(analyticsData, null, 2))
        await reportUsageAnalytics(analyticsData)
      }
    }
  )

program.parse()

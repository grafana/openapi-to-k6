#!/usr/bin/env node

import chalk from 'chalk'
import { Command, InvalidArgumentError } from 'commander'
import { generateDefaultAnalyticsData, reportUsageAnalytics } from './analytics'
import { Mode } from './constants'
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

async function generateSDK({
  openApiPath,
  outputDir,
  shouldGenerateSampleK6Script,
  analyticsData,
  mode,
  tags,
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
        ? 'Filtering by tag(s): ' + chalk.cyan(tags.join(', '))
        : '') +
      '\n'
  )

  await generateK6SDK({
    openApiPath,
    outputDir,
    shouldGenerateSampleK6Script,
    analyticsData,
    mode,
    tags,
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

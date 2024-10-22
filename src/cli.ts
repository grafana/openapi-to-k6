#!/usr/bin/env node

import chalk from 'chalk'
import { Command } from 'commander'
import { generateDefaultAnalyticsData, reportUsageAnalytics } from './analytics'
import generateK6SDK from './generator'
import { getPackageDetails } from './helper'
import { logger } from './logger'
import { AnalyticsData, GenerateK6SDKOptions } from './type'

const program = new Command()
const packageDetails = getPackageDetails()

async function generateSDK({
  openApiPath,
  outputDir,
  shouldGenerateSampleK6Script,
  analyticsData,
}: GenerateK6SDKOptions) {
  logger.logMessage('Generating TypeScript client for k6...\n')
  logger.logMessage(`OpenAPI schema: ${openApiPath}`)
  logger.logMessage(`Output: ${outputDir}\n`)

  await generateK6SDK({
    openApiPath,
    outputDir,
    shouldGenerateSampleK6Script,
    analyticsData,
  })

  if (shouldGenerateSampleK6Script) {
    logger.logMessage(
      `TypeScript client and sample k6 script generated successfully.`,
      chalk.green
    )
  } else {
    logger.logMessage(`TypeScript client generated successfully.`, chalk.green)
  }
}

program
  .name(packageDetails.commandName)
  .description(packageDetails.description)
  .version(packageDetails.version)
  .argument('<openApiPath>', 'Path or URL for the OpenAPI schema file')
  .argument('<outputDir>', 'Directory where the SDK should be generated')
  .option('-v, --verbose', 'enable verbose mode to show debug logs')
  .option('--disable-sample-script', 'disable generating sample k6 script')
  .option('--disable-analytics', 'disable anonymous usage data collection')
  .action(
    async (
      openApiPath,
      outputDir,
      options: {
        verbose?: boolean
        disableAnalytics?: boolean
        disableSampleScript?: boolean
      }
    ) => {
      let analyticsData: AnalyticsData | undefined
      const shouldDisableAnalytics =
        options.disableAnalytics || process.env.DISABLE_ANALYTICS === 'true'
      const shouldDisableSampleScript =
        options.disableSampleScript ||
        process.env.DISABLE_SAMPLE_SCRIPT === 'true'

      if (options.verbose) {
        logger.setVerbose(true)
        logger.debug('Verbose mode enabled, showing debug logs')
      }

      if (shouldDisableAnalytics) {
        logger.debug('Anonymous usage data collection disabled')
      } else {
        logger.debug('Anonymous usage data collection enabled')
        analyticsData = generateDefaultAnalyticsData(packageDetails)
      }

      logger.debug(`
            Supplied OpenAPI schema: ${openApiPath}
            Supplied output directory: ${outputDir}
            `)
      try {
        await generateSDK({
          openApiPath,
          outputDir,
          shouldGenerateSampleK6Script: !shouldDisableSampleScript,
          analyticsData,
        })
      } catch (error) {
        logger.error('Failed to generate SDK:')
        console.error(error)
      }

      if (!shouldDisableAnalytics && analyticsData) {
        logger.debug('Reporting following usage analytics data:')
        logger.debug(JSON.stringify(analyticsData, null, 2))

        await reportUsageAnalytics(analyticsData)
      }
    }
  )

program.parse()

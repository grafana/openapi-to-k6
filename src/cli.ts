#!/usr/bin/env node

import { Command } from 'commander'
import { generateDefaultAnalyticsData, reportUsageAnalytics } from './analytics'
import generateK6SDK from './generator'
import { getPackageDetails, isTsNode } from './helper'
import { logger } from './logger'
import { AnalyticsData } from './type'

const program = new Command()
const packageDetails = getPackageDetails()

async function generateSDK(
  openApiPath: string,
  outputDir: string,
  analyticsData?: AnalyticsData
) {
  logger.logMessage('Generating SDK for K6...')
  logger.logMessage(`OpenAPI path: ${openApiPath}`)
  logger.logMessage(`Output directory: ${outputDir}`)

  await generateK6SDK(openApiPath, outputDir, analyticsData)

  logger.logMessage(`K6 SDK generated successfully at ${outputDir}!`)
}

program
  .name(packageDetails.commandName)
  .description(packageDetails.description)
  .version(packageDetails.version)
  .argument('<openApiPath>', 'Path or URL for the OpenAPI schema file')
  .argument('<outputDir>', 'Directory where the SDK should be generated')
  .option('-v, --verbose', 'enable verbose mode to show debug logs')
  .option('--disable-analytics', 'disable anonymous usage data collection')
  .action(
    async (
      openApiPath,
      outputDir,
      options: { verbose?: boolean; disableAnalytics?: boolean }
    ) => {
      let analyticsData: AnalyticsData | undefined

      if (options.verbose || isTsNode()) {
        logger.setVerbose(true)
        logger.debug('Verbose mode enabled, showing debug logs')
      }

      if (options.disableAnalytics) {
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
        await generateSDK(openApiPath, outputDir, analyticsData)
      } catch (error) {
        logger.error('Failed to generate SDK:')
        console.error(error)
      }

      if (!options.disableAnalytics && analyticsData) {
        logger.debug('Reporting following usage analytics data:')
        logger.debug(JSON.stringify(analyticsData, null, 2))

        await reportUsageAnalytics(analyticsData)
      }
    }
  )

program.parse()

import axios from 'axios'
import os from 'os'
import { v4 as uuidv4 } from 'uuid'
import { djb2Hash } from './helper'
import { logger } from './logger'
import { AnalyticsData, PackageDetails } from './type'

function getAnonymousUserId(): string {
  try {
    const userInfo = os.userInfo()

    // Combine username and uid to create a unique identifier
    const uniqueIdentifier = `${userInfo.username}-${userInfo.uid}-${userInfo.homedir}-${os.type()}-${os.hostname()}-${os.platform()}-${os.arch()}`

    return `${djb2Hash(uniqueIdentifier)}`
  } catch (error) {
    logger.error(`Error generating anonymous user id: ${error}`)
    return uuidv4()
  }
}

/**
 * This function generates a default analytics data object.
 *
 * @param packageDetails - Details of the openapi-to-k6 package.
 * @returns
 */
export function generateDefaultAnalyticsData(
  packageDetails: PackageDetails,
  isSampleK6ScriptGenerated: boolean
): AnalyticsData {
  const defaultAnalyticsData: AnalyticsData = {
    generatedRequestsCount: {
      post: 0,
      get: 0,
      put: 0,
      patch: 0,
      delete: 0,
      head: 0,
    },
    isSampleK6ScriptGenerated,
    openApiSpecVersion: '',
    toolVersion: packageDetails.version,
    anonymousUserId: getAnonymousUserId(),
  }
  try {
    return {
      ...defaultAnalyticsData,
      osPlatform: os.platform(),
      osArch: os.arch(),
      osType: os.type(),
    }
  } catch (error) {
    logger.error(`Error generating default analytics data: ${error}`)
    return defaultAnalyticsData
  }
}

export async function reportUsageAnalytics(analyticsData: AnalyticsData) {
  const baseUrl = process.env?.GRAFANA_STATS_URL || 'https://stats.grafana.org'
  const usageStatsUrl = `${baseUrl}/openapitok6-usage-report`
  const headers = {
    'Content-Type': 'application/json',
  }
  try {
    const response = await axios.post(usageStatsUrl, analyticsData, {
      headers: headers,
    })
    logger.debug(`Usage statistics data sent successfully: ${response.status}`)
  } catch (error) {
    logger.debug(`Error sending usage statistics data: ${error}`)
  }
}

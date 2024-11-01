/**
 * Automatically generated by @grafana/openapi-to-k6: 0.2.3
 * Do not edit manually.
 * Example API
 * API with all formats of query parameters
 * Service version: 1.0.0
 */
import { URL, URLSearchParams } from 'https://jslib.k6.io/url/1.0.0/index.js'
import http from 'k6/http'
import type { Params, Response } from 'k6/http'
export type GetExampleData200 = {
  age?: number
  date?: string
  isActive?: boolean
  name?: string
  tags?: string[]
}

export type GetExampleDataParams = {
  /**
   * A string parameter
   */
  name: string
  /**
   * An integer parameter
   */
  age?: number
  /**
   * A boolean parameter
   */
  isActive?: boolean
  /**
   * An array of strings parameter
   */
  tags?: string[]
  /**
   * A date parameter in YYYY-MM-DD format
   */
  date?: string
}

/**
 * This is the base client to use for interacting with the API.
 */
export class ExampleAPIClient {
  private cleanBaseUrl: string
  private commonRequestParameters: Params

  constructor(clientOptions: {
    baseUrl: string
    commonRequestParameters?: Params
  }) {
    this.cleanBaseUrl = clientOptions.baseUrl.replace(/\/+$/, '')
  }

  /**
   * This endpoint demonstrates the use of various query parameters
   * @summary Get example data
   */
  getExampleData(
    params: GetExampleDataParams,
    requestParameters?: Params
  ): {
    response: Response
    data: GetExampleData200
  } {
    const url = new URL(
      this.cleanBaseUrl +
        `/example` +
        `?${new URLSearchParams(params).toString()}`
    )
    const mergedRequestParameters = this._mergeRequestParameters(
      requestParameters || {},
      this.commonRequestParameters
    )
    const response = http.request('GET', url.toString(), undefined, {
      ...mergedRequestParameters,
    })
    let data

    try {
      data = response.json()
    } catch {
      data = response.body
    }
    return {
      response,
      data,
    }
  }

  /**
   * Merges the provided request parameters with default parameters for the client.
   *
   * @param {Params} requestParameters - The parameters provided specifically for the request
   * @param {Params} commonRequestParameters - Common parameters for all requests
   * @returns {Params} - The merged parameters
   */
  private _mergeRequestParameters(
    requestParameters?: Params,
    commonRequestParameters?: Params
  ): Params {
    return {
      ...commonRequestParameters, // Default to common parameters
      ...requestParameters, // Override with request-specific parameters
      headers: {
        ...(commonRequestParameters?.headers || {}), // Ensure headers are defined
        ...(requestParameters?.headers || {}),
      },
      cookies: {
        ...(commonRequestParameters?.cookies || {}), // Ensure cookies are defined
        ...(requestParameters?.cookies || {}),
      },
      tags: {
        ...(commonRequestParameters?.tags || {}), // Ensure tags are defined
        ...(requestParameters?.tags || {}),
      },
    }
  }
}

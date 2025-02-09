/**
 * Automatically generated by @grafana/openapi-to-k6: 0.3.2
 * Do not edit manually.
 * Example API
 * API with all formats of data in the POST request body
 * Service version: 1.0.0
 */
import { URL } from 'https://jslib.k6.io/url/1.0.0/index.js'
import http from 'k6/http'
import type { Params, Response } from 'k6/http'
import type {
  CreateExampleData201,
  CreateExampleDataBody,
} from './exampleAPI.schemas'

/**
 * This is the base client to use for interacting with the API.
 */
export class DefaultClient {
  private cleanBaseUrl: string
  private commonRequestParameters: Params

  constructor(clientOptions: {
    baseUrl: string
    commonRequestParameters?: Params
  }) {
    this.cleanBaseUrl = clientOptions.baseUrl.replace(/\/+$/, '')

    this.commonRequestParameters = clientOptions.commonRequestParameters || {}
  }

  /**
   * This endpoint demonstrates the use of various data formats in the input body
   * @summary Create example data
   */
  createExampleData(
    createExampleDataBody: CreateExampleDataBody,
    requestParameters?: Params
  ): {
    response: Response
    data: CreateExampleData201
  } {
    const url = new URL(this.cleanBaseUrl + `/example`)
    const mergedRequestParameters = this._mergeRequestParameters(
      requestParameters || {},
      this.commonRequestParameters
    )
    const response = http.request(
      'POST',
      url.toString(),
      JSON.stringify(createExampleDataBody),
      {
        ...mergedRequestParameters,
        headers: {
          ...mergedRequestParameters?.headers,
          'Content-Type': 'application/json',
        },
      }
    )
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

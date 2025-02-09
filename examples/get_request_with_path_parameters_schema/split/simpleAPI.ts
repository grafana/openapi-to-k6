/**
 * Automatically generated by @grafana/openapi-to-k6: 0.3.2
 * Do not edit manually.
 * Simple API
 * An API with a single GET request that takes a path parameter
 * Service version: 1.0.0
 */
import { URL } from 'https://jslib.k6.io/url/1.0.0/index.js'
import http from 'k6/http'
import type { Params, Response } from 'k6/http'
import type { GetItemById200 } from './simpleAPI.schemas'

/**
 * This is the base client to use for interacting with the API.
 */
export class SimpleAPIClient {
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
   * Returns a single item based on the provided ID
   * @summary Get an item by its ID
   */
  getItemById(
    id: string,
    requestParameters?: Params
  ): {
    response: Response
    data: GetItemById200
  } {
    const url = new URL(this.cleanBaseUrl + `/items/${id}`)
    const mergedRequestParameters = this._mergeRequestParameters(
      requestParameters || {},
      this.commonRequestParameters
    )
    const response = http.request(
      'GET',
      url.toString(),
      undefined,
      mergedRequestParameters
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

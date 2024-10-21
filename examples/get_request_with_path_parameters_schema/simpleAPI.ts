/**
 * Automatically generated by @grafana/openapi-to-k6: 0.1.0
 * Do not edit manually.
 * Simple API
 * An API with a single GET request that takes a path parameter
 * OpenAPI spec version: 1.0.0
 */
import { URL } from 'https://jslib.k6.io/url/1.0.0/index.js'
import http from 'k6/http'
import type { Params, Response, ResponseBody } from 'k6/http'
export type GetItemById200 = {
  description?: string
  id?: string
  name?: string
}

export type CreateSimpleAPIOptions = {
  baseUrl: string
  commonRequestParameters?: Params
}

/**
 * This is the base client to use for interacting with the API.
 */
export const createSimpleAPI = (clientOptions: CreateSimpleAPIOptions) => {
  const cleanBaseUrl = clientOptions.baseUrl.replace(/\/+$/, '')
  /**
   * Returns a single item based on the provided ID
   * @summary Get an item by its ID
   */
  const getItemById = (
    id: string,
    requestParameters?: Params
  ): GetItemByIdResponse => {
    const url = new URL(cleanBaseUrl + `/items/${id}`)
    const mergedRequestParameters = _mergeRequestParameters(
      requestParameters || {},
      clientOptions.commonRequestParameters
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
    } catch (error) {
      data = response.body
    }
    return {
      response,
      data,
    }
  }

  return { getItemById }
}

export type GetItemByIdResponse = {
  response: Response
  data: GetItemById200 | ResponseBody
}

/**
 * Merges the provided request parameters with default parameters for the client.
 *
 * @param {Params} requestParameters - The parameters provided specifically for the request
 * @param {Params} commonRequestParameters - Common parameters for all requests
 * @returns {Params} - The merged parameters
 */
const _mergeRequestParameters = (
  requestParameters?: Params,
  commonRequestParameters?: Params
): Params => {
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

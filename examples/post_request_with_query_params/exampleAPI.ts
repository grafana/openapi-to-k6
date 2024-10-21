/**
 * Automatically generated by @grafana/openapi-to-k6: 0.1.1
 * Do not edit manually.
 * Example API
 * API with a POST request having an object as the body and query parameters
 * OpenAPI spec version: 1.0.0
 */
import { URL, URLSearchParams } from 'https://jslib.k6.io/url/1.0.0/index.js'
import http from 'k6/http'
import type { Params, Response, ResponseBody } from 'k6/http'
export type CreateExampleData201 = {
  /** The data from the body */
  data?: string
  /** The active status from the query parameter */
  isActive?: boolean
  /** Response status */
  status?: string
  /** The user ID from the query parameter */
  userId?: string
}

export type CreateExampleDataBody = {
  /** A string field representing data */
  data: string
}

export type CreateExampleDataParams = {
  /**
   * A string query parameter for user ID
   */
  userId: string
  /**
   * A boolean query parameter
   */
  isActive?: boolean
}

export type CreateExampleAPIOptions = {
  baseUrl: string
  commonRequestParameters?: Params
}

/**
 * This is the base client to use for interacting with the API.
 */
export const createExampleAPI = (clientOptions: CreateExampleAPIOptions) => {
  const cleanBaseUrl = clientOptions.baseUrl.replace(/\/+$/, '')
  /**
   * This endpoint demonstrates a POST request with query parameters and a single field object in the body
   * @summary Create example data
   */
  const createExampleData = (
    createExampleDataBody: CreateExampleDataBody,
    params: CreateExampleDataParams,
    requestParameters?: Params
  ): CreateExampleDataResponse => {
    const url = new URL(
      cleanBaseUrl + `/example` + `?${new URLSearchParams(params).toString()}`
    )
    const mergedRequestParameters = _mergeRequestParameters(
      requestParameters || {},
      clientOptions.commonRequestParameters
    )
    const response = http.request(
      'POST',
      url.toString(),
      JSON.stringify(createExampleDataBody),
      {
        ...mergedRequestParameters,
        headers: {
          'Content-Type': 'application/json',
          ...mergedRequestParameters?.headers,
        },
      }
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

  return { createExampleData }
}

export type CreateExampleDataResponse = {
  response: Response
  data: CreateExampleData201 | ResponseBody
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

/**
 * Automatically generated by @grafana/openapi-to-k6: 0.1.0
 * Do not edit manually.
 * Example API
 * API with all formats of data in the POST request body
 * OpenAPI spec version: 1.0.0
 */
import { URL } from 'https://jslib.k6.io/url/1.0.0/index.js'
import http from 'k6/http'
import type { Params, Response, ResponseBody } from 'k6/http'
export type CreateExampleData201Meta = {
  createdBy?: string
  updatedBy?: string
}

export type CreateExampleData201 = {
  age?: number
  date?: string
  /** The unique ID of the created resource */
  id?: string
  isActive?: boolean
  meta?: CreateExampleData201Meta
  name?: string
  tags?: string[]
}

/**
 * An object parameter containing metadata
 */
export type CreateExampleDataBodyMeta = {
  /** A string parameter for the creator's name */
  createdBy?: string
  /** A string parameter for the updater's name */
  updatedBy?: string
}

export type CreateExampleDataBody = {
  /** An integer parameter */
  age: number
  /** A date parameter in YYYY-MM-DD format */
  date?: string
  /** A boolean parameter */
  isActive: boolean
  /** An object parameter containing metadata */
  meta?: CreateExampleDataBodyMeta
  /** A string parameter */
  name: string
  /** An array of strings */
  tags?: string[]
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
   * This endpoint demonstrates the use of various data formats in the input body
   * @summary Create example data
   */
  const createExampleData = (
    createExampleDataBody: CreateExampleDataBody,
    requestParameters?: Params
  ): CreateExampleDataResponse => {
    const url = new URL(cleanBaseUrl + `/example`)
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

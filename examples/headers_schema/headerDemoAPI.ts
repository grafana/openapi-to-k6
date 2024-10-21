/**
 * Automatically generated by @grafana/openapi-to-k6: 0.1.0
 * Do not edit manually.
 * Header Demo API
 * An API demonstrating the use of headers in different ways
 * OpenAPI spec version: 1.0.0
 */
import { URL } from 'https://jslib.k6.io/url/1.0.0/index.js'
import http from 'k6/http'
import type { Params, Response, ResponseBody } from 'k6/http'
export type GetExampleResponseHeaders200 = {
  status?: string
}

export type PostExamplePostBody = {
  data?: string
}

export type PostExamplePostHeaders = {
  /**
   * Bearer token for authorization
   */
  Authorization: string
}

export type GetExampleGet200 = {
  message?: string
}

export type GetExampleGetHeaders = {
  /**
   * A custom header for this request
   */
  'X-Custom-Header'?: string
}

export type CreateHeaderDemoAPIOptions = {
  baseUrl: string
  commonRequestParameters?: Params
}

/**
 * This is the base client to use for interacting with the API.
 */
export const createHeaderDemoAPI = (
  clientOptions: CreateHeaderDemoAPIOptions
) => {
  const cleanBaseUrl = clientOptions.baseUrl.replace(/\/+$/, '')
  /**
   * This GET request demonstrates the use of custom request headers
   * @summary GET request with headers
   */
  const getExampleGet = (
    headers?: GetExampleGetHeaders,
    requestParameters?: Params
  ): GetExampleGetResponse => {
    const url = new URL(cleanBaseUrl + `/example-get`)
    const mergedRequestParameters = _mergeRequestParameters(
      requestParameters || {},
      clientOptions.commonRequestParameters
    )
    const response = http.request('GET', url.toString(), undefined, {
      ...mergedRequestParameters,
      headers: {
        ...headers,
        ...mergedRequestParameters?.headers,
      },
    })
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

  /**
   * This POST request uses a security header for authentication
   * @summary POST request with security headers
   */
  const postExamplePost = (
    postExamplePostBody: PostExamplePostBody,
    headers: PostExamplePostHeaders,
    requestParameters?: Params
  ): PostExamplePostResponse => {
    const url = new URL(cleanBaseUrl + `/example-post`)
    const mergedRequestParameters = _mergeRequestParameters(
      requestParameters || {},
      clientOptions.commonRequestParameters
    )
    const response = http.request(
      'POST',
      url.toString(),
      JSON.stringify(postExamplePostBody),
      {
        ...mergedRequestParameters,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
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

  /**
   * This GET request returns custom response headers
   * @summary GET request with response headers only
   */
  const getExampleResponseHeaders = (
    requestParameters?: Params
  ): GetExampleResponseHeadersResponse => {
    const url = new URL(cleanBaseUrl + `/example-response-headers`)
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

  return { getExampleGet, postExamplePost, getExampleResponseHeaders }
}

export type GetExampleGetResponse = {
  response: Response
  data: GetExampleGet200 | ResponseBody
}
export type PostExamplePostResponse = {
  response: Response
  data: void | ResponseBody
}
export type GetExampleResponseHeadersResponse = {
  response: Response
  data: GetExampleResponseHeaders200 | ResponseBody
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

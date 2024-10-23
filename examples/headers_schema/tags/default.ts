/**
 * Automatically generated by @grafana/openapi-to-k6: 0.1.2
 * Do not edit manually.
 * Header Demo API
 * An API demonstrating the use of headers in different ways
 * OpenAPI spec version: 1.0.0
 */
import { URL } from 'https://jslib.k6.io/url/1.0.0/index.js'
import http from 'k6/http'
import type { Params, Response, ResponseBody } from 'k6/http'
import type {
  GetExampleGet200,
  GetExampleGetHeaders,
  GetExampleResponseHeaders200,
  PostExamplePostBody,
  PostExamplePostHeaders,
} from './headerDemoAPI.schemas'

/**
 * This is the base client to use for interacting with the API.
 */
export class createDefault {
  private cleanBaseUrl: string
  private commonRequestParameters: Params

  constructor(clientOptions: {
    baseUrl: string
    commonRequestParameters?: Params
  }) {
    this.cleanBaseUrl = clientOptions.baseUrl.replace(/\/+$/, '')
  }

  /**
   * This GET request demonstrates the use of custom request headers
   * @summary GET request with headers
   */
  getExampleGet(
    headers?: GetExampleGetHeaders,
    requestParameters?: Params
  ): {
    response: Response
    data: GetExampleGet200 | ResponseBody
  } {
    const url = new URL(this.cleanBaseUrl + `/example-get`)
    const mergedRequestParameters = this._mergeRequestParameters(
      requestParameters || {},
      this.commonRequestParameters
    )
    const response = http.request('GET', url.toString(), undefined, {
      ...mergedRequestParameters,
      headers: {
        // In the schema, headers can be of any type like number but k6 accepts only strings as headers, hence converting all headers to string
        ...Object.fromEntries(
          Object.entries(headers || {}).map(([key, value]) => [
            key,
            String(value),
          ])
        ),
        ...mergedRequestParameters?.headers,
      },
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
   * This POST request uses a security header for authentication
   * @summary POST request with security headers
   */
  postExamplePost(
    postExamplePostBody: PostExamplePostBody,
    headers: PostExamplePostHeaders,
    requestParameters?: Params
  ): {
    response: Response
    data: void | ResponseBody
  } {
    const url = new URL(this.cleanBaseUrl + `/example-post`)
    const mergedRequestParameters = this._mergeRequestParameters(
      requestParameters || {},
      this.commonRequestParameters
    )
    const response = http.request(
      'POST',
      url.toString(),
      JSON.stringify(postExamplePostBody),
      {
        ...mergedRequestParameters,
        headers: {
          'Content-Type': 'application/json',
          // In the schema, headers can be of any type like number but k6 accepts only strings as headers, hence converting all headers to string
          ...Object.fromEntries(
            Object.entries(headers || {}).map(([key, value]) => [
              key,
              String(value),
            ])
          ),
          ...mergedRequestParameters?.headers,
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
   * This GET request returns custom response headers
   * @summary GET request with response headers only
   */
  getExampleResponseHeaders(requestParameters?: Params): {
    response: Response
    data: GetExampleResponseHeaders200 | ResponseBody
  } {
    const url = new URL(this.cleanBaseUrl + `/example-response-headers`)
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

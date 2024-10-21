/**
 * Automatically generated by @grafana/openapi-to-k6: 0.1.1
 * Do not edit manually.
 * Form URL Encoded API
 * OpenAPI spec version: 1.0.0
 */
import { URL } from 'https://jslib.k6.io/url/1.0.0/index.js'
import http from 'k6/http'
import type { Params, Response, ResponseBody } from 'k6/http'
export type PostSubmitForm400 = {
  error?: string
  success?: boolean
}

export type PostSubmitForm200 = {
  message?: string
  success?: boolean
}

export type PostSubmitFormBody = {
  /** Age of the user */
  age?: number
  /** Email address of the user */
  email: string
  /** Name of the user */
  name: string
}

export type CreateFormURLEncodedAPIOptions = {
  baseUrl: string
  commonRequestParameters?: Params
}

/**
 * This is the base client to use for interacting with the API.
 */
export const createFormURLEncodedAPI = (
  clientOptions: CreateFormURLEncodedAPIOptions
) => {
  const cleanBaseUrl = clientOptions.baseUrl.replace(/\/+$/, '')
  /**
   * This endpoint accepts form URL-encoded data.
   * @summary Submit form data
   */
  const postSubmitForm = (
    postSubmitFormBody: PostSubmitFormBody,
    requestParameters?: Params
  ): PostSubmitFormResponse => {
    const url = new URL(cleanBaseUrl + `/submit-form`)
    const mergedRequestParameters = _mergeRequestParameters(
      requestParameters || {},
      clientOptions.commonRequestParameters
    )
    const response = http.request(
      'POST',
      url.toString(),
      JSON.stringify(postSubmitFormBody),
      {
        ...mergedRequestParameters,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
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

  return { postSubmitForm }
}

export type PostSubmitFormResponse = {
  response: Response
  data: PostSubmitForm200 | ResponseBody
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

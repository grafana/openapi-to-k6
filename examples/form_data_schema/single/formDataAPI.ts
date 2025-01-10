/**
 * Automatically generated by @grafana/openapi-to-k6: 0.3.0
 * Do not edit manually.
 * Form Data API
 * Service version: 1.0.0
 */
import { FormData } from 'https://jslib.k6.io/formdata/0.0.2/index.js'
import { URL } from 'https://jslib.k6.io/url/1.0.0/index.js'
import http from 'k6/http'
import type { Params, Response } from 'k6/http'
export type PostUpload400 = {
  success?: boolean
  error?: string
}

export type PostUpload200 = {
  success?: boolean
  message?: string
}

export type PostUploadBody = {
  /** File to upload */
  file: Blob
  /** Description of the file */
  description?: string
  /** User ID associated with the upload */
  userId: string
}

/**
 * This is the base client to use for interacting with the API.
 */
export class FormDataAPIClient {
  private cleanBaseUrl: string
  private commonRequestParameters: Params

  constructor(clientOptions: {
    baseUrl: string
    commonRequestParameters?: Params
  }) {
    this.cleanBaseUrl = clientOptions.baseUrl.replace(/\/+$/, '')
  }

  /**
   * This endpoint accepts form data and file uploads.
   * @summary Upload files and data
   */
  postUpload(
    postUploadBody: PostUploadBody,
    requestParameters?: Params
  ): {
    response: Response
    data: PostUpload200
  } {
    const formData = new FormData()
    formData.append('file', postUploadBody.file)
    if (postUploadBody.description !== undefined) {
      formData.append('description', postUploadBody.description)
    }
    formData.append('userId', postUploadBody.userId)

    const url = new URL(this.cleanBaseUrl + `/upload`)
    const mergedRequestParameters = this._mergeRequestParameters(
      requestParameters || {},
      this.commonRequestParameters
    )
    const response = http.request('POST', url.toString(), formData.body(), {
      ...mergedRequestParameters,
      headers: {
        'Content-Type': 'multipart/form-data; boundary=' + formData.boundary,
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

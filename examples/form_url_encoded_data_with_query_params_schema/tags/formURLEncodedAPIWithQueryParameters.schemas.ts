/**
 * Automatically generated by @grafana/openapi-to-k6: 0.1.2
 * Do not edit manually.
 * Form URL Encoded API with Query Parameters
 * OpenAPI spec version: 1.0.0
 */
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

export type PostSubmitFormParams = {
  /**
   * Authentication token
   */
  token: string
  /**
   * Locale of the user
   */
  locale?: string
}

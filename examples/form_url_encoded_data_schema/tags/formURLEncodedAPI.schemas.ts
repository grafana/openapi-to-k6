/**
 * Automatically generated by @grafana/openapi-to-k6: 0.3.0
 * Do not edit manually.
 * Form URL Encoded API
 * Service version: 1.0.0
 */
export type PostSubmitForm400 = {
  success?: boolean
  error?: string
}

export type PostSubmitForm200 = {
  success?: boolean
  message?: string
}

export type PostSubmitFormBody = {
  /** Name of the user */
  name: string
  /** Age of the user */
  age?: number
  /** Email address of the user */
  email: string
}

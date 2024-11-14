/**
 * Automatically generated by @grafana/openapi-to-k6: 0.3.0
 * Do not edit manually.
 * Form Data API
 * Service version: 1.0.0
 */
export type PostUpload400 = {
  error?: string
  success?: boolean
}

export type PostUpload200 = {
  message?: string
  success?: boolean
}

export type PostUploadBody = {
  /** Description of the file */
  description?: string
  /** File to upload */
  file: Blob
  /** User ID associated with the upload */
  userId: string
}

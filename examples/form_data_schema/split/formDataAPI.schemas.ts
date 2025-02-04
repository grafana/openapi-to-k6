/**
 * Automatically generated by @grafana/openapi-to-k6: 0.3.2
 * Do not edit manually.
 * Form Data API
 * Service version: 1.0.0
 */
export type PostUploadBody = {
  /** File to upload */
  file: Blob
  /** Description of the file */
  description?: string
  /** User ID associated with the upload */
  userId: string
}

export type PostUpload200 = {
  success?: boolean
  message?: string
}

export type PostUpload400 = {
  success?: boolean
  error?: string
}

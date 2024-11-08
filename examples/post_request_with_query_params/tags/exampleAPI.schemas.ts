/**
 * Automatically generated by @grafana/openapi-to-k6: 0.2.6
 * Do not edit manually.
 * Example API
 * API with a POST request having an object as the body and query parameters
 * Service version: 1.0.0
 */
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

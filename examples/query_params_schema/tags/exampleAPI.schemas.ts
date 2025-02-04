/**
 * Automatically generated by @grafana/openapi-to-k6: 0.3.2
 * Do not edit manually.
 * Example API
 * API with all formats of query parameters
 * Service version: 1.0.0
 */
export type GetExampleDataParams = {
  /**
   * A string parameter
   */
  name: string
  /**
   * An integer parameter
   */
  age?: number
  /**
   * A boolean parameter
   */
  isActive?: boolean
  /**
   * An array of strings parameter
   */
  tags?: string[]
  /**
   * A date parameter in YYYY-MM-DD format
   */
  date?: string
}

export type GetExampleData200 = {
  name?: string
  age?: number
  isActive?: boolean
  tags?: string[]
  date?: string
}

/**
 * Automatically generated by @grafana/openapi-to-k6: 0.3.0
 * Do not edit manually.
 * Example API
 * API with all formats of data in the POST request body
 * Service version: 1.0.0
 */
export type CreateExampleData201Meta = {
  createdBy?: string
  updatedBy?: string
}

export type CreateExampleData201 = {
  age?: number
  date?: string
  /** The unique ID of the created resource */
  id?: string
  isActive?: boolean
  meta?: CreateExampleData201Meta
  name?: string
  tags?: string[]
}

/**
 * An object parameter containing metadata
 */
export type CreateExampleDataBodyMeta = {
  /** A string parameter for the creator's name */
  createdBy?: string
  /** A string parameter for the updater's name */
  updatedBy?: string
}

export type CreateExampleDataBody = {
  /** An integer parameter */
  age: number
  /** A date parameter in YYYY-MM-DD format */
  date?: string
  /** A boolean parameter */
  isActive: boolean
  /** An object parameter containing metadata */
  meta?: CreateExampleDataBodyMeta
  /** A string parameter */
  name: string
  /** An array of strings */
  tags?: string[]
}

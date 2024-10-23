import { createExampleAPI } from './exampleAPI.ts'

const baseUrl = '<BASE_URL>'
const client = new createExampleAPI({ baseUrl })

export default function () {
  /**
   * Get example data
   */
  const getExampleDataResponseData = client.getExampleData(params)
}

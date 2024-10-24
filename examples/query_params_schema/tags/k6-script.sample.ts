import { ExampleAPIClient } from './exampleAPI.ts'

const baseUrl = '<BASE_URL>'
const client = new ExampleAPIClient({ baseUrl })

export default function () {
  /**
   * Get example data
   */
  const getExampleDataResponseData = client.getExampleData(params)
}

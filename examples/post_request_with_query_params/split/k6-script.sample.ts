import { ExampleAPIClient } from './exampleAPI.ts'

const baseUrl = '<BASE_URL>'
const client = new ExampleAPIClient({ baseUrl })

export default function () {
  /**
   * Create example data
   */
  const createExampleDataResponseData = client.createExampleData(
    createExampleDataBody,
    params
  )
}

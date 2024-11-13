import { ExampleAPIClient } from './exampleAPI.ts'

const baseUrl = '<BASE_URL>'
const client = new ExampleAPIClient({ baseUrl })

export default function () {
  let params

  /**
   * Get example data
   */
  params = {
    name: 'John Doe',
  }

  const getExampleDataResponseData = client.getExampleData(params)
}

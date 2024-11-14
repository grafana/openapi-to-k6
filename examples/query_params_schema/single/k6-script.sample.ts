import { ExampleAPIClient } from './exampleAPI.ts'

const baseUrl = '<BASE_URL>'
const exampleAPIClient = new ExampleAPIClient({ baseUrl })

export default function () {
  let params

  /**
   * Get example data
   */
  params = {
    name: 'John Doe',
  }

  const getExampleDataResponseData = exampleAPIClient.getExampleData(params)
}

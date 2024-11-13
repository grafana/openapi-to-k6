import { ExampleAPIClient } from './exampleAPI.ts'

const baseUrl = '<BASE_URL>'
const client = new ExampleAPIClient({ baseUrl })

export default function () {
  let createExampleDataBody, params

  /**
   * Create example data
   */
  createExampleDataBody = {
    data: 'data',
  }
  params = {
    userId: '12345',
  }

  const createExampleDataResponseData = client.createExampleData(
    createExampleDataBody,
    params
  )
}

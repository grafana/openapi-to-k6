import { ExampleAPIClient } from './exampleAPI.ts'

const baseUrl = '<BASE_URL>'
const client = new ExampleAPIClient({ baseUrl })

export default function () {
  let createExampleDataBody

  /**
   * Create example data
   */
  createExampleDataBody = {
    name: 'John Doe',
    age: '25',
    isActive: 'true',
    tags: 'tag1,tag2',
    date: '2024-01-01',
    meta: {
      createdBy: 'John Doe',
      updatedBy: 'Jane Doe',
    },
  }

  const createExampleDataResponseData = client.createExampleData(
    createExampleDataBody
  )
}

import { DefaultClient } from './default.ts'

const baseUrl = '<BASE_URL>'
const defaultClient = new DefaultClient({ baseUrl })

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

  const createExampleDataResponseData = defaultClient.createExampleData(
    createExampleDataBody
  )
}

import { DefaultClient } from './default.ts'

const baseUrl = '<BASE_URL>'
const defaultClient = new DefaultClient({ baseUrl })

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

  const createExampleDataResponseData = defaultClient.createExampleData(
    createExampleDataBody,
    params
  )
}

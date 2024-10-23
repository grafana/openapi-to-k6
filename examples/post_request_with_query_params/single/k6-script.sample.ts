import { createExampleAPI } from './exampleAPI.ts'

const baseUrl = '<BASE_URL>'
const client = new createExampleAPI({ baseUrl })

export default function () {
  /**
   * Create example data
   */
  const createExampleDataResponseData = client.createExampleData(
    createExampleDataBody,
    params
  )
}

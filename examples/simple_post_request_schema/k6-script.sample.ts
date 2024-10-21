import { createExampleAPI } from './exampleAPI.ts'

const baseUrl = '<BASE_URL>'
const client = createExampleAPI({ baseUrl })

export default function () {
  /**
   * Create example data
   */
  const createExampleDataResponseData = client.createExampleData(
    createExampleDataBody
  )
}

import { SimpleAPIClient } from './simpleAPI.ts'

const baseUrl = '<BASE_URL>'
const client = new SimpleAPIClient({ baseUrl })

export default function () {
  /**
   * Retrieve example data
   */
  const getExampleResponseData = client.getExample()
}

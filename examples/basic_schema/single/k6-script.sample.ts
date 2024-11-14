import { SimpleAPIClient } from './simpleAPI.ts'

const baseUrl = '<BASE_URL>'
const simpleAPIClient = new SimpleAPIClient({ baseUrl })

export default function () {
  /**
   * Retrieve example data
   */

  const getExampleResponseData = simpleAPIClient.getExample()
}

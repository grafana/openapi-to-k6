import { K6ClientClient } from './k6Client.ts'

const baseUrl = '<BASE_URL>'
const client = new K6ClientClient({ baseUrl })

export default function () {
  let

  /**
   * Retrieve example data
   */

  const getExampleResponseData = client.getExample()
}

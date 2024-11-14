import { K6ClientClient } from './k6Client.ts'

const baseUrl = '<BASE_URL>'
const k6ClientClient = new K6ClientClient({ baseUrl })

export default function () {
  /**
   * Retrieve example data
   */

  const getExampleResponseData = k6ClientClient.getExample()
}

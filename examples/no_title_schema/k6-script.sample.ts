import { createK6Client } from './k6Client.ts'

const baseUrl = '<BASE_URL>'
const client = createK6Client({ baseUrl })

export default function () {
  /**
   * Retrieve example data
   */
  const getExampleResponseData = client.getExample()
}

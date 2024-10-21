import { createSimpleAPI } from './simpleAPI.ts'

const baseUrl = '<BASE_URL>'
const client = createSimpleAPI({ baseUrl })

export default function () {
  /**
   * Retrieve example data
   */
  const getExampleResponseData = client.getExample()
}

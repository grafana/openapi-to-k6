import { DefaultClient } from './default.ts'

const baseUrl = '<BASE_URL>'
const defaultClient = new DefaultClient({ baseUrl })

export default function () {
  /**
   * Retrieve example data
   */

  const getExampleResponseData = defaultClient.getExample()
}

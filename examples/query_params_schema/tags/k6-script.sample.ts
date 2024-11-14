import { DefaultClient } from './default.ts'

const baseUrl = '<BASE_URL>'
const defaultClient = new DefaultClient({ baseUrl })

export default function () {
  let params

  /**
   * Get example data
   */
  params = {
    name: 'John Doe',
  }

  const getExampleDataResponseData = defaultClient.getExampleData(params)
}

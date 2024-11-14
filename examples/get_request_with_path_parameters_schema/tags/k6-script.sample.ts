import { DefaultClient } from './default.ts'

const baseUrl = '<BASE_URL>'
const defaultClient = new DefaultClient({ baseUrl })

export default function () {
  let id

  /**
   * Get an item by its ID
   */
  id = '12345'

  const getItemByIdResponseData = defaultClient.getItemById(id)
}

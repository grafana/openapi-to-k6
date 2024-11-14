import { SimpleAPIClient } from './simpleAPI.ts'

const baseUrl = '<BASE_URL>'
const simpleAPIClient = new SimpleAPIClient({ baseUrl })

export default function () {
  let id

  /**
   * Get an item by its ID
   */
  id = '12345'

  const getItemByIdResponseData = simpleAPIClient.getItemById(id)
}

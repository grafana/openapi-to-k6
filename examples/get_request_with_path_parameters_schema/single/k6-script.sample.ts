import { createSimpleAPI } from './simpleAPI.ts'

const baseUrl = '<BASE_URL>'
const client = new createSimpleAPI({ baseUrl })

export default function () {
  /**
   * Get an item by its ID
   */
  const getItemByIdResponseData = client.getItemById(id)
}

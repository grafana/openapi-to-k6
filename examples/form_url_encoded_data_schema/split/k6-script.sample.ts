import { createFormURLEncodedAPI } from './formURLEncodedAPI.ts'

const baseUrl = '<BASE_URL>'
const client = new createFormURLEncodedAPI({ baseUrl })

export default function () {
  /**
   * Submit form data
   */
  const postSubmitFormResponseData = client.postSubmitForm(postSubmitFormBody)
}

import { createFormURLEncodedAPI } from './formURLEncodedAPI.ts'

const baseUrl = '<BASE_URL>'
const client = createFormURLEncodedAPI({ baseUrl })

export default function () {
  /**
   * Submit form data
   */
  const postSubmitFormResponseData = client.postSubmitForm(postSubmitFormBody)
}

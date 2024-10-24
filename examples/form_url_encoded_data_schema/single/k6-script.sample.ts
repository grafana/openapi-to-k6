import { FormURLEncodedAPIClient } from './formURLEncodedAPI.ts'

const baseUrl = '<BASE_URL>'
const client = new FormURLEncodedAPIClient({ baseUrl })

export default function () {
  /**
   * Submit form data
   */
  const postSubmitFormResponseData = client.postSubmitForm(postSubmitFormBody)
}

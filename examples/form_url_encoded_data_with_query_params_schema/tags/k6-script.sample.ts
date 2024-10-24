import { FormURLEncodedAPIwithQueryParametersClient } from './formURLEncodedAPIWithQueryParameters.ts'

const baseUrl = '<BASE_URL>'
const client = new FormURLEncodedAPIwithQueryParametersClient({ baseUrl })

export default function () {
  /**
   * Submit form data with query parameters
   */
  const postSubmitFormResponseData = client.postSubmitForm(
    postSubmitFormBody,
    params
  )
}

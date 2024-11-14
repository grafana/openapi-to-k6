import { FormURLEncodedAPIWithQueryParametersClient } from './formURLEncodedAPIWithQueryParameters.ts'

const baseUrl = '<BASE_URL>'
const formURLEncodedAPIWithQueryParametersClient =
  new FormURLEncodedAPIWithQueryParametersClient({ baseUrl })

export default function () {
  let postSubmitFormBody, params

  /**
   * Submit form data with query parameters
   */
  postSubmitFormBody = {
    name: 'John Doe',
    age: '25',
    email: 'john.doe@example.com',
  }
  params = {
    token: 'Bearer abcdef12345',
  }

  const postSubmitFormResponseData =
    formURLEncodedAPIWithQueryParametersClient.postSubmitForm(
      postSubmitFormBody,
      params
    )
}

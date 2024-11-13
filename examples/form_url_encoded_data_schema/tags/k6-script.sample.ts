import { FormURLEncodedAPIClient } from './formURLEncodedAPI.ts'

const baseUrl = '<BASE_URL>'
const client = new FormURLEncodedAPIClient({ baseUrl })

export default function () {
  let postSubmitFormBody

  /**
   * Submit form data
   */
  postSubmitFormBody = {
    name: 'John Doe',
    age: '25',
    email: 'john.doe@example.com',
  }

  const postSubmitFormResponseData = client.postSubmitForm(postSubmitFormBody)
}

import { DefaultClient } from './default.ts'

const baseUrl = '<BASE_URL>'
const defaultClient = new DefaultClient({ baseUrl })

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

  const postSubmitFormResponseData = defaultClient.postSubmitForm(
    postSubmitFormBody,
    params
  )
}

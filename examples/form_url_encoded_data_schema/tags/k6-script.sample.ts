import { DefaultClient } from './default.ts'

const baseUrl = '<BASE_URL>'
const defaultClient = new DefaultClient({ baseUrl })

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

  const postSubmitFormResponseData =
    defaultClient.postSubmitForm(postSubmitFormBody)
}

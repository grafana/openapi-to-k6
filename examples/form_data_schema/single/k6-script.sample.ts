import { FormDataAPIClient } from './formDataAPI.ts'

const baseUrl = '<BASE_URL>'
const formDataAPIClient = new FormDataAPIClient({ baseUrl })

export default function () {
  let postUploadBody

  /**
   * Upload files and data
   */
  postUploadBody = {
    file: 'example.pdf',
    description: 'Monthly report document',
    userId: 'user123',
  }

  const postUploadResponseData = formDataAPIClient.postUpload(postUploadBody)
}

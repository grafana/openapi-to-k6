import { FormDataAPIClient } from './formDataAPI.ts'

const baseUrl = '<BASE_URL>'
const client = new FormDataAPIClient({ baseUrl })

export default function () {
  /**
   * Upload files and data
   */
  const postUploadResponseData = client.postUpload(postUploadBody)
}

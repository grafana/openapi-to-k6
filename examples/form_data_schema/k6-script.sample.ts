import { createFormDataAPI } from './formDataAPI.ts'

const baseUrl = '<BASE_URL>'
const client = createFormDataAPI({ baseUrl })

export default function () {
  /**
   * Upload files and data
   */
  const postUploadResponseData = client.postUpload(postUploadBody)
}
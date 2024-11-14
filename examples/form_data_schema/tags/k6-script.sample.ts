import { DefaultClient } from './default.ts'

const baseUrl = '<BASE_URL>'
const defaultClient = new DefaultClient({ baseUrl })

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

  const postUploadResponseData = defaultClient.postUpload(postUploadBody)
}

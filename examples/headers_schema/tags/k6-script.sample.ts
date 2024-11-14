import { DefaultClient } from './default.ts'

const baseUrl = '<BASE_URL>'
const defaultClient = new DefaultClient({ baseUrl })

export default function () {
  let postExamplePostBody, headers

  /**
   * GET request with headers
   */

  const getExampleGetResponseData = defaultClient.getExampleGet()

  /**
   * POST request with security headers
   */
  postExamplePostBody = {
    data: 'redevelop',
  }
  headers = {
    Authorization: 'Bearer <token>',
  }

  const postExamplePostResponseData = defaultClient.postExamplePost(
    postExamplePostBody,
    headers
  )

  /**
   * GET request with response headers only
   */

  const getExampleResponseHeadersResponseData =
    defaultClient.getExampleResponseHeaders()
}

import { HeaderDemoAPIClient } from './headerDemoAPI.ts'

const baseUrl = '<BASE_URL>'
const headerDemoAPIClient = new HeaderDemoAPIClient({ baseUrl })

export default function () {
  let postExamplePostBody, headers

  /**
   * GET request with headers
   */

  const getExampleGetResponseData = headerDemoAPIClient.getExampleGet()

  /**
   * POST request with security headers
   */
  postExamplePostBody = {
    data: 'redevelop',
  }
  headers = {
    Authorization: 'Bearer <token>',
  }

  const postExamplePostResponseData = headerDemoAPIClient.postExamplePost(
    postExamplePostBody,
    headers
  )

  /**
   * GET request with response headers only
   */

  const getExampleResponseHeadersResponseData =
    headerDemoAPIClient.getExampleResponseHeaders()
}

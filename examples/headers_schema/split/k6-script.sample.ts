import { HeaderDemoAPIClient } from './headerDemoAPI.ts'

const baseUrl = '<BASE_URL>'
const client = new HeaderDemoAPIClient({ baseUrl })

export default function () {
  /**
   * GET request with headers
   */
  const getExampleGetResponseData = client.getExampleGet()

  /**
   * POST request with security headers
   */
  const postExamplePostResponseData = client.postExamplePost(
    postExamplePostBody,
    headers
  )

  /**
   * GET request with response headers only
   */
  const getExampleResponseHeadersResponseData =
    client.getExampleResponseHeaders()
}

import { ExampleAPIClient } from './exampleAPI.ts'

const baseUrl = '<BASE_URL>'
const exampleAPIClient = new ExampleAPIClient({ baseUrl })

export default function () {
  /**
   *
   */

  const emptyResponseResponseData = exampleAPIClient.emptyResponse()
}

/* eslint-disable import/no-unresolved */
import { check } from 'k6'
import { ComprehensiveAPIClient } from './sdk.ts'
/* eslint-enable import/no-unresolved */

const baseUrl = 'http://localhost:3000'
const client = new ComprehensiveAPIClient({ baseUrl })

export const options = {
  thresholds: {
    // the rate of successful checks should be higher than 90%
    checks: ['rate>=1'],
  },
}

function checkResponseStatus(response, expectedStatus) {
  const result = check(response, {
    [`status is ${expectedStatus}`]: (r) => r.status === expectedStatus,
  })

  if (!result) {
    console.error(
      `Check failed! Expected status ${expectedStatus} but got ${response.status}. Following is the response:`
    )
    console.log(JSON.stringify(response, null, 2))
  }
}

export default function () {
  const getResponseData = client.getItemsId('1')
  checkResponseStatus(getResponseData.response, 200)

  const postResponseData = client.postItemsId('1', {
    name: 'string',
  })
  checkResponseStatus(postResponseData.response, 201)

  const putResponseData = client.putItemsId('1', {
    description: 'string',
  })
  checkResponseStatus(putResponseData.response, 200)

  const deleteResponseData = client.deleteItemsId('1')
  checkResponseStatus(deleteResponseData.response, 204)

  const patchResponseData = client.patchItemsId('1', {
    name: 'string',
  })
  checkResponseStatus(patchResponseData.response, 200)

  const headResponseData = client.headItemsId('1')
  checkResponseStatus(headResponseData.response, 200)

  const postFormUrlEncodedResponseData = client.postItemsFormUrlEncoded({
    name: 'string',
  })
  checkResponseStatus(postFormUrlEncodedResponseData.response, 201)
  // Should add x-www-form-urlencoded content type header in request
  check(postFormUrlEncodedResponseData.response, {
    'has x-www-form-urlencoded content type header': (r) =>
      r.request.headers['Content-Type'][0] ===
      'application/x-www-form-urlencoded',
  })

  const postFormDataResponseData = client.postItemsFormData({
    name: 'string',
  })
  checkResponseStatus(postFormDataResponseData.response, 201)

  // Should add multipart/form-data content type header in request with boundary
  check(postFormDataResponseData.response, {
    'has multipart/form-data content type header with bounday': (r) =>
      r.request.headers['Content-Type'][0].includes(
        'multipart/form-data; boundary=---'
      ),
  })

  const getItemsHeaderResponseData = client.getItemsHeader({
    id: 'test',
  })
  checkResponseStatus(getItemsHeaderResponseData.response, 200)
}

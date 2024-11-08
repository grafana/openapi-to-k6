/* eslint-disable import/no-unresolved */
import { check } from 'k6'
import { ItemsFormClient } from './items-form.ts'
import { ItemsHeaderClient } from './items-header.ts'
import { ItemsClient } from './items.ts'

/* eslint-enable import/no-unresolved */

const baseUrl = 'http://localhost:3000'
const itemsClient = new ItemsClient({ baseUrl })
const itemFormClient = new ItemsFormClient({ baseUrl })
const itemsHeaderClient = new ItemsHeaderClient({ baseUrl })

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
  // Items client calls start
  const getResponseData = itemsClient.getItemsId('1')
  checkResponseStatus(getResponseData.response, 200)

  const postResponseData = itemsClient.postItemsId('1', {
    name: 'string',
  })
  checkResponseStatus(postResponseData.response, 201)

  const putResponseData = itemsClient.putItemsId('1', {
    description: 'string',
  })
  checkResponseStatus(putResponseData.response, 200)

  const deleteResponseData = itemsClient.deleteItemsId('1')
  checkResponseStatus(deleteResponseData.response, 204)

  const patchResponseData = itemsClient.patchItemsId('1', {
    name: 'string',
  })
  checkResponseStatus(patchResponseData.response, 200)

  const headResponseData = itemsClient.headItemsId('1')
  checkResponseStatus(headResponseData.response, 200)

  const postFormUrlEncodedResponseDataFromItem =
    itemsClient.postItemsFormUrlEncoded({
      name: 'string',
    })
  checkResponseStatus(postFormUrlEncodedResponseDataFromItem.response, 201)
  // Should add x-www-form-urlencoded content type header in request
  check(postFormUrlEncodedResponseDataFromItem.response, {
    'has x-www-form-urlencoded content type header': (r) =>
      r.request.headers['Content-Type'][0] ===
      'application/x-www-form-urlencoded',
  })
  // Items client calls end

  // Items form client call start
  const postFormUrlEncodedResponseData = itemFormClient.postItemsFormUrlEncoded(
    {
      name: 'string',
    }
  )
  checkResponseStatus(postFormUrlEncodedResponseData.response, 201)
  // Should add x-www-form-urlencoded content type header in request
  check(postFormUrlEncodedResponseData.response, {
    'has x-www-form-urlencoded content type header': (r) =>
      r.request.headers['Content-Type'][0] ===
      'application/x-www-form-urlencoded',
  })

  const postFormDataResponseData = itemFormClient.postItemsFormData({
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
  // Items form client call end

  // Default client call start
  const getItemsHeaderResponseData = itemsHeaderClient.getItemsHeader({
    id: 'test',
  })
  checkResponseStatus(getItemsHeaderResponseData.response, 200)
  // Default client call end
}

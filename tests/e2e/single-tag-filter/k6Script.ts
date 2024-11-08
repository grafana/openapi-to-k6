/* eslint-disable import/no-unresolved */
import { check } from 'k6'
import { Counter } from 'k6/metrics'
import { ComprehensiveAPIClient } from './sdk.ts'
/* eslint-enable import/no-unresolved */

const CounterErrors = new Counter('Errors')
const CounterSuccess = new Counter('Success')
const baseUrl = 'http://localhost:3000'
const client = new ComprehensiveAPIClient({ baseUrl })

export const options = {
  thresholds: {
    Errors: ['count>=1'],
    Success: ['count>=1'],
    // the rate of successful checks should be higher than 90%
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
  } else {
    CounterSuccess.add(1)
  }
}

export default function () {
  try {
    const getResponseData = client.getItemsId('1')
    checkResponseStatus(getResponseData.response, 200)
  } catch (error) {
    if (error instanceof TypeError) {
      // Add a k6 check to verify if the error is thrown
      CounterErrors.add(1)
    }
  }

  const getItemsHeaderResponseData = client.getItemsHeader({
    id: 'test',
  })
  checkResponseStatus(getItemsHeaderResponseData.response, 200)
}

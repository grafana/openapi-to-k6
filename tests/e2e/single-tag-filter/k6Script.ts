/* eslint-disable import/no-unresolved */
import { check } from 'k6'
import { Counter } from 'k6/metrics'
import { ComprehensiveAPIClient } from './sdk.ts'
/* eslint-enable import/no-unresolved */

const CounterErrors = new Counter('Errors')
const CounterSuccess = new Counter('Success')
const completedIterations = new Counter('completed_iterations')
const baseUrl = 'http://localhost:3000'
const client = new ComprehensiveAPIClient({ baseUrl })

export const options = {
  vus: 1,
  iterations: 1,
  thresholds: {
    completed_iterations: ['count==1'],
    checks: ['rate>=1'],
    Errors: ['count>=1'],
    Success: ['count>=1'],
    // All assertions must pass and the complete iteration must finish.
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
  completedIterations.add(0)
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
  completedIterations.add(1)
}

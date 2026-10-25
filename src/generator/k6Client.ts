import {
  ClientDependenciesBuilder,
  ClientFooterBuilder,
  ClientGeneratorsBuilder,
  ClientHeaderBuilder,
  ClientTitleBuilder,
  generateFormDataAndUrlEncodedFunction,
  generateVerbImports,
  GeneratorOptions,
  GeneratorSchema,
  GeneratorVerbOptions,
  GetterBody,
  GetterResponse,
  pascal,
  sanitize,
  toObjectString,
  jsStringEscape,
} from '@orval/core'
import { DEFAULT_SCHEMA_TITLE } from '../constants.js'
import { AnalyticsData } from '../type.js'
import { k6ScriptBuilder } from './k6ScriptBuilder.js'
function _generateResponseTypeDefinition(response: GetterResponse): string {
  let responseDataType = ''

  if (
    response.definition.success &&
    !['any', 'unknown'].includes(response.definition.success)
  ) {
    responseDataType += response.definition.success
  } else {
    responseDataType += 'ResponseBody'
  }

  return `{
    response: Response
    data: ${responseDataType}
    operationId: string
}`
}

const INTERNAL_URL_TOKEN = 'k6url'

function _getRequestParametersMergerFunctionImplementation() {
  return `/**
 * Merges the provided request parameters with default parameters for the client.
 *
 * @param {Params} requestParameters - The parameters provided specifically for the request
 * @param {Params} commonRequestParameters - Common parameters for all requests
 * @returns {Params} - The merged parameters
 */
  private _mergeRequestParameters (requestParameters?: Params, commonRequestParameters?: Params): Params {
    return {
        ...commonRequestParameters,  // Default to common parameters
        ...requestParameters,        // Override with request-specific parameters
        headers: {
            ...commonRequestParameters?.headers || {},  // Ensure headers are defined
            ...requestParameters?.headers || {},
        },
        cookies: {
            ...commonRequestParameters?.cookies || {},  // Ensure cookies are defined
            ...requestParameters?.cookies || {},
        },
        tags: {
            ...commonRequestParameters?.tags || {},     // Ensure tags are defined
            ...requestParameters?.tags || {},
        },
    };
};`
}

const _getRequestParamsValue = ({
  response,
  queryParams,
  headers,
  body,
}: {
  response: GetterResponse
  body: GetterBody
  queryParams?: GeneratorSchema
  headers?: GeneratorSchema
}) => {
  if (!queryParams && !headers && !response.isBlob && !body.contentType) {
    // No parameters to merge, return the request parameters directly
    return 'mergedRequestParameters'
  }

  let value = '\n    ...mergedRequestParameters,'

  if (response.isBlob) {
    value += `\n        responseType: 'binary',`
  }
  // Expand the headers
  if (body.contentType || headers) {
    let headersValue = `\n       headers: {`
    headersValue += '\n...mergedRequestParameters?.headers,'
    if (body.contentType) {
      if (body.formData) {
        headersValue += `\n'Content-Type': '${body.contentType}; boundary=' + formData.boundary,`
      } else {
        headersValue += `\n'Content-Type': '${body.contentType}',`
      }
    }

    if (headers) {
      headersValue += `\n// In the schema, headers can be of any type like number but k6 accepts only strings as headers, hence converting all headers to string`
      headersValue += `\n...Object.fromEntries(Object.entries(headers || {}).map(([key, value]) => [key, String(value)])),`
    }

    headersValue += `\n},`
    value += headersValue
  }

  return `{${value}}`
}

const _getK6RequestOptions = (verbOptions: GeneratorVerbOptions) => {
  const { body, headers, queryParams, response, verb } = verbOptions
  let fetchBodyOption = 'undefined'

  if (body.formData) {
    // Use the FormData.body() method to get the body of the request
    fetchBodyOption = 'formData.body()'
  } else if (body.contentType === 'application/json') {
    fetchBodyOption = `JSON.stringify(${body.implementation})`
  } else if (body.formUrlEncoded) {
    fetchBodyOption = `\n// k6 accepts JS objects for form URL encoded requests, but all properties must be strings`
    fetchBodyOption += `\nObject.fromEntries(Object.entries(${body.implementation}).map(([key, value]) => [key, String(value)]))`
  } else if (body.implementation) {
    fetchBodyOption = body.implementation
  }

  // Generate the params input for the call

  const requestParametersValue = _getRequestParamsValue({
    response,
    body,
    headers: headers?.schema,
    queryParams: queryParams?.schema,
  })

  // Sample output
  // 'GET', 'http://test.com/route', <body>, <options>

  return `"${verb.toUpperCase()}",
        ${INTERNAL_URL_TOKEN}.toString(),
        ${fetchBodyOption},
        ${requestParametersValue}`
}

const getK6Dependencies: ClientDependenciesBuilder = () => [
  {
    exports: [
      {
        name: 'http',
        default: true,
        values: true,
        syntheticDefaultImport: true,
      },
      { name: 'Response' },
      { name: 'ResponseBody' },
      { name: 'Params' },
    ],
    dependency: 'k6/http',
  },
  {
    exports: [
      {
        name: 'FormData',
        default: false,
        values: true,
        // syntheticDefaultImport: true,
      },
    ],
    dependency: 'https://jslib.k6.io/formdata/0.0.2/index.js',
  },
]

const generateK6Implementation = (
  verbOptions: GeneratorVerbOptions,
  { route }: GeneratorOptions,
  analyticsData?: AnalyticsData
) => {
  const {
    queryParams,
    operationName,
    operationId,
    response,
    body,
    props,
    verb,
    formData,
    formUrlEncoded,
  } = verbOptions
  if (analyticsData) {
    analyticsData.generatedRequestsCount[verb] += 1
  }

  const bodyForm = generateFormDataAndUrlEncodedFunction({
    formData,
    formUrlEncoded,
    body,
    isFormData: true,
    isFormUrlEncoded: false,
  })

  const encodedRoute = route.includes('${')
    ? `encodeURI(\`${route}\`.replace(/([\\uD800-\\uDBFF][\\uDC00-\\uDFFF])|[\\uD800-\\uDFFF]/g, (surrogate) => surrogate.length === 2 ? surrogate : '\\uFFFD'))`
    : `encodeURI(\`${route}\`)`
  let url = `this.cleanBaseUrl + ${encodedRoute}`

  if (queryParams) {
    url += '+`?${__k6SerializeQueryParams(params)}`'
  }
  const urlGeneration = `const ${INTERNAL_URL_TOKEN} = ${url};`

  const options = _getK6RequestOptions(verbOptions)

  return `${operationName}(\n    ${toObjectString(props, 'implementation')} requestParameters?: Params): ${_generateResponseTypeDefinition(response)} {\n${bodyForm}
        ${urlGeneration}
        const mergedRequestParameters = this._mergeRequestParameters(requestParameters || {}, this.commonRequestParameters);
        const response = http.request(${options});
        let data;

        try {
            data = response.json();
        } catch {
            data = response.body;
        }
      return {
        response,
        data,
        operationId: '${jsStringEscape(operationId)}'
      }
    }
  `
}

export const generateTitle: ClientTitleBuilder = (title) => {
  const sanTitle = sanitize(title || DEFAULT_SCHEMA_TITLE)
  return `${pascal(sanTitle)}Client`
}

const getQueryParameterSerializerImplementation = () => `
  function __k6EncodeFormComponent(value: unknown): string {
    const input = String(value)
    let normalized = ''

    for (let index = 0; index < input.length; index++) {
      const code = input.charCodeAt(index)
      if (code >= 0xd800 && code <= 0xdbff) {
        const next = input.charCodeAt(index + 1)
        if (next >= 0xdc00 && next <= 0xdfff) {
          normalized += input.slice(index, index + 2)
          index++
        } else {
          normalized += String.fromCharCode(0xfffd)
        }
      } else if (code >= 0xdc00 && code <= 0xdfff) {
        normalized += String.fromCharCode(0xfffd)
      } else {
        normalized += input.charAt(index)
      }
    }

    return encodeURIComponent(normalized)
      .replace(/[!'()~]/g, (character) => '%' + character.charCodeAt(0).toString(16).toUpperCase())
      .replace(/%20/g, '+')
  }

  function __k6SerializeQueryParams(params: object): string {
    return Object.entries(params)
      .map(([key, value]) => __k6EncodeFormComponent(key) + '=' + __k6EncodeFormComponent(value))
      .join('&')
  }
`

const generateK6Header: ClientHeaderBuilder = ({
  title,
  clientImplementation,
}) => {
  const queryParameterSerializer = clientImplementation.includes(
    '__k6SerializeQueryParams'
  )
    ? getQueryParameterSerializerImplementation()
    : ''

  return `
  /**
   * This is the base client to use for interacting with the API.
   */
  ${queryParameterSerializer}

  export class ${title} {
      private cleanBaseUrl: string;
      private commonRequestParameters: Params;

      constructor (clientOptions: {
    baseUrl: string,
    commonRequestParameters?: Params
}) {
       this.cleanBaseUrl = clientOptions.baseUrl.replace(/\\/+$/, '');\n
       this.commonRequestParameters = clientOptions.commonRequestParameters || {};
      }\n
`
}

const generateFooter: ClientFooterBuilder = () => {
  // Add function definition for merging request parameters
  const footer = `

  ${_getRequestParametersMergerFunctionImplementation()}

}

  `
  return footer
}

function getK6Client(analyticsData?: AnalyticsData) {
  return function (
    verbOptions: GeneratorVerbOptions,
    options: GeneratorOptions
  ) {
    const imports = generateVerbImports(verbOptions)
    const implementation = generateK6Implementation(
      verbOptions,
      options,
      analyticsData
    )

    return { implementation, imports }
  }
}

export function getK6ClientBuilder(
  shouldGenerateSampleK6Script?: boolean,
  analyticsData?: AnalyticsData
): ClientGeneratorsBuilder {
  return {
    client: getK6Client(analyticsData),
    header: generateK6Header,
    dependencies: getK6Dependencies,
    footer: generateFooter,
    title: generateTitle,
    extraFiles: shouldGenerateSampleK6Script ? k6ScriptBuilder : undefined,
  }
}

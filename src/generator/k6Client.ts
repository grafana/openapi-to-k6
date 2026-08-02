import {
  ClientDependenciesBuilder,
  ClientFooterBuilder,
  ClientGeneratorsBuilder,
  ClientHeaderBuilder,
  ClientTitleBuilder,
  ContextSpecs,
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
import { DEFAULT_SCHEMA_TITLE } from '../constants'
import { AnalyticsData } from '../type'
import { k6ScriptBuilder } from './k6ScriptBuilder'
/**
 * In case the supplied schema does not have a title set, it will set the default title to ensure
 * proper client generation
 *
 * @param context - The context object containing the schema details
 */
function _setDefaultSchemaTitle(context: ContextSpecs) {
  const schemaDetails = context.specs[context.specKey]
  if (schemaDetails && !schemaDetails.info.title) {
    schemaDetails.info.title = DEFAULT_SCHEMA_TITLE
  }
}

function _generateResponseTypeDefinition(response: GetterResponse): string {
  return `{
    response: Response
    data: ${_getResponseDataType(response)}
    operationId: string
}`
}

function _generatePreparedRequestTypeDefinition(
  response: GetterResponse
): string {
  return `PreparedRequest<${_getResponseDataType(response)}>`
}

function _getResponseDataType(response: GetterResponse): string {
  let responseDataType = ''

  if (
    response.definition.success &&
    !['any', 'unknown'].includes(response.definition.success)
  ) {
    responseDataType += response.definition.success
  } else {
    responseDataType += 'ResponseBody'
  }

  return responseDataType
}

function _generateResponseParser(response: GetterResponse): string {
  const responseDataType = _getResponseDataType(response)
  if (responseDataType === 'void') return '() => undefined'

  return `(response) => {
            try {
              return response.json() as unknown as ${responseDataType};
            } catch {
              return response.body as unknown as ${responseDataType};
            }
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

const _getK6RequestParts = (verbOptions: GeneratorVerbOptions) => {
  const { body, headers, queryParams, response, verb } = verbOptions
  let fetchBodyOption = 'undefined'

  if (body.formData) {
    // Use the FormData.body() method to get the body of the request
    fetchBodyOption = 'formData.body()'
  } else if (
    body.contentType === 'application/json' ||
    body.contentType?.endsWith('+json')
  ) {
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

  return {
    method: `"${verb.toUpperCase()}"`,
    url: `${INTERNAL_URL_TOKEN}.toString()`,
    body: fetchBodyOption,
    params: requestParametersValue,
  }
}

const _getK6RequestOptions = (verbOptions: GeneratorVerbOptions) => {
  const { method, url, body, params } = _getK6RequestParts(verbOptions)
  return `${method},
        ${url},
        ${body},
        ${params}`
}

const _getK6BatchRequest = (verbOptions: GeneratorVerbOptions) => {
  const { method, url, body, params } = _getK6RequestParts(verbOptions)
  return `{
        method: ${method},
        url: ${url},
        body: ${body},
        params: ${params},
      }`
}

const getK6Dependencies =
  (shouldGeneratePreparedRequests: boolean): ClientDependenciesBuilder =>
  () => [
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
        ...(shouldGeneratePreparedRequests
          ? [{ name: 'ObjectBatchRequest' }]
          : []),
      ],
      dependency: 'k6/http',
    },
    {
      exports: [
        {
          name: 'URLSearchParams',
          default: false,
          values: true,
          // syntheticDefaultImport: true,
        },
        {
          name: 'URL',
          default: false,
          values: true,
          // syntheticDefaultImport: true,
        },
      ],
      dependency: 'https://jslib.k6.io/url/1.0.0/index.js',
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
  analyticsData?: AnalyticsData,
  shouldGeneratePreparedRequests = false
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

  let url = `this.cleanBaseUrl + \`${route}\``

  if (queryParams) {
    url += '+`?${new URLSearchParams(params).toString()}`'
  }
  const urlGeneration = `const ${INTERNAL_URL_TOKEN} = new URL(${url});`

  if (!shouldGeneratePreparedRequests) {
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

  const request = _getK6BatchRequest(verbOptions)
  const preparedRequestType = _generatePreparedRequestTypeDefinition(response)
  const responseType = `OperationResult<${_getResponseDataType(response)}>`
  const prepareOperationName = `prepare${pascal(operationName)}`

  return `${prepareOperationName}(\n    ${toObjectString(props, 'implementation')} requestParameters?: Params): ${preparedRequestType} {\n${bodyForm}
        ${urlGeneration}
        const mergedRequestParameters = this._mergeRequestParameters(requestParameters || {}, this.commonRequestParameters);
        return {
          request: ${request},
          operationId: '${jsStringEscape(operationId)}',
          parse: ${_generateResponseParser(response)},
        };
    }

    ${operationName}(\n    ${toObjectString(props, 'implementation')} requestParameters?: Params): ${responseType} {
      return this.execute(this.${prepareOperationName}(${props
        .map(({ name }) => name)
        .concat('requestParameters')
        .join(', ')}));
    }
  `
}

export const generateTitle: ClientTitleBuilder = (title) => {
  const sanTitle = sanitize(title || DEFAULT_SCHEMA_TITLE)
  return `${pascal(sanTitle)}Client`
}

const generateK6Header =
  (shouldGeneratePreparedRequests: boolean): ClientHeaderBuilder =>
  ({ title }) => {
    return `
  ${
    shouldGeneratePreparedRequests
      ? `export interface PreparedRequest<Data> {
    request: ObjectBatchRequest;
    operationId: string;
    parse: (response: Response) => Data;
  }

  export interface OperationResult<Data> {
    response: Response;
    data: Data;
    operationId: string;
  }

  export type PreparedRequestData<Request> =
    Request extends PreparedRequest<infer Data> ? Data : never;

  export type BatchResults<Requests extends readonly PreparedRequest<unknown>[]> = {
    -readonly [Index in keyof Requests]: OperationResult<PreparedRequestData<Requests[Index]>>;
  };`
      : ''
  }

  /**
   * This is the base client to use for interacting with the API.
   */
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

const generateFooter =
  (shouldGeneratePreparedRequests: boolean): ClientFooterBuilder =>
  () => {
    // Add function definition for merging request parameters
    const footer = `

  ${
    shouldGeneratePreparedRequests
      ? `execute<Data>(preparedRequest: PreparedRequest<Data>): OperationResult<Data> {
    const { method, url, body, params } = preparedRequest.request;
    const response = http.request(method, url, body, params);
    return this._resolvePreparedRequest(preparedRequest, response);
  }

  batch<const Requests extends readonly PreparedRequest<unknown>[]>(
    preparedRequests: Requests,
  ): BatchResults<Requests> {
    const responses = http.batch(
      preparedRequests.map(({ request }) => request),
    );

    return preparedRequests.map((preparedRequest, index) =>
      this._resolvePreparedRequest(preparedRequest, responses[index]!),
    ) as BatchResults<Requests>;
  }

  private _resolvePreparedRequest<Data>(
    preparedRequest: PreparedRequest<Data>,
    response: Response,
  ): OperationResult<Data> {
    return {
      response,
      data: preparedRequest.parse(response),
      operationId: preparedRequest.operationId,
    };
  }`
      : ''
  }

  ${_getRequestParametersMergerFunctionImplementation()}

}

  `
    return footer
  }

function getK6Client(
  analyticsData?: AnalyticsData,
  shouldGeneratePreparedRequests = false
) {
  return function (
    verbOptions: GeneratorVerbOptions,
    options: GeneratorOptions
  ) {
    _setDefaultSchemaTitle(options.context)

    const imports = generateVerbImports(verbOptions)
    const implementation = generateK6Implementation(
      verbOptions,
      options,
      analyticsData,
      shouldGeneratePreparedRequests
    )
    const specData = Object.values(options.context.specs)
    if (specData[0]) {
      if (analyticsData) {
        analyticsData.openApiSpecVersion = specData[0].openapi
      }
    }

    return { implementation, imports }
  }
}

export function getK6ClientBuilder(
  shouldGenerateSampleK6Script?: boolean,
  analyticsData?: AnalyticsData,
  shouldGeneratePreparedRequests?: boolean
): ClientGeneratorsBuilder {
  return {
    client: getK6Client(analyticsData, shouldGeneratePreparedRequests),
    header: generateK6Header(!!shouldGeneratePreparedRequests),
    dependencies: getK6Dependencies(!!shouldGeneratePreparedRequests),
    footer: generateFooter(!!shouldGeneratePreparedRequests),
    title: generateTitle,
    extraFiles: shouldGenerateSampleK6Script ? k6ScriptBuilder : undefined,
  }
}

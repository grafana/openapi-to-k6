import {
  ClientDependenciesBuilder,
  ClientExtraFilesBuilder,
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
} from '@orval/core'
import Handlebars from 'handlebars'
import path from 'path'
import {
  DEFAULT_SCHEMA_TITLE,
  K6_SCRIPT_TEMPLATE,
  SAMPLE_K6_SCRIPT_FILE_NAME,
} from '../constants'
import { getDirectoryForPath, getGeneratedClientPath } from '../helper'
import { logger } from '../logger'
import { AnalyticsData } from '../type'

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
}`
}

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

    headersValue += `\n...mergedRequestParameters?.headers},`
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
  } else if (body.formUrlEncoded || body.implementation) {
    fetchBodyOption = `JSON.stringify(${body.implementation})`
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
        url.toString(),
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
  analyticsData?: AnalyticsData
) => {
  const {
    queryParams,
    operationName,
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
  const urlGeneration = `const url = new URL(${url});`

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
        data
      }
    }
  `
}

const generateTitle: ClientTitleBuilder = (title) => {
  const sanTitle = sanitize(title || DEFAULT_SCHEMA_TITLE)
  return `create${pascal(sanTitle)}`
}

const generateK6Header: ClientHeaderBuilder = ({ title }) => {
  return `
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

const k6ScriptBuilder: ClientExtraFilesBuilder = async (
  verbOptions,
  output,
  context
) => {
  const schemaTitle =
    context.specs[context.specKey]?.info.title || DEFAULT_SCHEMA_TITLE
  const {
    path: pathOfGeneratedClient,
    filename,
    extension,
  } = await getGeneratedClientPath(output.target!, schemaTitle)
  const directoryPath = getDirectoryForPath(pathOfGeneratedClient)
  const generateScriptPath = path.join(
    directoryPath,
    SAMPLE_K6_SCRIPT_FILE_NAME
  )

  logger.debug(
    `k6ScriptBuilder ~ Generating sample K6 Script\n${JSON.stringify(
      {
        pathOfGeneratedClient,
        filename,
        extension,
        schemaTitle,
        directoryPath,
        generateScriptPath,
      },
      null,
      2
    )}`
  )

  const clientFunctionsList = []

  for (const verbOption of Object.values(verbOptions)) {
    const { operationName, summary, props } = verbOption
    const requiredProps = props.filter((prop) => prop.required)
    clientFunctionsList.push({
      operationName,
      summary,
      requiredParametersString: toObjectString(requiredProps, 'name'),
    })
  }

  const scriptContentData = {
    clientFunctionName: generateTitle(schemaTitle),
    clientPath: `./${filename}${extension}`,
    clientFunctionsList,
  }
  const template = Handlebars.compile(K6_SCRIPT_TEMPLATE)

  return [
    {
      path: generateScriptPath,
      content: template(scriptContentData),
    },
  ]
}

function getK6Client(analyticsData?: AnalyticsData) {
  return function (
    verbOptions: GeneratorVerbOptions,
    options: GeneratorOptions
  ) {
    _setDefaultSchemaTitle(options.context)

    const imports = generateVerbImports(verbOptions)
    const implementation = generateK6Implementation(
      verbOptions,
      options,
      analyticsData
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

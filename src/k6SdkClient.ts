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
  GeneratorMutator,
  GeneratorOptions,
  GeneratorSchema,
  GeneratorVerbOptions,
  GetterBody,
  GetterQueryParam,
  GetterResponse,
  ParamsSerializerOptions,
  pascal,
  sanitize,
  toObjectString,
  Verbs,
} from '@orval/core'
import Handlebars from 'handlebars'
import path from 'path'
import {
  DEFAULT_SCHEMA_TITLE,
  K6_SCRIPT_TEMPLATE,
  SAMPLE_K6_SCRIPT_FILE_NAME,
} from './constants'
import { getDirectoryForPath, getGeneratedClientPath } from './helper'
import { AnalyticsData, SchemaDetails } from './type'

// A map to store the operationNames for which a return type is to be written at the end to export
// and the return type definition
const returnTypesToWrite: Map<string, string> = new Map()

export const getK6Dependencies: ClientDependenciesBuilder = () => [
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

function getSchemaTitleFromContext(context: ContextSpecs) {
  const specData = Object.values(context.specs)

  if (specData[0]) {
    return specData[0].info.title
  }

  return DEFAULT_SCHEMA_TITLE
}

function _generateResponseTypeName(operationName: string): string {
  return `${pascal(operationName)}Response`
}

function _generateResponseTypeDefinition(
  operationName: string,
  response: GetterResponse
): string {
  const typeName = _generateResponseTypeName(operationName)
  let responseDataType = ''

  if (response.definition.success) {
    responseDataType += response.definition.success + ' | '
  }
  responseDataType += 'ResponseBody'

  return `export type ${typeName} = {
    response: Response
    data: ${responseDataType}
};`
}

const generateK6Implementation = (
  {
    headers,
    queryParams,
    operationName,
    response,
    body,
    props,
    verb,
    override,
    formData,
    formUrlEncoded,
    paramsSerializer,
  }: GeneratorVerbOptions,
  { route }: GeneratorOptions,
  analyticsData?: AnalyticsData
) => {
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

  // Generate response return types
  returnTypesToWrite.set(
    operationName,
    _generateResponseTypeDefinition(operationName, response)
  )

  let url = `cleanBaseUrl + \`${route}\``

  if (queryParams) {
    url += '+`?${new URLSearchParams(params).toString()}`'
  }
  const urlGeneration = `const url = new URL(${url});`

  const options = getK6RequestOptions({
    route,
    body,
    headers,
    queryParams,
    response,
    verb,
    requestOptions: override?.requestOptions,
    paramsSerializer,
    paramsSerializerOptions: override?.paramsSerializerOptions,
  })

  return `const ${operationName} = (\n    ${toObjectString(props, 'implementation')} requestParameters?: Params): ${_generateResponseTypeName(operationName)} => {${bodyForm}
        ${urlGeneration}
        const mergedRequestParameters = _mergeRequestParameters(requestParameters || {}, clientOptions.commonRequestParameters);
        const response = http.request(${options});
        let data;

        try {
            data = response.json();
        } catch (error) {
            data = response.body;
        }
      return {
        response,
        data
      }
    }
  `
}

type OptionsInput = {
  route: string
  body: GetterBody
  headers?: GetterQueryParam
  queryParams?: GetterQueryParam
  response: GetterResponse
  verb: Verbs
  requestOptions?: object | boolean
  isVue?: boolean
  paramsSerializer?: GeneratorMutator
  paramsSerializerOptions?: ParamsSerializerOptions
}

const getParamsInputValue = ({
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
      headersValue += `\n...headers,`
    }

    headersValue += `\n...mergedRequestParameters?.headers},`
    value += headersValue
  }

  return `{${value}}`
}

const getK6RequestOptions = (options: OptionsInput) => {
  const { body, headers, queryParams, response, verb } = options

  let fetchBodyOption = 'undefined'

  if (body.formData) {
    // Use the FormData.body() method to get the body of the request
    fetchBodyOption = 'formData.body()'
  } else if (body.formUrlEncoded || body.implementation) {
    fetchBodyOption = `JSON.stringify(${body.implementation})`
  }

  // Generate the params input for the call

  const paramsValue = getParamsInputValue({
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
        ${paramsValue}`
}

function _getRequestParametersMergerFunctionImplementation() {
  return `/**
 * Merges the provided request parameters with default parameters for the client.
 *
 * @param {Params} requestParameters - The parameters provided specifically for the request
 * @param {Params} commonRequestParameters - Common parameters for all requests
 * @returns {Params} - The merged parameters
 */
  const _mergeRequestParameters = (requestParameters?: Params, commonRequestParameters?: Params): Params => {
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

export const generateTitle: ClientTitleBuilder = (title) => {
  const sanTitle = sanitize(title || DEFAULT_SCHEMA_TITLE)
  return `create${pascal(sanTitle)}`
}

export const generateK6Header: ClientHeaderBuilder = ({ title }) => {
  const clientOptionsTypeName = `${pascal(title)}Options`
  return `
  export type ${clientOptionsTypeName} = {
    baseUrl: string,
    commonRequestParameters?: Params
  }

  /**
 * This is the base client to use for interacting with the API.
 */
  export const ${title} = (clientOptions: ${clientOptionsTypeName}) => {\n
        const cleanBaseUrl = clientOptions.baseUrl.replace(/\\/+$/, '');\n`
}

export const generateFooter: ClientFooterBuilder = ({ operationNames }) => {
  let footer = ''

  footer += `return {${operationNames.join(',')}}};\n\n`

  operationNames.forEach((operationName) => {
    if (returnTypesToWrite.has(operationName)) {
      footer += returnTypesToWrite.get(operationName) + '\n'
    }
  })

  // Add function definition for merging request parameters
  footer += `\n\n${_getRequestParametersMergerFunctionImplementation()}\n`

  return footer
}

const k6ScriptBuilder: ClientExtraFilesBuilder = async (
  verbOptions,
  output,
  context
) => {
  console.log(
    JSON.stringify(
      {
        verbOptions,
        output,
        context,
      },
      null,
      2
    )
  )

  const schemaTitle = getSchemaTitleFromContext(context)
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

function getK6Client(
  schemaDetails: SchemaDetails,
  analyticsData?: AnalyticsData
) {
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
    schemaDetails.title = getSchemaTitleFromContext(options.context)
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
  schemaDetails: SchemaDetails,
  shouldGenerateSampleK6Script?: boolean,
  analyticsData?: AnalyticsData
): ClientGeneratorsBuilder {
  return {
    client: getK6Client(schemaDetails, analyticsData),
    header: generateK6Header,
    dependencies: getK6Dependencies,
    footer: generateFooter,
    title: generateTitle,
    extraFiles: shouldGenerateSampleK6Script ? k6ScriptBuilder : undefined,
  }
}

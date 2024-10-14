import {
  ClientDependenciesBuilder,
  ClientFooterBuilder,
  ClientGeneratorsBuilder,
  ClientHeaderBuilder,
  ClientTitleBuilder,
  generateBodyOptions,
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

const generateAxiosImplementation = (
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
  const isFormData = override?.formData !== false
  const isFormUrlEncoded = override?.formUrlEncoded !== false

  if (analyticsData) {
    analyticsData.generatedRequestsCount[verb] += 1
  }

  const bodyForm = generateFormDataAndUrlEncodedFunction({
    formData,
    formUrlEncoded,
    body,
    isFormData,
    isFormUrlEncoded,
  })

  // Generate response return types
  returnTypesToWrite.set(
    operationName,
    _generateResponseTypeDefinition(operationName, response)
  )

  let url = `cleanBaseUrl + \`${route}\``

  if (body.formUrlEncoded) {
    url += '+`?${formUrlEncoded.toString()}`'
  }
  let queryParamsGenerationString = ''
  if (queryParams) {
    if (body.formUrlEncoded) {
      // Add the query params to the existing formUrlEncoded object
      queryParamsGenerationString = `
                for (const [key, value] of Object.entries(params)) {
                    formUrlEncoded.append(key, value);
                    }
            `
    } else {
      url += '+`?${new URLSearchParams(params).toString()}`'
    }
  }
  const urlGeneration = `
        ${queryParamsGenerationString}
         const url = new URL(${url});`

  const options = getK6RequestOptions({
    route,
    body,
    headers,
    queryParams,
    response,
    verb,
    requestOptions: override?.requestOptions,
    isFormData,
    isFormUrlEncoded,
    paramsSerializer,
    paramsSerializerOptions: override?.paramsSerializerOptions,
  })

  return `const ${operationName} = (\n    ${toObjectString(props, 'implementation')} options?: Params): ${_generateResponseTypeName(operationName)} => {${bodyForm}
        ${urlGeneration}
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
  isFormData: boolean
  isFormUrlEncoded: boolean
  isVue?: boolean
  paramsSerializer?: GeneratorMutator
  paramsSerializerOptions?: ParamsSerializerOptions
}

const getParamsInputValue = ({
  response,
  queryParams,
  headers,
}: {
  response: GetterResponse
  queryParams?: GeneratorSchema
  headers?: GeneratorSchema
}) => {
  if (!queryParams && !headers && !response.isBlob) {
    return 'options'
  }

  let value = '\n    ...options,'

  if (response.isBlob) {
    value += `\n        responseType: 'binary',`
  }

  if (headers) {
    value += '\n        headers: {...headers, ...options?.headers},'
  }

  return `{${value}}`
}

const getK6RequestOptions = (options: OptionsInput) => {
  const {
    body,
    headers,
    queryParams,
    response,
    verb,
    isFormData,
    isFormUrlEncoded,
  } = options

  const requestBodyParams = generateBodyOptions(
    body,
    isFormData,
    isFormUrlEncoded
  )

  let fetchBodyOption = 'undefined'

  if (requestBodyParams) {
    fetchBodyOption = `JSON.stringify(${requestBodyParams})`
  }

  // Generate the params input for the call

  const paramsValue = getParamsInputValue({
    response,
    headers: headers?.schema,
    queryParams: queryParams?.schema,
  })

  // Sample output
  // 'GET', 'http://test.com/route', <body>, <options>

  return `'${verb.toUpperCase()}',
        url.toString(),
        ${fetchBodyOption},
        ${paramsValue}`
}

export const generateTitle: ClientTitleBuilder = (title) => {
  const sanTitle = sanitize(title)
  return `create${pascal(sanTitle)}`
}

export const generateK6Header: ClientHeaderBuilder = ({ title }) => {
  return `export const ${title} = (baseUrl: string) => {\n
        const cleanBaseUrl = baseUrl.replace(/\\/+$/, '');\n`
}

export const generateFooter: ClientFooterBuilder = ({ operationNames }) => {
  let footer = ''

  footer += `return {${operationNames.join(',')}}};\n\n`

  operationNames.forEach((operationName) => {
    if (returnTypesToWrite.has(operationName)) {
      footer += returnTypesToWrite.get(operationName) + '\n'
    }
  })

  return footer
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
    const implementation = generateAxiosImplementation(
      verbOptions,
      options,
      analyticsData
    )
    const specData = Object.values(options.context.specs)

    if (specData[0]) {
      schemaDetails.title = specData[0].info.title

      if (analyticsData) {
        analyticsData.openApiSpecVersion = specData[0].openapi
      }
    }

    return { implementation, imports }
  }
}

export function getK6ClientBuilder(
  schemaDetails: SchemaDetails,
  analyticsData?: AnalyticsData
): ClientGeneratorsBuilder {
  return {
    client: getK6Client(schemaDetails, analyticsData),
    header: generateK6Header,
    dependencies: getK6Dependencies,
    footer: generateFooter,
    title: generateTitle,
  }
}

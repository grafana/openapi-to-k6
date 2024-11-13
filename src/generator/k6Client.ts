import { faker } from '@faker-js/faker'
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
  GetterPropType,
  GetterResponse,
  pascal,
  resolveRef,
  sanitize,
  toObjectString,
} from '@orval/core'
import Handlebars from 'handlebars'
import {
  OperationObject,
  ParameterObject,
  ReferenceObject,
  RequestBodyObject,
  SchemaObject,
} from 'openapi3-ts/oas30'
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
  return `${pascal(sanTitle)}Client`
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

  function getExampleValueForSchema(
    schema: SchemaObject | ReferenceObject,
    context: ContextSpecs
  ) {
    // Handle $ref
    if ('$ref' in schema) {
      const { schema: resolvedSchema } = resolveRef(schema, context)
      return getExampleValueForSchema(resolvedSchema as SchemaObject, context)
    }

    if ('example' in schema) {
      return `'${schema.example}'`
    }
    let schemaType = schema.type
    if (Array.isArray(schemaType)) {
      schemaType = schemaType[0]
    }
    if (!schemaType) {
      return undefined
    }
    const enumValues = schema.enum
    switch (schemaType) {
      case 'string':
        return enumValues ? `'${enumValues[0]}'` : `'${faker.string.sample()}'`
      case 'number':
        return enumValues ? enumValues[0] : faker.number.int()
      case 'integer':
        return enumValues ? enumValues[0] : faker.number.int()
      case 'boolean':
        return enumValues ? enumValues[0] : faker.datatype.boolean()
      case 'array':
        return '[]'
      case 'object': {
        let objectString = '{\n'
        for (const property in schema.properties) {
          if (schema.properties[property]) {
            const propertyValue = getExampleValueForSchema(
              schema.properties[property],
              context
            )
            objectString += `${property}: ${propertyValue},\n`
          }
        }

        objectString += '\n}'
        return objectString
      }
      default:
        return null
    }
  }

  function getExampleValues(
    requiredProps: GeneratorVerbOptions['props'],
    originalOperation: OperationObject,
    context: ContextSpecs
  ): string {
    let exampleValues = ''
    for (const prop of requiredProps) {
      const propType = prop.type as GetterPropType

      switch (propType) {
        case GetterPropType.QUERY_PARAM: {
          let exampleValue = '{\n'
          for (const param of originalOperation.parameters || []) {
            let resolvedParam: ParameterObject | ReferenceObject

            if ('$ref' in param) {
              const { schema: resolvedSchema } = resolveRef<ParameterObject>(
                param,
                context
              )
              resolvedParam = resolvedSchema
            } else {
              resolvedParam = param
            }

            // Only add required query parameters to the example values
            if (resolvedParam.required && resolvedParam.in === 'query') {
              if ('schema' in resolvedParam && resolvedParam.schema) {
                exampleValue += `'${resolvedParam.name}': ${getExampleValueForSchema(resolvedParam.schema, context)},\n`
              }
            }
          }
          exampleValue += '\n}'
          exampleValues += `params = ${exampleValue};\n`
          break
        }
        // eslint-disable-next-line no-fallthrough
        case GetterPropType.PARAM: {
          let example, paramSchema: SchemaObject | ReferenceObject | undefined

          for (const parameter of originalOperation.parameters || []) {
            if ('name' in parameter) {
              paramSchema = parameter.schema as SchemaObject
              break
            } else if ('$ref' in parameter) {
              const { schema: resolvedSchema } = resolveRef<ParameterObject>(
                parameter,
                context
              )
              paramSchema = resolvedSchema.schema
              break
            }
          }

          if (paramSchema) {
            example = getExampleValueForSchema(paramSchema, context)
          }
          if (example) {
            exampleValues += `${prop.name} = ${example};\n`
          }
          break
        }
        case GetterPropType.BODY: {
          // Generate example value from body schema
          const requestBody = originalOperation.requestBody
          let requestBodyExample
          if (!requestBody) {
            break
          }
          let resolvedSchema
          if ('$ref' in requestBody) {
            const { schema } = resolveRef<RequestBodyObject>(
              requestBody,
              context
            )
            resolvedSchema = schema
          } else if ('content' in requestBody) {
            resolvedSchema = requestBody
          }

          if (resolvedSchema && 'content' in resolvedSchema) {
            // Get the first available content type
            const contentType = Object.keys(resolvedSchema.content)[0]
            if (contentType) {
              const requestBodySchema =
                resolvedSchema.content[contentType]?.schema
              if (requestBodySchema) {
                requestBodyExample = getExampleValueForSchema(
                  requestBodySchema,
                  context
                )
              }
            }
          }
          if (requestBodyExample) {
            exampleValues += `${prop.name} = ${requestBodyExample};\n`
          }
          break
        }
      }
    }
    return exampleValues
  }

  const clientFunctionsList = []
  const uniqueVariables = new Set<string>() // Track unique variable names
  for (const verbOption of Object.values(verbOptions)) {
    const { operationName, summary, props, originalOperation } = verbOption
    const requiredProps = props.filter((prop) => prop.required)
    // Create example values object
    const exampleValues = getExampleValues(
      requiredProps,
      originalOperation,
      context
    )

    for (const prop of requiredProps) {
      uniqueVariables.add(prop.name)
    }
    clientFunctionsList.push({
      operationName,
      summary,
      exampleValues,
      requiredParametersString: toObjectString(requiredProps, 'name'),
    })
  }

  const scriptContentData = {
    clientFunctionName: generateTitle(schemaTitle),
    clientPath: `./${filename}${extension}`,
    clientFunctionsList,
    variableDefinition: `let ${Array.from(uniqueVariables).join(', ')};`,
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

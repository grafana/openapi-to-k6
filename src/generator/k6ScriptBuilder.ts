import { faker } from '@faker-js/faker'
import {
  camel,
  ClientExtraFilesBuilder,
  ClientFileBuilder,
  ContextSpecs,
  GeneratorVerbOptions,
  GetterPropType,
  kebab,
  NormalizedOutputOptions,
  pascal,
  resolveRef,
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
import { generateTitle } from './k6Client'

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
      return enumValues ? `'${enumValues[0]}'` : `'${faker.word.sample()}'`
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
      case GetterPropType.HEADER: {
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
          if (resolvedParam.required && resolvedParam.in === 'header') {
            if ('schema' in resolvedParam && resolvedParam.schema) {
              exampleValue += `'${resolvedParam.name}': ${getExampleValueForSchema(resolvedParam.schema, context)},\n`
            }
          }
        }
        exampleValue += '\n}'
        exampleValues += `headers = ${exampleValue};\n`
        break
        break
      }
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
          const { schema } = resolveRef<RequestBodyObject>(requestBody, context)
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

function getClientClassName(identifier: string) {
  return generateTitle(pascal(identifier))
}

function getClientObjectName(identifier: string) {
  return camel(generateTitle(pascal(identifier)))
}

export const k6ScriptBuilder: ClientExtraFilesBuilder = async (
  verbOptions: Record<string, GeneratorVerbOptions>,
  output: NormalizedOutputOptions,
  context: ContextSpecs
): Promise<ClientFileBuilder[]> => {
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
  const uniqueVariables = new Set<string>() // Track unique variable names
  const allUniqueTags = new Set<string>()

  for (const verbOption of Object.values(verbOptions)) {
    if (verbOption.tags && verbOption.tags.length > 0) {
      verbOption.tags.forEach((tag) => allUniqueTags.add(tag))
    } else {
      allUniqueTags.add('default')
    }

    let clientObjectName
    if (output.mode === 'tags') {
      clientObjectName = getClientObjectName(verbOption.tags[0] || 'default')
    } else {
      clientObjectName = getClientObjectName(schemaTitle)
    }

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
      clientObjectName,
    })
  }

  let importStatements = ''
  let clientInitializationStatement = ''

  if (output.mode === 'tags') {
    for (const tag of allUniqueTags) {
      const { extension } = await getGeneratedClientPath(
        output.target!,
        schemaTitle
      )
      const clientName = getClientClassName(tag)
      importStatements += `import { ${clientName} } from './${kebab(tag)}${extension}';\n`
      clientInitializationStatement += `const ${getClientObjectName(tag)} = new ${clientName}({ baseUrl });\n`
    }
  } else {
    const clientName = getClientClassName(schemaTitle)
    importStatements = `import { ${clientName} } from './${filename}${extension}';\n`
    clientInitializationStatement = `const ${getClientObjectName(schemaTitle)} = new ${clientName}({ baseUrl });\n`
  }

  const scriptContentData = {
    clientFunctionsList,
    variableDefinition:
      uniqueVariables.size > 0
        ? `let ${Array.from(uniqueVariables).join(', ')};`
        : '',
    importStatements,
    clientInitializationStatement,
  }
  const template = Handlebars.compile(K6_SCRIPT_TEMPLATE)

  return [
    {
      path: generateScriptPath,
      content: template(scriptContentData),
    },
  ]
}

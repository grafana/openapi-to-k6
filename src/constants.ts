export const DEFAULT_SCHEMA_TITLE = 'K6Client'

export const SAMPLE_K6_SCRIPT_FILE_NAME = 'k6-script.sample.ts'
export const K6_SCRIPT_TEMPLATE = `
{{{importStatements}}}

const baseUrl = '<BASE_URL>';
{{{clientInitializationStatement}}}


export default function () {
    {{{this.variableDefinition}}}

    {{#each clientFunctionsList}}
    /**
     * {{this.summary}}
     */
    {{{this.exampleValues}}}
    const {{this.operationName}}ResponseData = {{clientObjectName}}.{{this.operationName}}({{this.requiredParametersString}});

    {{/each}}
}
`

export enum Mode {
  SINGLE = 'single',
  SPLIT = 'split',
  TAGS = 'tags',
}

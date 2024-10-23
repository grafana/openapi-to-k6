export const DEFAULT_SCHEMA_TITLE = 'K6Client'

export const SAMPLE_K6_SCRIPT_FILE_NAME = 'k6-script.sample.ts'
export const K6_SCRIPT_TEMPLATE = `
import { {{clientFunctionName}} } from '{{clientPath}}'

const baseUrl = '<BASE_URL>';
const client = new {{clientFunctionName}}({ baseUrl })

export default function () {
    {{#each clientFunctionsList}}
    /**
     * {{this.summary}}
     */
    const {{this.operationName}}ResponseData = client.{{this.operationName}}({{this.requiredParametersString}});

    {{/each}}
}
`

export enum Mode {
  SINGLE = 'single',
  SPLIT = 'split',
  TAGS = 'tags',
}

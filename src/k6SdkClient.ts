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
    GeneratorVerbOptions,
    GetterBody,
    GetterQueryParam,
    GetterResponse,
    ParamsSerializerOptions,
    pascal,
    sanitize,
    toObjectString,
    Verbs
} from '@orval/core';

const returnTypesToWrite: Map<string, (title?: string) => string> = new Map();

export const getK6Dependencies: ClientDependenciesBuilder = () => [
    {
        exports: [
            {
                name: 'http',
                default: true,
                values: true,
                syntheticDefaultImport: true,
            },
            { name: 'Response' }
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
    {
        exports: [
            {
                name: 'axios',
                default: true,
                values: true,
                syntheticDefaultImport: true,
            },
            { name: 'AxiosRequestConfig' },
            { name: 'AxiosResponse' },
        ],
        dependency: 'axios',
    }

];

const generateAxiosImplementation = (
    {
        headers,
        queryParams,
        operationName,
        response,
        mutator,
        body,
        props,
        verb,
        override,
        formData,
        formUrlEncoded,
        paramsSerializer,
    }: GeneratorVerbOptions,
    { route, context }: GeneratorOptions,
) => {
    const isFormData = override?.formData !== false;
    const isFormUrlEncoded = override?.formUrlEncoded !== false;

    const bodyForm = generateFormDataAndUrlEncodedFunction({
        formData,
        formUrlEncoded,
        body,
        isFormData,
        isFormUrlEncoded,
    });

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
    });

    return `const ${operationName} = (\n    ${toObjectString(props, 'implementation')}): Response => {${bodyForm}
      return http.request(${options});
    }
  `;
};

type OptionsInput = {
    route: string;
    body: GetterBody;
    headers?: GetterQueryParam;
    queryParams?: GetterQueryParam;
    response: GetterResponse;
    verb: Verbs;
    requestOptions?: object | boolean;
    isFormData: boolean;
    isFormUrlEncoded: boolean;
    isVue?: boolean;
    paramsSerializer?: GeneratorMutator;
    paramsSerializerOptions?: ParamsSerializerOptions;
}

const VERBS_WITHOUT_BODY = [Verbs.GET, Verbs.HEAD]

const getK6RequestOptions = (options: OptionsInput) => {
    const {
        route,
        body,
        headers,
        queryParams,
        response,
        verb,
        requestOptions,
        isFormData,
        isFormUrlEncoded,
        paramsSerializer,
        paramsSerializerOptions,
    } = options;

    const isBodyVerb = !VERBS_WITHOUT_BODY.includes(verb);

    const requestBodyParams = generateBodyOptions(
        body,
        isFormData,
        isFormUrlEncoded,
    );

    let fetchBodyOption = 'null,';

    if (requestBodyParams) {
        fetchBodyOption = `JSON.stringify(${requestBodyParams})`;
    }

    // const bodyForm = generateFormDataAndUrlEncodedFunction({
    //     formData: body,
    //     formUrlEncoded: body,
    //     body,
    //     isFormData,
    //     isFormUrlEncoded,
    // });

    // Sample output
    // 'GET', 'http://test.com/route', <body>, <params>
    const url = `cleanBaseUrl + \`${route}\``;
    return `'${verb.toUpperCase()}',
        ${url},
        ${isBodyVerb ? fetchBodyOption : ''}\n`;


}

export const generateTitle: ClientTitleBuilder = (title) => {
    const sanTitle = sanitize(title);
    return `get${pascal(sanTitle)}`;
};

export const generateK6Header: ClientHeaderBuilder = ({
    title,
    noFunction,
}) => {
    return `${!noFunction ? `export const ${title} = (baseUrl: string) => {\n
        const cleanBaseUrl = baseUrl.replace(/\\/+$/, '');\n` : ''}`
};

export const generateFooter: ClientFooterBuilder = ({
    operationNames,
    title,
    noFunction,
}) => {
    let footer = '';

    if (!noFunction) {
        footer += `return {${operationNames.join(',')}}};\n`;
    }

    operationNames.forEach((operationName) => {
        if (returnTypesToWrite.has(operationName)) {
            const func = returnTypesToWrite.get(operationName)!;
            footer += func(!noFunction ? title : undefined) + '\n';
        }
    });

    return footer;
};

export const generateK6Client = (
    verbOptions: GeneratorVerbOptions,
    options: GeneratorOptions,
) => {
    const imports = generateVerbImports(verbOptions);
    const implementation = generateAxiosImplementation(verbOptions, options);

    return { implementation, imports };
};

export const k6ClientBuilder: ClientGeneratorsBuilder = {
    client: generateK6Client,
    header: generateK6Header,
    dependencies: getK6Dependencies,
    footer: generateFooter,
    title: generateTitle,
};


import type { Params, Response } from "k6/http";
export type GetExampleGetHeaders = {
    /**
     * A custom header for this request
     */
    "X-Custom-Header"?: string;
};
export type GetExampleGet200 = {
    message?: string;
};
export type PostExamplePostHeaders = {
    /**
     * Bearer token for authorization
     */
    Authorization: string;
};
export type PostExamplePostBody = {
    data?: string;
};
export type GetExampleResponseHeaders200 = {
    status?: string;
};
/**
 * This is the base client to use for interacting with the API.
 */
export declare class HeaderDemoAPIClient {
    private cleanBaseUrl;
    private commonRequestParameters;
    constructor(clientOptions: {
        baseUrl: string;
        commonRequestParameters?: Params;
    });
    /**
     * This GET request demonstrates the use of custom request headers
     * @summary GET request with headers
     */
    getExampleGet(headers?: GetExampleGetHeaders, requestParameters?: Params): {
        response: Response;
        data: GetExampleGet200;
        operationId: string;
    };
    /**
     * This POST request uses a security header for authentication
     * @summary POST request with security headers
     */
    postExamplePost(postExamplePostBody: PostExamplePostBody, headers: PostExamplePostHeaders, requestParameters?: Params): {
        response: Response;
        data: void;
        operationId: string;
    };
    /**
     * This GET request returns custom response headers
     * @summary GET request with response headers only
     */
    getExampleResponseHeaders(requestParameters?: Params): {
        response: Response;
        data: GetExampleResponseHeaders200;
        operationId: string;
    };
    /**
     * Merges the provided request parameters with default parameters for the client.
     *
     * @param {Params} requestParameters - The parameters provided specifically for the request
     * @param {Params} commonRequestParameters - Common parameters for all requests
     * @returns {Params} - The merged parameters
     */
    private _mergeRequestParameters;
}

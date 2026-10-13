import type { Params, Response, ResponseBody } from "k6/http";
/**
 * This is the base client to use for interacting with the API.
 */
export declare class NonOAuthScopesExampleClient {
    private cleanBaseUrl;
    private commonRequestParameters;
    constructor(clientOptions: {
        baseUrl: string;
        commonRequestParameters?: Params;
    });
    getUsers(requestParameters?: Params): {
        response: Response;
        data: ResponseBody;
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

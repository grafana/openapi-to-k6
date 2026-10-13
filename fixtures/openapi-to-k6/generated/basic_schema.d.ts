import type { Params, Response } from "k6/http";
export type GetExample200 = {
    /** @pattern ^([a-zA-Z_][a-zA-Z0-9_-]*:)?([a-zA-Z_][a-zA-Z0-9_-]*\/)?([a-zA-Z_][.a-zA-Z0-9_-]*)$ */
    message?: string;
};
/**
 * This is the base client to use for interacting with the API.
 */
export declare class SimpleAPIClient {
    private cleanBaseUrl;
    private commonRequestParameters;
    constructor(clientOptions: {
        baseUrl: string;
        commonRequestParameters?: Params;
    });
    /**
     * @summary Retrieve example data
     */
    getExample(requestParameters?: Params): {
        response: Response;
        data: GetExample200;
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

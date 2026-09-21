import type { Params, Response } from "k6/http";
export type GetExampleDataParams = {
    /**
     * A string parameter
     */
    name: string;
    /**
     * An integer parameter
     */
    age?: number;
    /**
     * A boolean parameter
     */
    isActive?: boolean;
    /**
     * An array of strings parameter
     */
    tags?: string[];
    /**
     * A date parameter in YYYY-MM-DD format
     */
    date?: string;
};
export type GetExampleData200 = {
    name?: string;
    age?: number;
    isActive?: boolean;
    tags?: string[];
    date?: string;
};
/**
 * This is the base client to use for interacting with the API.
 */
export declare class ExampleAPIClient {
    private cleanBaseUrl;
    private commonRequestParameters;
    constructor(clientOptions: {
        baseUrl: string;
        commonRequestParameters?: Params;
    });
    /**
     * This endpoint demonstrates the use of various query parameters
     * @summary Get example data
     */
    getExampleData(params: GetExampleDataParams, requestParameters?: Params): {
        response: Response;
        data: GetExampleData200;
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

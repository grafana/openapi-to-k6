import type { Params, Response } from "k6/http";
export type CreateExampleDataParams = {
    /**
     * A string query parameter for user ID
     */
    userId: string;
    /**
     * A boolean query parameter
     */
    isActive?: boolean;
};
export type CreateExampleDataBody = {
    /** A string field representing data */
    data: string;
};
export type CreateExampleData201 = {
    /** The user ID from the query parameter */
    userId?: string;
    /** The active status from the query parameter */
    isActive?: boolean;
    /** The data from the body */
    data?: string;
    /** Response status */
    status?: string;
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
     * This endpoint demonstrates a POST request with query parameters and a single field object in the body
     * @summary Create example data
     */
    createExampleData(createExampleDataBody: CreateExampleDataBody, params: CreateExampleDataParams, requestParameters?: Params): {
        response: Response;
        data: CreateExampleData201;
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

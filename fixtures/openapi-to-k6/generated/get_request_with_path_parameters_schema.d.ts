import type { Params, Response } from "k6/http";
export type GetItemById200 = {
    id?: string;
    name?: string;
    description?: string;
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
     * Returns a single item based on the provided ID
     * @summary Get an item by its ID
     */
    getItemById(id: string, requestParameters?: Params): {
        response: Response;
        data: GetItemById200;
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

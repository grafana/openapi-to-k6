import type { Params, Response } from "k6/http";
export interface Pet {
    id: number;
    name: string;
    tag?: string;
}
/**
 * This is the base client to use for interacting with the API.
 */
export declare class SwaggerPetstoreClient {
    private cleanBaseUrl;
    private commonRequestParameters;
    constructor(clientOptions: {
        baseUrl: string;
        commonRequestParameters?: Params;
    });
    /**
     * Returns all pets from the system that the user has access to
     */
    getPets(requestParameters?: Params): {
        response: Response;
        data: Pet[];
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

import type { Params, Response } from "k6/http";
/**
 * An object parameter containing metadata
 */
export type CreateExampleDataBodyMeta = {
    /** A string parameter for the creator's name */
    createdBy?: string;
    /** A string parameter for the updater's name */
    updatedBy?: string;
};
export type CreateExampleDataBody = {
    /** A string parameter */
    name: string;
    /** An integer parameter */
    age: number;
    /** A boolean parameter */
    isActive: boolean;
    /** An array of strings */
    tags?: string[];
    /** A date parameter in YYYY-MM-DD format */
    date?: string;
    /** An object parameter containing metadata */
    meta?: CreateExampleDataBodyMeta;
};
export type CreateExampleData201Meta = {
    createdBy?: string;
    updatedBy?: string;
};
export type CreateExampleData201 = {
    /** The unique ID of the created resource */
    id?: string;
    name?: string;
    age?: number;
    isActive?: boolean;
    tags?: string[];
    date?: string;
    meta?: CreateExampleData201Meta;
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
     * This endpoint demonstrates the use of various data formats in the input body
     * @summary Create example data
     */
    createExampleData(createExampleDataBody: CreateExampleDataBody, requestParameters?: Params): {
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

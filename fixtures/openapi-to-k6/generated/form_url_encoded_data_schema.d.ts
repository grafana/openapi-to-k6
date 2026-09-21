import type { Params, Response } from "k6/http";
export type PostSubmitFormBody = {
    /** Name of the user */
    name: string;
    /** Age of the user */
    age?: number;
    /** Email address of the user */
    email: string;
};
export type PostSubmitForm200 = {
    success?: boolean;
    message?: string;
};
export type PostSubmitForm400 = {
    success?: boolean;
    error?: string;
};
/**
 * This is the base client to use for interacting with the API.
 */
export declare class FormURLEncodedAPIClient {
    private cleanBaseUrl;
    private commonRequestParameters;
    constructor(clientOptions: {
        baseUrl: string;
        commonRequestParameters?: Params;
    });
    /**
     * This endpoint accepts form URL-encoded data.
     * @summary Submit form data
     */
    postSubmitForm(postSubmitFormBody: PostSubmitFormBody, requestParameters?: Params): {
        response: Response;
        data: PostSubmitForm200;
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

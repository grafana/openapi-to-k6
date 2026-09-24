import type { Params, Response } from "k6/http";
export type PostUploadBody = {
    /** File to upload */
    file: ArrayBuffer;
    /** Description of the file */
    description?: string;
    /** User ID associated with the upload */
    userId: string;
};
export type PostUpload200 = {
    success?: boolean;
    message?: string;
};
export type PostUpload400 = {
    success?: boolean;
    error?: string;
};
/**
 * This is the base client to use for interacting with the API.
 */
export declare class FormDataAPIClient {
    private cleanBaseUrl;
    private commonRequestParameters;
    constructor(clientOptions: {
        baseUrl: string;
        commonRequestParameters?: Params;
    });
    /**
     * This endpoint accepts form data and file uploads.
     * @summary Upload files and data
     */
    postUpload(postUploadBody: PostUploadBody, requestParameters?: Params): {
        response: Response;
        data: PostUpload200;
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

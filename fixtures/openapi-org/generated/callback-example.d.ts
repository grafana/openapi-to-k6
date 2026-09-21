import type { Params, Response } from "k6/http";
export type PostStreamsParams = {
    /**
   * the location where data will be sent.  Must be network accessible
  by the source server
  
   */
    callbackUrl: string;
};
/**
 * subscription information
 */
export type PostStreams201 = {
    /** this unique identifier allows management of the subscription */
    subscriptionId: string;
};
/**
 * This is the base client to use for interacting with the API.
 */
export declare class CallbackExampleClient {
    private cleanBaseUrl;
    private commonRequestParameters;
    constructor(clientOptions: {
        baseUrl: string;
        commonRequestParameters?: Params;
    });
    /**
     * subscribes a client to receive out-of-band data
     */
    postStreams(params: PostStreamsParams, requestParameters?: Params): {
        response: Response;
        data: PostStreams201;
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

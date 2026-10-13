import type { Params, Response } from "k6/http";
export interface User {
    username?: string;
    uuid?: string;
}
export interface Repository {
    slug?: string;
    owner?: User;
}
export interface Pullrequest {
    id?: number;
    title?: string;
    repository?: Repository;
    author?: User;
}
export type GetPullRequestsByRepositoryParams = {
    state?: GetPullRequestsByRepositoryState;
};
export type GetPullRequestsByRepositoryState = (typeof GetPullRequestsByRepositoryState)[keyof typeof GetPullRequestsByRepositoryState];
export declare const GetPullRequestsByRepositoryState: {
    readonly open: "open";
    readonly merged: "merged";
    readonly declined: "declined";
};
/**
 * This is the base client to use for interacting with the API.
 */
export declare class LinkExampleClient {
    private cleanBaseUrl;
    private commonRequestParameters;
    constructor(clientOptions: {
        baseUrl: string;
        commonRequestParameters?: Params;
    });
    getUserByName(username: string, requestParameters?: Params): {
        response: Response;
        data: User;
        operationId: string;
    };
    getRepositoriesByOwner(username: string, requestParameters?: Params): {
        response: Response;
        data: Repository[];
        operationId: string;
    };
    getRepository(username: string, slug: string, requestParameters?: Params): {
        response: Response;
        data: Repository;
        operationId: string;
    };
    getPullRequestsByRepository(username: string, slug: string, params?: GetPullRequestsByRepositoryParams, requestParameters?: Params): {
        response: Response;
        data: Pullrequest[];
        operationId: string;
    };
    getPullRequestsById(username: string, slug: string, pid: string, requestParameters?: Params): {
        response: Response;
        data: Pullrequest;
        operationId: string;
    };
    mergePullRequest(username: string, slug: string, pid: string, requestParameters?: Params): {
        response: Response;
        data: void;
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

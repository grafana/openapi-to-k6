import type { Params, Response } from "k6/http";
export type PetAllOf = {
    id: number;
};
export type Pet = NewPet & PetAllOf;
export interface NewPet {
    name: string;
    tag?: string;
}
export interface ErrorModel {
    code: number;
    message: string;
}
export type FindPetsParams = {
    /**
     * tags to filter by
     */
    tags?: string[];
    /**
     * maximum number of results to return
     */
    limit?: number;
};
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
    findPets(params?: FindPetsParams, requestParameters?: Params): {
        response: Response;
        data: Pet[];
        operationId: string;
    };
    /**
     * Creates a new pet in the store.  Duplicates are allowed
     */
    addPet(newPet: NewPet, requestParameters?: Params): {
        response: Response;
        data: Pet;
        operationId: string;
    };
    /**
     * Returns a user based on a single ID, if the user does not have access to the pet
     */
    findPetById(id: number, requestParameters?: Params): {
        response: Response;
        data: Pet;
        operationId: string;
    };
    /**
     * deletes a single pet based on the ID supplied
     */
    deletePet(id: number, requestParameters?: Params): {
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

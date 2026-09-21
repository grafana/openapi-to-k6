import type { Params, Response } from "k6/http";
export interface Pet {
    id: number;
    name: string;
    tag?: string;
}
/**
 * @maxItems 100
 */
export type Pets = Pet[];
export interface Error {
    code: number;
    message: string;
}
export type ListPetsParams = {
    /**
     * How many items to return at one time (max 100)
     * @maximum 100
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
     * @summary List all pets
     */
    listPets(params?: ListPetsParams, requestParameters?: Params): {
        response: Response;
        data: Pets;
        operationId: string;
    };
    /**
     * @summary Create a pet
     */
    createPets(pet: Pet, requestParameters?: Params): {
        response: Response;
        data: void;
        operationId: string;
    };
    /**
     * @summary Info for a specific pet
     */
    showPetById(petId: string, requestParameters?: Params): {
        response: Response;
        data: Pet;
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

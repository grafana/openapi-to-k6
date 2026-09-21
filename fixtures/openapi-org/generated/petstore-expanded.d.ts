import type { Params, Response } from "k6/http";
export type PetAllOf = {
    id: number;
};
export type Pet = NewPet & PetAllOf;
export interface NewPet {
    name: string;
    tag?: string;
}
export interface Error {
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
  Nam sed condimentum est. Maecenas tempor sagittis sapien, nec rhoncus sem sagittis sit amet. Aenean at gravida augue, ac iaculis sem. Curabitur odio lorem, ornare eget elementum nec, cursus id lectus. Duis mi turpis, pulvinar ac eros ac, tincidunt varius justo. In hac habitasse platea dictumst. Integer at adipiscing ante, a sagittis ligula. Aenean pharetra tempor ante molestie imperdiet. Vivamus id aliquam diam. Cras quis velit non tortor eleifend sagittis. Praesent at enim pharetra urna volutpat venenatis eget eget mauris. In eleifend fermentum facilisis. Praesent enim enim, gravida ac sodales sed, placerat id erat. Suspendisse lacus dolor, consectetur non augue vel, vehicula interdum libero. Morbi euismod sagittis libero sed lacinia.
  
  Sed tempus felis lobortis leo pulvinar rutrum. Nam mattis velit nisl, eu condimentum ligula luctus nec. Phasellus semper velit eget aliquet faucibus. In a mattis elit. Phasellus vel urna viverra, condimentum lorem id, rhoncus nibh. Ut pellentesque posuere elementum. Sed a varius odio. Morbi rhoncus ligula libero, vel eleifend nunc tristique vitae. Fusce et sem dui. Aenean nec scelerisque tortor. Fusce malesuada accumsan magna vel tempus. Quisque mollis felis eu dolor tristique, sit amet auctor felis gravida. Sed libero lorem, molestie sed nisl in, accumsan tempor nisi. Fusce sollicitudin massa ut lacinia mattis. Sed vel eleifend lorem. Pellentesque vitae felis pretium, pulvinar elit eu, euismod sapien.
  
   */
    findPets(params?: FindPetsParams, requestParameters?: Params): {
        response: Response;
        data: Pet[];
        operationId: string;
    };
    /**
     * Creates a new pet in the store. Duplicates are allowed
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

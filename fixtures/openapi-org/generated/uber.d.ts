import type { Params, Response } from "k6/http";
export interface Product {
    /** Unique identifier representing a specific product for a given latitude & longitude. For example, uberX in San Francisco will have a different product_id than uberX in Los Angeles. */
    product_id?: string;
    /** Description of product. */
    description?: string;
    /** Display name of product. */
    display_name?: string;
    /** Capacity of product. For example, 4 people. */
    capacity?: string;
    /** Image URL representing the product. */
    image?: string;
}
export interface PriceEstimate {
    /** Unique identifier representing a specific product for a given latitude & longitude. For example, uberX in San Francisco will have a different product_id than uberX in Los Angeles */
    product_id?: string;
    /** [ISO 4217](http://en.wikipedia.org/wiki/ISO_4217) currency code. */
    currency_code?: string;
    /** Display name of product. */
    display_name?: string;
    /** Formatted string of estimate in local currency of the start location. Estimate could be a range, a single number (flat rate) or "Metered" for TAXI. */
    estimate?: string;
    /** Lower bound of the estimated price. */
    low_estimate?: number;
    /** Upper bound of the estimated price. */
    high_estimate?: number;
    /** Expected surge multiplier. Surge is active if surge_multiplier is greater than 1. Price estimate already factors in the surge multiplier. */
    surge_multiplier?: number;
}
export interface Profile {
    /** First name of the Uber user. */
    first_name?: string;
    /** Last name of the Uber user. */
    last_name?: string;
    /** Email address of the Uber user */
    email?: string;
    /** Image URL of the Uber user. */
    picture?: string;
    /** Promo code of the Uber user. */
    promo_code?: string;
}
export interface Activity {
    /** Unique identifier for the activity */
    uuid?: string;
}
export interface Activities {
    /** Position in pagination. */
    offset?: number;
    /** Number of items to retrieve (100 max). */
    limit?: number;
    /** Total number of items available. */
    count?: number;
    history?: Activity[];
}
export interface Error {
    code?: number;
    message?: string;
    fields?: string;
}
export type GetProductsParams = {
    /**
     * Latitude component of location.
     */
    latitude: number;
    /**
     * Longitude component of location.
     */
    longitude: number;
};
export type GetEstimatesPriceParams = {
    /**
     * Latitude component of start location.
     */
    start_latitude: number;
    /**
     * Longitude component of start location.
     */
    start_longitude: number;
    /**
     * Latitude component of end location.
     */
    end_latitude: number;
    /**
     * Longitude component of end location.
     */
    end_longitude: number;
};
export type GetEstimatesTimeParams = {
    /**
     * Latitude component of start location.
     */
    start_latitude: number;
    /**
     * Longitude component of start location.
     */
    start_longitude: number;
    /**
     * Unique customer identifier to be used for experience customization.
     */
    customer_uuid?: string;
    /**
     * Unique identifier representing a specific product for a given latitude & longitude.
     */
    product_id?: string;
};
export type GetHistoryParams = {
    /**
     * Offset the list of returned results by this amount. Default is zero.
     */
    offset?: number;
    /**
     * Number of items to retrieve. Default is 5, maximum is 100.
     */
    limit?: number;
};
/**
 * This is the base client to use for interacting with the API.
 */
export declare class UberAPIClient {
    private cleanBaseUrl;
    private commonRequestParameters;
    constructor(clientOptions: {
        baseUrl: string;
        commonRequestParameters?: Params;
    });
    /**
     * The Products endpoint returns information about the Uber products offered at a given location. The response includes the display name and other details about each product, and lists the products in the proper display order.
     * @summary Product Types
     */
    getProducts(params: GetProductsParams, requestParameters?: Params): {
        response: Response;
        data: Product[];
        operationId: string;
    };
    /**
     * The Price Estimates endpoint returns an estimated price range for each product offered at a given location. The price estimate is provided as a formatted string with the full price range and the localized currency symbol.<br><br>The response also includes low and high estimates, and the [ISO 4217](http://en.wikipedia.org/wiki/ISO_4217) currency code for situations requiring currency conversion. When surge is active for a particular product, its surge_multiplier will be greater than 1, but the price estimate already factors in this multiplier.
     * @summary Price Estimates
     */
    getEstimatesPrice(params: GetEstimatesPriceParams, requestParameters?: Params): {
        response: Response;
        data: PriceEstimate[];
        operationId: string;
    };
    /**
     * The Time Estimates endpoint returns ETAs for all products offered at a given location, with the responses expressed as integers in seconds. We recommend that this endpoint be called every minute to provide the most accurate, up-to-date ETAs.
     * @summary Time Estimates
     */
    getEstimatesTime(params: GetEstimatesTimeParams, requestParameters?: Params): {
        response: Response;
        data: Product[];
        operationId: string;
    };
    /**
     * The User Profile endpoint returns information about the Uber user that has authorized with the application.
     * @summary User Profile
     */
    getMe(requestParameters?: Params): {
        response: Response;
        data: Profile;
        operationId: string;
    };
    /**
     * The User Activity endpoint returns data about a user's lifetime activity with Uber. The response will include pickup locations and times, dropoff locations and times, the distance of past requests, and information about which products were requested.<br><br>The history array in the response will have a maximum length based on the limit parameter. The response value count may exceed limit, therefore subsequent API requests may be necessary.
     * @summary User Activity
     */
    getHistory(params?: GetHistoryParams, requestParameters?: Params): {
        response: Response;
        data: Activities;
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

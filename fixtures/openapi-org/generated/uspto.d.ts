import type { Params, Response } from "k6/http";
export type DataSetListApisItem = {
    /** To be used as a dataset parameter value */
    apiKey?: string;
    /** To be used as a version parameter value */
    apiVersionNumber?: string;
    /** The URL describing the dataset's fields */
    apiUrl?: string;
    /** A URL to the API console for each API */
    apiDocumentationUrl?: string;
};
export interface DataSetList {
    total?: number;
    apis?: DataSetListApisItem[];
}
export type PerformSearchBody = {
    /** Uses Lucene Query Syntax in the format of propertyName:value, propertyName:[num1 TO num2] and date range format: propertyName:[yyyyMMdd TO yyyyMMdd]. In the response please see the 'docs' element which has the list of record objects. Each record structure would consist of all the fields and their corresponding values. */
    criteria: string;
    /** Starting record number. Default value is 0. */
    start?: number;
    /** Specify number of rows to be returned. If you run the search with default values, in the response you will see 'numFound' attribute which will tell the number of records available in the dataset. */
    rows?: number;
};
export type PerformSearch200Item = {
    [key: string]: {
        [key: string]: unknown;
    };
};
/**
 * This is the base client to use for interacting with the API.
 */
export declare class USPTODataSetAPIClient {
    private cleanBaseUrl;
    private commonRequestParameters;
    constructor(clientOptions: {
        baseUrl: string;
        commonRequestParameters?: Params;
    });
    /**
     * @summary List available data sets
     */
    listDataSets(requestParameters?: Params): {
        response: Response;
        data: DataSetList;
        operationId: string;
    };
    /**
     * This GET API returns the list of all the searchable field names that are in the oa_citations. Please see the 'fields' attribute which returns an array of field names. Each field or a combination of fields can be searched using the syntax options shown below.
     * @summary Provides the general information about the API and the list of fields that can be used to query the dataset.
     */
    listSearchableFields(dataset: string, version: string, requestParameters?: Params): {
        response: Response;
        data: string;
        operationId: string;
    };
    /**
     * This API is based on Solr/Lucene Search. The data is indexed using SOLR. This GET API returns the list of all the searchable field names that are in the Solr Index. Please see the 'fields' attribute which returns an array of field names. Each field or a combination of fields can be searched using the Solr/Lucene Syntax. Please refer https://lucene.apache.org/core/3_6_2/queryparsersyntax.html#Overview for the query syntax. List of field names that are searchable can be determined using above GET api.
     * @summary Provides search capability for the data set with the given search criteria.
     */
    performSearch(performSearchBody: PerformSearchBody, dataset?: string, version?: string, requestParameters?: Params): {
        response: Response;
        data: PerformSearch200Item[];
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

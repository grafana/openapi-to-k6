import type { Params, Response } from "k6/http";
/**
 * A text message describing an error
 * @maxLength 256
 */
export type ErrorMessage = string;
/**
 * @minimum 1
 * @maximum 3
 */
export type Coordinate = number;
/**
 * Possible values for a board square. `.` means empty square.
 */
export type Mark = (typeof Mark)[keyof typeof Mark];
export declare const Mark: {
    readonly ".": ".";
    readonly X: "X";
    readonly O: "O";
};
/**
 * @minItems 3
 * @maxItems 3
 */
export type Board = Mark[][];
/**
 * Winner of the game. `.` means nobody has won yet.
 */
export type Winner = (typeof Winner)[keyof typeof Winner];
export declare const Winner: {
    readonly ".": ".";
    readonly X: "X";
    readonly O: "O";
};
export interface Status {
    winner?: Winner;
    board?: Board;
}
/**
 * This is the base client to use for interacting with the API.
 */
export declare class TicTacToeClient {
    private cleanBaseUrl;
    private commonRequestParameters;
    constructor(clientOptions: {
        baseUrl: string;
        commonRequestParameters?: Params;
    });
    /**
     * Retrieves the current state of the board and the winner.
     * @summary Get the whole board
     */
    getBoard(requestParameters?: Params): {
        response: Response;
        data: Status;
        operationId: string;
    };
    /**
     * Retrieves the requested square.
     * @summary Get a single board square
     */
    getSquare(row: number, column: number, requestParameters?: Params): {
        response: Response;
        data: Mark;
        operationId: string;
    };
    /**
     * Places a mark on the board and retrieves the whole board and the winner (if any).
     * @summary Set a single board square
     */
    putSquare(row: number, column: number, mark: Mark, requestParameters?: Params): {
        response: Response;
        data: Status;
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

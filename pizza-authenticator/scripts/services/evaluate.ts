// Copyright 2019 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { createShareableAsset } from "./share";
import { postImage } from "./http";
import { fullRoute } from "../config";

export enum PizzaLabel {
    NYC = "NYC",
    SF = "SF",
    CHI = "CHI",
}

export declare namespace Evaluation {
    interface Score {
        displayName: string;
        classification: { score: number };
    }

    interface Response {
        id: string;
        created?: boolean;
        share?: string;
        is_pizza: Score[];
        pizza_auth: Score[];
    }
}

const labels = [ PizzaLabel.NYC, PizzaLabel.SF, PizzaLabel.CHI ];
const debug: Evaluation.Response = {
    id: "foo",
    created: true,
    is_pizza: [ {
        displayName: "PIE",
        classification: { score: 0.98954 }
    } ],
    pizza_auth: [
        {
            displayName: "SF",
            classification: { score: 0.78546 }
        },
        {
            displayName: "NYC",
            classification: { score: 0.21 }
        },
        {
            displayName: "CHI",
            classification: { score: 0.009 }
        },
    ]
};
const noPizzaDebug = {
    id: "no-pizza",
    url: "",
    created: true,
    is_pizza: [ {
        displayName: "NOTPIZZA",
        classification: { score: 0.98954 }
    } ],
    pizza_auth: []
};
const store: Evaluation.Response[] = [ debug, noPizzaDebug ];

/**
 * Sends an image to the backend to determine whether it contains a slice or a whole pie and if so,
 * determine the likelyhood of the slice being authentically New York Style, Chicago Style or
 * Californian.
 *
 * @param blob image to examine
 */
export function evaluate( blob: Blob ): Promise<Evaluation.Response> {

    return postImage( blob, fullRoute( "/api/evaluate/" ) )
        .then( ( rawResponse: string ) => {
            const json = JSON.parse( rawResponse ) as Evaluation.Response;
            json.created = true;

            defaultValue( json, "is_pizza", [] );
            defaultValue( json, "pizza_auth", [] );

            store.push( json );

            return createShareableAsset( json )
                .then( ( url: string ) => {
                    json.share = url;
                    return json;
                } );
        } );
}

/**
 * Previously evaluated images are stored as long as the session is active. This lets the user
 * retrieve the result immediatly. All other result IDs are fetched from the server if available.
 *
 * @param id id of the result
 */
export function getResult( id: string ): Promise<Evaluation.Response | null> {
    const fromStore = store.find( response => response.id === id );

    if ( fromStore ) {
        return Promise.resolve( fromStore );
    } else {
        return fetch( fullRoute( `/api/evaluate/${ id }` ) )
            .then( response => {
                if ( !response.ok ) {
                    throw new Error();
                }

                return response.json();
            } )
            .then( ( value: Evaluation.Response ) => {
                store.push( value );
                return value || null;
            } )
            .catch( () => null );
    }
}

export function isPizza( response: Evaluation.Response | null ): boolean {
    if ( !response || response.is_pizza.length === 0 ) {
        return false;
    }

    const notPizzaMax: number = response.is_pizza.reduce( ( previous, score: Evaluation.Score ) => {
        return score.displayName === "NOTPIZZA" ?
            Math.max( score.classification.score, previous ) :
            previous;
    } , 0 );

    return notPizzaMax < 0.5;
}

export interface ResultValue {
    name: string;
    value: number;
    label: PizzaLabel;
}

/**
 * Returns a sorted array of results with empty value injected as zero. Each result contains a label
 * as well as a percentage.
 */
export function extractValues( response: Evaluation.Response ): ResultValue[] {
    return labels.map<ResultValue>( label => {
        const entry: Evaluation.Score | undefined = response.pizza_auth.find( s => s.displayName === label );
        const value = entry ? Math.round( entry.classification.score * 100 ) : 0;

        return {
            value,
            name: translateLabel( label ),
            label,
        } as ResultValue;
    } ).sort( ( a, b ) => b.value - a.value );
}

function translateLabel( label: PizzaLabel ): string {
    return {
        [PizzaLabel.CHI]: "Chicago Style",
        [PizzaLabel.NYC]: "New York Style",
        [PizzaLabel.SF]: "California Style",
    }[ label ];
}

function defaultValue<T extends {}, K extends keyof T>( object: T,  key: K, value: any ): void {
    if ( ! object[ key ] ) {
        object[ key ] = value;
    }
}

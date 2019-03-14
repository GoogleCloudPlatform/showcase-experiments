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

const AMOUNT = 1000;

let isInitialized = false;
let numbers = "";
let pointer = 0;

interface ServerResponse {
    content: string;
}

interface ServerError {
    Error: string;
    Code: number;
}

function isError( value: Partial<ServerResponse & ServerError> ): value is ServerError {
    return value.hasOwnProperty( "Error" ) && value.hasOwnProperty( "Code" );
}

export const MAX_VALUE = 31415926535897;

export function seedPi( value: number | string ): Promise<void> {
    return loadNumbers( parseInt( value.toString() ) )
        .then( ( result: string ) => {
            numbers = result;
            pointer = 0;
            isInitialized = true;
        } )
        .catch( () => {
            handleError();
            pointer = 0;
            isInitialized = true;
        } );
}

function loadNumbers( start: number, amount = AMOUNT ): Promise<string> {
    start = start % AMOUNT;

    if ( start + amount > MAX_VALUE + 1 ) {
        return Promise.all( [
            loadNumbers( start, MAX_VALUE - start ),
            loadNumbers( 0, ( start + 1000 ) % AMOUNT ),
        ] ).then( ( [ a, b ] ) => a + b );
    }

    return fetch( `https://api.pi.delivery/v1/pi?start=${ start }&numberOfDigits=${ amount }` )
        .then( response => response.json() )
        .then( ( response: ServerResponse | ServerError ) => {
            if ( isError( response ) ) {
                throw new Error( "Could not load Pi" );
            }

            return numbers = response.content.split( "." ).join( "" );
        } );
}

export function resetSeed() {
    pointer = 0;
}

export function getInt( min: number, max: number ) {
    if ( !isInitialized ) {
        throw new Error( "pi has not been seeded" );
    }

    const difference = max - min;

    return Math.round( min + ( difference * getFloat() ) );
}

export function getFloat() {
    return getDigits( 5 ) / 100000;
}

export function getRange( min: number, max: number ): number {
    return min + getFloat() * ( max - min );
}

function handleError() {
    console.warn( "API failed. Using random numbers instead." )

    numbers = "";

    for ( let i = 0; i < AMOUNT; i++ ) {
        numbers += Math.floor( Math.random() * 10 );
    }
}

function getDigits( amount: number ): number {
    if ( pointer + amount > numbers.length - 1 ) {
        const overflow = pointer + amount - numbers.length;
        const beginning = numbers.substr( pointer );
        const ending = numbers.substr( 0, overflow );
        pointer = overflow;

        return parseInt( `${ beginning }${ ending }`, 10 );
    }

    const digits = numbers.substr( pointer, amount );
    pointer += amount;

    return parseInt( digits, 10 );
}




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

import { fullRoute } from "../config";
import { Evaluation, extractValues, ResultValue, PizzaLabel } from "./evaluate";
import { postImage } from "./http";
import pizzaCH from "../../assets/pizza-chicago.svg";
import pizzaNY from "../../assets/pizza-newyork.svg";
import pizzaOther from "../../assets/pizza-other.svg";

const TWITTER_SHARE_URL = "https://twitter.com/intent/tweet?";
const TWITTER_POPUP_SETTINGS = "scrollbar=0,height=253,width=600";

const FACEBOOK_SHARE_URL = "https://www.facebook.com/dialog/share?";
const FACEBOOK_APP_ID = "2290016707907300";
const FACEBOOK_POPUP_SETTINGS = "height=500,width=700";

const input = document.createElement( "input" );

export function tweet( text: string, url: string = document.location.href ) {
    const params = `text=${ encodeURIComponent( text ) }&url=${ encodeURIComponent( url ) }&via=GoogleCloudPlatform`;

    window.open( `${ TWITTER_SHARE_URL }${ params }`, "_blank", TWITTER_POPUP_SETTINGS );
}

export function facebookShare( url: string = document.location.href ) {
    const params = `app_id=${ FACEBOOK_APP_ID }&display=popup&href=${ encodeURIComponent( url ) }`;

    window.open( `${ FACEBOOK_SHARE_URL }${ params }`, "_blank", FACEBOOK_POPUP_SETTINGS );
}

export function copyToClipboard( text: string = document.location.href ) {
    input.value = text;

    document.body.appendChild( input );

    input.focus();
    input.select();

    document.execCommand( "copy" );
    document.body.removeChild( input );
}

/**
 * Creates an image with the purpose to be used as a sharable asset for an evaluated slice.
 * The asset contains the result and the image run in the model.
 */
export function renderShareableAsset( response: Evaluation.Response ): Promise<Blob> {
    const canvas = document.createElement( "canvas" );
    const context = canvas.getContext( "2d" )!;
    const values = extractValues( response );

    canvas.width = 1200;
    canvas.height = 630;

    context.fillStyle = "#f6f6f6";
    context.fillRect( 0, 0, canvas.width, canvas.height );

    context.beginPath();
    context.moveTo( 0, canvas.height * 0.6 );
    context.quadraticCurveTo( canvas.width * 0.5, canvas.height * 0.3, canvas.width, canvas.height * 0.6 );
    context.lineTo( canvas.width, canvas.height );
    context.lineTo( 0, canvas.height );
    context.closePath();
    context.fillStyle = "#fdd835";
    context.fill();

    context.fillStyle = "#85391e";
    context.font = `bold 45px "Google Sans"`;
    context.textAlign = "center";
    context.fillText( "Pizza Authenticator", canvas.width / 2, 100 );

    context.font = `20px "Google Sans"`;
    context.fillText( "My pizza is authentic", canvas.width / 2, 430 );

    context.font = `bold 28px "Google Sans"`;
    context.fillText( formatPrimary( values[ 0] ), canvas.width / 2, 480 );

    context.font = `18px "Google Sans"`;
    context.fillText( formatSecondary( values[ 1 ] ), canvas.width / 2, 520 );
    context.fillText( formatSecondary( values[ 2 ] ), canvas.width / 2, 550 );

    context.font = `15px "Google Sans"`;
    context.fillText( "a Google Cloud Experiment", canvas.width / 2, 615 );

    const image = new Image();
    image.crossOrigin = "anonymous";

    return new Promise<Blob>( ( resolve, reject ) => {
        image.onload = () => {
            const halfX = canvas.width / 2;
            const halfY = canvas.height / 2;

            context.save();
            context.translate( halfX, halfY * 0.9 );
            context.rotate( - Math.PI / 2 );
            context.beginPath();
            context.moveTo( 0, 0 );
            context.lineTo( halfX, 0 );
            context.arc( 0, 0, halfY, 0, values[ 0 ].value * Math.PI * 0.02 );
            context.lineTo( 0, 0 );
            context.closePath();
            context.clip();

            context.rotate( Math.PI / 2 );
            context.drawImage( image, -100, -100, 200, 200 );

            context.restore();

            canvas.toBlob( blob => blob ? resolve( blob ) : reject() , "image/png" );
        };

        image.onerror = () => {
            canvas.toBlob( blob => blob ? resolve( blob ) : reject() , "image/png" );
        };

        image.src = getPizzaURL( response );
    } );
}

/**
 * Stores the asset on the server.
 */
export function storeSharableAsset( id: string, blob: Blob ): Promise<string> {
    return postImage( blob, fullRoute( `/api/result/${ id }` ) )
        .then( ( rawResponse: string ) => {
            const json = JSON.parse( rawResponse ) as { url: string };
            return json.url;
        } );
}

/**
 * Convinience method to combine rendering and saving of asset.
 */
export function createShareableAsset( response: Evaluation.Response ): Promise<string> {
    return renderShareableAsset( response )
        .then( blob => storeSharableAsset( response.id, blob ) );
}

function getPizzaURL( response: Evaluation.Response ): string {
    const label = extractValues( response )[ 0 ].label;

    switch ( label ) {
        case PizzaLabel.NYC: return pizzaNY;
        case PizzaLabel.CHI: return pizzaCH;
        case PizzaLabel.SF:
        default:
            return pizzaOther;
    }
}

function formatPrimary( result: ResultValue ): string {
    return `${ result.name } ${ Math.round( result.value ) }%`;
}

function formatSecondary( result: ResultValue ): string {
    const num = result.value <= 1 ? ">1%" : `${ Math.round( result.value ) }%`;
    return `${ result.name }: ${ num }`;
}

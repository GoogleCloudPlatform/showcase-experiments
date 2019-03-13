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

import { getFloat, resetSeed, seedPi, MAX_VALUE } from "../services/pi";
import { Composition, CoverComposition } from "./composition";
import { backgroundColor, blueColor, drawColor, redColor, yellowColor } from "./config";


let composition: Composition;
let coverComposition: Composition;
let redComposition: Composition;
let redRadius: number;


export async function compose( digits: number, size: number ) {
    await seedPi( digits );

    composition = new Composition( size / 10 );
    coverComposition = new CoverComposition( size / 10 );

    resetSeed();

    redRadius = size * ( 0.2 + getFloat() * 0.2 );
    redComposition = new Composition( size / 10 );
}

export async function renderPng( digit: number, size: number ): Promise<Blob> {
    const [ canvas, context ] = makeCanvas( size );

    render( context, size, digit, 0.5 );

    return new Promise<Blob>( resolve => {
        canvas.toBlob( blob => {
            if ( blob ) resolve( blob );
        } );
    } );
}

export function renderCanvasCover( canvas: HTMLCanvasElement, size: number ) {
    const context = canvas.getContext( "2d" )!;

    canvas.width = size;
    canvas.height = size;

    context.fillStyle = backgroundColor;
    context.strokeStyle = backgroundColor;

    let i = 0.5

    function loop() {
        i += 0.005;

        context.clearRect( 0, 0, size, size );

        if ( i < 1 ) {
            coverComposition.render( context, i );
            requestAnimationFrame( loop );
        }
    }

    loop();
}

function makeCanvas( size: number ): [ HTMLCanvasElement, CanvasRenderingContext2D ] {
    const canvas = document.createElement( "canvas" );
    const context = canvas.getContext( "2d" )!;

    canvas.width = size;
    canvas.height = size;

    return [ canvas, context ];
}

function render( context: CanvasRenderingContext2D, size: number, digit: number, t = 1 ) {
    context.fillStyle = backgroundColor;
    context.fillRect( 0, 0, size, size );

    // Draw gray version
    context.fillStyle = drawColor;
    context.strokeStyle = drawColor;

    composition.render( context, t );

    // Draw yellow
    context.save();
    context.fillStyle = yellowColor;
    context.strokeStyle = yellowColor;

    const p = ( 1 - ( digit.toString().length / `${ MAX_VALUE }`.length ) ) * size;

    context.beginPath();
    context.moveTo( size, size );
    context.lineTo( size, 0 );
    context.bezierCurveTo( p, p, p, p, 0, size );
    context.closePath();
    context.clip();

    composition.render( context, t );

    context.restore();

    // Draw red highlight
    context.save();
    context.fillStyle = redColor;
    context.strokeStyle = redColor;

    context.beginPath();
    context.arc( size / 2, size / 2, redRadius, 0, Math.PI * 2 );
    context.closePath();
    context.clip();

    redComposition.render( context, t );

    context.restore();

    // Draw blue highlight
    context.save();
    context.fillStyle = blueColor;
    context.strokeStyle = blueColor;

    context.beginPath();
    context.arc( size / 2, size / 2, size * 0.4, 0, Math.PI * 2 );
    context.closePath();
    context.clip();

    composition.render( context, t );

    context.restore();
}


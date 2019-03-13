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

import { getInt } from "../services/pi";

function scale( x: number ) { return x * 10; }

const offset = 10;
const multiply = 1;

export type RenderFunction = ( context: CanvasRenderingContext2D, x: number, y: number, size: number, rotation: number,  t?: number ) => void;
export type BakedRenderFunction = ( context: CanvasRenderingContext2D, t: number ) => void;

export function N( context: CanvasRenderingContext2D, x: number, y: number, size: number, rotation: number, t = 1 ) {
    context.save();
    context.beginPath();

    size *= t;

    const halfSize = size / 2;

    context.translate( halfSize * ( 1 - t ), halfSize * ( 1 - t ) );

    for ( let i = 0; i < size / 2 / offset; i++ ) {
        const padding = offset * i;

        context.moveTo( x + padding, y + size - padding * t );
        context.lineTo( x + padding, y + padding )
        context.lineTo( x + size - padding, y + size - padding );
        context.lineTo( x + size - padding, y + padding );
    }

    context.lineWidth = 1 * multiply;
    context.stroke();
    context.restore();
}

export function E( context: CanvasRenderingContext2D, x: number, y: number, size: number, rotation: number, t = 1 ) {
    const rotateX = x + size / 2;
    const rotateY = y + size / 2;

    context.beginPath();

    context.save();
    context.translate( rotateX, rotateY );
    context.rotate( Math.PI / 2 * rotation );
    context.translate( -rotateX, -rotateY );

    for ( let i = 0; i < size / 2 / offset; i++ ) {
        const padding = offset * i;

        context.moveTo( x, y + padding );
        context.lineTo( x, y + size - padding );
        context.lineTo( x + size * t - padding * t, y + size - padding );
        context.moveTo( x, y + size / 2 );
        context.lineTo( x + size * t / 2, y + size / 2 );
        context.moveTo( x, y + padding );
        context.lineTo( x + size * t - padding * t, y + padding );
    }

    context.lineWidth = 1 * multiply;
    context.stroke();

    context.restore();
}

export function X( context: CanvasRenderingContext2D, x: number, y: number, size: number, rotation: number, t = 1 ) {
    const rotateX = x + size / 2;
    const rotateY = y + size / 2;

    context.beginPath();

    context.save()
    context.translate( rotateX, rotateY );
    context.rotate( Math.PI / 2 * rotation );
    context.translate( -rotateX, -rotateY );

    context.moveTo( x, y );
    context.lineTo( x + size, y + size );
    context.lineTo( x + size * ( 1 - t ), y + size );
    context.lineTo( x + size * t, y );

    context.closePath();
    context.lineWidth = 5 * multiply;

    context.fill();

    context.restore();
}

export function square( context: CanvasRenderingContext2D, x: number, y: number, size: number, rotation: number, t = 1 ) {
    const rotateX = x + size / 2;
    const rotateY = y + size / 2;
    const padding = 2 * multiply;

    context.save()
    context.beginPath();
    context.translate( rotateX, rotateY );
    context.rotate( Math.PI / 2 * rotation );
    context.translate( -rotateX, -rotateY );

    context.fillRect( x + padding, y + padding, ( size - padding * 2 ) * t, size - padding * 2 );
    context.restore();
}

export function fullSquare( context: CanvasRenderingContext2D, x: number, y: number, size: number, rotation: number, t = 1 ) {
    const rotateX = x + size / 2;
    const rotateY = y + size / 2;

    context.save()
    context.beginPath();
    context.translate( rotateX, rotateY );
    context.rotate( Math.PI / 2 * rotation );
    context.translate( -rotateX, -rotateY );

    context.fillRect( x, y, size * t, size );
    context.restore();
}

export function emptySquare( context: CanvasRenderingContext2D, x: number, y: number, size: number, rotation: number, t = 1 ) {
    context.beginPath();

    const strokeWidth = 5 * t * multiply;
    const halfStrokeWidth = strokeWidth / 2;

    context.lineWidth = strokeWidth;
    context.strokeRect(
        x + halfStrokeWidth + ( size / 2 ) * ( 1 - t ),
        y + halfStrokeWidth + ( size / 2 ) * ( 1 - t ),
        ( size - strokeWidth ) * t,
        ( size - strokeWidth ) * t
    );
}

export function stack( context: CanvasRenderingContext2D, x: number, y: number, size: number, rotation: number, t = 1  ) {
    const height = size / 4;
    const rotateX = x + size / 2;
    const rotateY = y + size / 2;
    const padding = 2 * multiply;

    context.save();
    context.translate( rotateX, rotateY );
    context.rotate( Math.PI / 2 * rotation );
    context.translate( -rotateX, -rotateY );

    context.beginPath();
    context.fillRect( x, y, size * t , height - padding );
    context.fillRect( x, y + height, size * t * t, height - padding );
    context.fillRect( x, y + height * 2, size * t * t * t, height - padding );
    context.fillRect( x, y + height * 3, size * t * t * t * t, height );

    context.restore();
}

export function circle( context: CanvasRenderingContext2D, x: number, y: number, size: number, rotation: number, t = 1 ) {
    const rotateX = x + size / 2;
    const rotateY = y + size / 2;

    context.save();
    context.translate( rotateX, rotateY );
    context.rotate( Math.PI / 2 * rotation );
    context.translate( -rotateX, -rotateY );

    context.beginPath();
    context.moveTo( x + size / 2, y + size / 2 );
    context.lineTo( x + size, y + size / 2 );
    context.arc( x + size / 2, y + size / 2, size / 2 - 1, 0, Math.PI * 2 * t );
    context.lineTo( x + size / 2, y + size / 2 );
    context.closePath();

    context.fill();
    context.restore();
}

export function bakeFn( fn: RenderFunction, x: number, y: number, size: number ): BakedRenderFunction {
    x = scale( x );
    y = scale( y );
    size = scale( size );

    const rotation = getInt( 0, 3 );

    return function( context: CanvasRenderingContext2D, t: number ) {
        if ( t < 0.01 ) return;
        fn( context, x, y , size, rotation, t );
    }
}

export const letters: RenderFunction[] = [ N, E, X, square, emptySquare, stack, circle ];

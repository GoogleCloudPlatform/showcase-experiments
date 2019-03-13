import { Grid, Cell } from "./grid";
import { distribution, coverDistribution } from "./config";
import { getInt, getRange } from "../services/pi";
import { RenderFunction, letters, BakedRenderFunction, bakeFn, square, fullSquare } from "./glyphs";

export class Composition {

    public readonly elements: Element[] = [];

    constructor( size: number, config = distribution ) {
        const grid = new Grid( size );

        config.forEach( round => {
            if ( round.amount === -1 ) {
                let cell: Cell | null;

                while ( cell = grid.findCell( round.size ) ) {
                    this.elements.push( this.makeElement( cell.column, cell.row, round.size ) );
                    grid.mark( cell.column, cell.row, round.size )
                }

                return;
            }

            for ( let i = 0; i < round.amount; i++ ) {
                const column = getInt( 0, grid.getSize() - round.size );
                const row = getInt( 0, grid.getSize() - round.size );

                if ( ! grid.checkAvailability( column, row, round.size ) ) {
                    continue;
                }

                this.elements.push( this.makeElement( column, row, round.size ) );
                grid.mark( column, row, round.size );
            }
        } );
    }

    render( context: CanvasRenderingContext2D, t: number ) {
        for ( let i = 0, length = this.elements.length; i < length; i++ ) {
            this.elements[ i ].render( context, t );
        }
    }

    protected makeElement( column: number, row: number, size: number ): Element {
        return new Element( column, row, size );
    }
}

export class CoverComposition extends Composition {
    constructor( size: number ) {
        super( size );
    }

    protected makeElement( column: number, row: number, size: number ): Element {
        return new SquareElement( column, row, size );
    }
}

export class Element {
    protected pause = getRange( 0.1, 0.2 );
    protected in = getRange( 0.3, 0.4 );
    protected idle = getRange( 0.7, 0.9 );
    protected renderFn: BakedRenderFunction;

    constructor( public x: number, public y: number, public size: number ) {
        const instructions: RenderFunction = letters[ getInt( 0, letters.length - 1 ) ];
        this.renderFn = bakeFn( instructions, x, y, size );
    }

    render( context: CanvasRenderingContext2D, t: number ) {
        this.renderFn( context, this.ease( t ) );
    }

    private ease( t: number ): number {
        if ( t < this.pause ) {
            return 0;
        } else if ( t < this.in ) {
            return lerp( t, this.pause, this.in );
        } else if ( t >= this.in && t <= this.idle ) {
            return 1
        } else {
            return 1 - lerp( t, this.idle, 1 );
        }
    }
}

class SquareElement extends Element {
    constructor( x: number, y: number, size: number ) {
        super( x, y, size );

        this.renderFn = bakeFn( fullSquare, x, y, size );
    }
}

function lerp( value: number, min: number, max: number ): number {
    return ( value - min ) / ( max - min );
}

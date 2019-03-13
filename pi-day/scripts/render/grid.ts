import { getFloat, getRange } from "../services/pi";

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

export class Grid {
    private cells: Cell[][] = [];

    private columns: number;
    private rows: number;

    constructor( size: number ) {
        this.columns = size;
        this.rows = size;

        for ( let column = 0; column < this.rows; column++ ) {
            this.cells.push( [] );
            for ( let row = 0; row < this.columns; row ++ ) {
                this.cells[ column ].push( new Cell( column, row ) );
            }
        }
    }

    getSize(): number {
        return this.columns;
    }

    getCell( column: number, row: number ): Cell {
        return this.cells[ column ][ row ];
    }

    mark( column: number, row: number, size: number ) {
        // TODO(roboshoes): Also check for size
        if ( column > this.columns || row > this.rows ) {
            throw new Error( "Region to mark is outside of Grid" );
        }

        for ( let c = column; c < column + size; c++ ) {
            for ( let r = row; r < row + size; r++ ) {
                this.cells[ c ][ r ].marked = true;
            }
        }
    }

    checkAvailability( column: number, row: number, size: number ): boolean {
        let failed = false;

        for ( let c = column; c < column + size; c++ ) {
            for ( let r = row; r < row + size; r++ ) {
                if ( this.cells[ c ][ r ].marked ) {
                    failed = true;
                    break;
                }
            }

            if ( failed ) {
                break;
            }
        }

        return !failed;
    }

    findCell( size: number ): Cell | null {
        for ( let c = 0; c < this.columns - ( size - 1 ); c++ ) {
            for ( let r = 0; r < this.rows - ( size - 1 ); r++ ) {
                if ( this.checkAvailability( c, r, size ) ) {
                    return this.cells[ c ][ r ];
                };
            }
        }

        return null;
    }
}

export class Cell {
    public marked = false;

    private pause = getRange( 0, 0.2 );
    private in = getRange( 0.2, 0.4 );
    private idle = getRange( 0.4, 0.9 );

    constructor( public column: number, public row: number ) {}

    ease( t: number ): number {
        if ( t < this.pause ) {
            return 0;
        } else if ( t < this.in ) {
            return lerp( t, this.pause, this.in );
        } else if ( t <= this.idle ) {
            return 1
        } else {
            return 1 - lerp( t, this.idle, 1 );
        }
    }
}

function lerp( value: number, min: number, max: number ): number {
    return ( value - min ) / ( max - min );
}

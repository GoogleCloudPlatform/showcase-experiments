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

import React from "react";
import styles from "../../styles/components/map.css";
import mapImage from "../../assets/map.svg";

interface DataCenter {
    id: string;
    x: number;
    y: number;
}

export const nodePositions: DataCenter[] = [
    { id: "Taiwan", x: 0.175, y: 0.4089456869 },
    { id: "Tokyo", x: 0.213333, y: 0.3194888179 },
    { id: "Sydney", x: 0.2483333333, y: 0.8274760383 },
    { id: "Oregon", x: 0.405, y: 0.2396166134 },
    { id: "Iowa", x: 0.491666, y: 0.2747603834 },
    { id: "Virginia", x: 0.523333, y: 0.3162939297 },
    { id: "London", x: 0.7866666667, y: 0.1980830671 },
    { id: "Frankfurt", x: 0.8183333333, y: 0.2076677316 },
    { id: "Sao Paulo", x: 0.6266666667, y: 0.731629393 },
];

interface WorldMapProps {
    type: "pin" | "circle";
    steps?: number;
    onSelect?: ( id: string ) => void;
}

export const nodeNames = nodePositions.map( x => x.id );

export class WorldMap extends React.Component<WorldMapProps> {
    private canvasRef = React.createRef<HTMLCanvasElement>();
    private wrapperRef = React.createRef<HTMLDivElement>();
    private anchorRef = React.createRef<HTMLDivElement>();
    private ratio = 313 / 600;
    private density = 2;
    private width = 1000 * this.density;
    private height = this.width * this.ratio;

    componentDidMount() {
        if ( window.innerWidth <= 500 ) {
            const adjustedWidth = ( this.wrapperRef.current!.clientHeight ) / this.ratio;

            this.width = adjustedWidth * this.density;
            this.height = this.width * this.ratio;
        } else {
            this.width = window.innerWidth * this.density;
            this.height = this.width * this.ratio;
        }

        if ( this.canvasRef.current && this.props.steps ) {
            this.renderNodes( this.props.steps );
        }
    }

    componentDidUpdate() {
        this.renderNodes( this.props.steps );
    }

    render() {
        return (
            <div className={ styles.component } ref={ this.wrapperRef }>
                <img src={ mapImage } />
                <div className={ styles.canvasHolder }>
                    <canvas ref={ this.canvasRef } onClick={ e => this.onClick( e ) }></canvas>
                    <div ref={ this.anchorRef } className={ styles.anchor }></div>
                </div>
            </div>
        );
    }

    scrollRight() {
        if ( this.anchorRef.current ) {
            this.anchorRef.current.scrollIntoView( { behavior: "smooth" } );
        }
    }

    private onClick( e: React.MouseEvent<HTMLCanvasElement> ) {
        if ( !this.props.onSelect ) {
            return;
        }

        const rect = e.currentTarget.getBoundingClientRect();
        let x = e.clientX - rect.left;
        let y = e.clientY - rect.top;

        x /= this.width / this.density;
        y /= this.height / this.density;

        const pixel = 1 / ( this.width / this.density );

        for ( let i = 0; i < nodePositions.length; i++ ) {
            const it = nodePositions[ i ];
            const vector = { x: x - it.x, y: y - it.y };
            const distance = Math.sqrt( vector.x * vector.x + vector.y * vector.y );

            if ( distance < pixel * 10 ) {
                this.props.onSelect( it.id );
                return;
            }
        }
    }

    private renderNodes( endIndex = 0 ) {
        if ( this.canvasRef.current ) {
            const canvas = this.canvasRef.current;
            const context = canvas.getContext( "2d" )!;

            canvas.width = this.width;
            canvas.height = this.height;

            for ( let i = 0; i < nodePositions.length; i++ ) {
                const city: DataCenter = nodePositions[ i ];

                if ( i > 0 && i <= endIndex ) {
                    this.renderLine( context, nodePositions[ i - 1 ], city );
                }

                context.beginPath();
                context.moveTo( city.x * this.width, city.y * this.height );
                context.arc( city.x * this.width, city.y * this.height, 2 * this.density, 0, Math.PI * 2 );
                context.closePath();
                context.fillStyle = "black";
                context.fill();

                if ( i <= endIndex ) {
                    context.beginPath();
                    context.arc( city.x * this.width, city.y * this.height, 7 * this.density, 0, Math.PI * 2 );
                    context.closePath();
                    context.lineWidth = 1 * this.density;
                    context.strokeStyle = "black";
                    context.stroke();
                }
            }
        }
    }

    private renderLine( context: CanvasRenderingContext2D, from: DataCenter, to: DataCenter ) {
        const midway = {
            x: ( to.x * this.width + from.x * this.width ) / 2,
            y: Math.min( to.y * this.height, from.y * this.height ) - 30,
        };

        context.beginPath();
        context.moveTo( from.x * this.width, from.y * this.height );
        context.quadraticCurveTo(
            midway.x, midway.y,
            to.x * this.width, to.y * this.height
        );
        context.strokeStyle = "#009688";
        context.stroke();
    }
}

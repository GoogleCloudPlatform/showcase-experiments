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
import classnames from "classnames";
import React from "react";

import pizzaCH from "../../assets/pizza-chicago.svg";
import pizzaNY from "../../assets/pizza-newyork.svg";
import pizzaOther from "../../assets/pizza-other.svg";
import style from "../../styles/components/result.scss";
import sharedStyles from "../../styles/shared.scss";
import { Evaluation, extractValues, PizzaLabel } from "../services/evaluate";
import { CameraButton } from "./button-camera";
import { UploadButton } from "./button-upload";
import { ShareButton } from "./share-button";


interface ValidPizzaResultProps {
    response: Evaluation.Response;
}

export class ValidPizzaResult extends React.Component<ValidPizzaResultProps> {

    private readonly CANVAS_SIZE = 190;
    private canvasRef: React.RefObject<HTMLCanvasElement> = React.createRef();

    componentDidMount() {
        if ( this.canvasRef.current ) {
            const canvas = this.canvasRef.current;
            const context = canvas.getContext( "2d" )!;

            canvas.width = canvas.height = this.CANVAS_SIZE;

            const { response } = this.props;
            const values = extractValues( response );

            this.drawSlice( context, 0, ( 100 - values[ 0 ].value ) / 100 );
        }
    }

    render() {
        const { response } = this.props;
        const values = extractValues( response );

        return (
            <div className={ style.validPizzaPage}>
                <div className={ style.graphContainer }>
                    <div className={ classnames( sharedStyles.experiment, style.experiment ) }>
                        <a href="https://showcase.withgoogle.com/experiments">a Google Cloud experiment</a>
                        &nbsp;&bull;&nbsp;
                        <a href="https://policies.google.com/privacy?hl=en" target="_blank">Privacy</a>
                    </div>

                    <div className={ style.iconWrapper }>
                        <div className={ classnames( style.shade, style.child ) }></div>
                        <img className={ style.child } src={ this.getPizzaURL( values[ 0 ].label ) }/>
                        <canvas ref={ this.canvasRef }></canvas>
                    </div>
                </div>

                <p>Your Pizza is authentic</p>

                <h2>{ values[ 0 ].name } <span>{ values[ 0 ].value }%</span></h2>

                <p>{ values[ 1 ].name }: { this.formatLowNumber( values[ 1 ].value ) }%</p>
                <p>{ values[ 2 ].name }: { this.formatLowNumber( values[ 2 ].value ) }%</p>

                <div className={ style.buttonContainer }>
                    <ShareButton classes={ style.share } />

                    <CameraButton label={ "Check another slice" } inverse={ true } />
                    <UploadButton label={ "Check another slice" } inverse={ true }/>
                </div>
            </div>
        );
    }

    private getPizzaURL( label: PizzaLabel ): string {
        switch ( label ) {
            case PizzaLabel.NYC: return pizzaNY;
            case PizzaLabel.CHI: return pizzaCH;
            case PizzaLabel.SF:
            default:
                return pizzaOther;
        }
    }

    private formatLowNumber( value: number ): string {
        return value > 1 ? `${ value }` : ">1";
    }

    private drawSlice( context: CanvasRenderingContext2D, start = 0, percent: number ) {
        const half = this.CANVAS_SIZE / 2;

        context.save();
        context.translate( half, half );
        context.rotate( - Math.PI / 2 + start * Math.PI * 2 );
        context.beginPath();
        context.moveTo( 0, 0 );
        context.lineTo( half, 0 );
        context.arc( 0, 0, half, 0, percent * Math.PI * 2 );
        context.lineTo( 0, 0 );
        context.closePath();
        context.fillStyle = "white";
        context.fill();
        context.restore();
    }
}

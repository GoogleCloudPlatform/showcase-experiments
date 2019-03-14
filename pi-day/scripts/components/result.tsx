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
import classnames from "classnames";
import { RouteComponentProps } from "react-router";
import { Link } from "react-router-dom";

import styles from "../../styles/result.css";
import sharedStyles from "../../styles/shared.css";
import { compose, renderPng, renderCanvasCover } from "../render/chip";
import { ShareButton } from "./share-button";
import { formatNumber } from "../services/utils";
import { gaEvent } from "../services/ga";


interface ResultState {
    digits: string;
    download: string;
}

export class Result extends React.Component<RouteComponentProps, ResultState> {

    private canvasRef = React.createRef<HTMLCanvasElement>();

    constructor( props: RouteComponentProps ) {
        super( props );

        const digits = this.props.history.location.pathname.split( "/" )[ 4 ];

        if ( isNaN( parseInt( digits ) ) ) {
            this.props.history.push( "/experiment/pi/" );
        }

        this.state = {
            digits,
            download: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8Xw8AAoMBgDTD2qgAAAAASUVORK5CYII=",
        }
    }

    async componentDidMount() {
        gaEvent( { event: "pageview", path: location.pathname } );

        const digits = parseInt( this.state.digits );

        await compose( digits, 1000 )

        renderCanvasCover( this.canvasRef.current!, 1000 );

        renderPng( digits, 1000 ).then( blob => {
            this.setState( { download: URL.createObjectURL( blob ) } )
        } );
    }

    render() {
        return (
            <div className={ styles.page }>
                <div className={ `${ sharedStyles.experiment } ${ styles.experiment }` }>
                    <a href="https://showcase.withgoogle.com/experiments">a Google Cloud experiment</a>
                </div>

                <div className={ styles.chipWrapper }>
                    <img src={ this.state.download } width="100%" />
                    <canvas ref={ this.canvasRef } className={ styles.canvase }></canvas>
                    <a className={ styles.downloadButton } download href={ this.state.download }>
                        <i className="material-icons">save_alt</i>
                    </a>
                </div>

                <p>Generated from the</p>
                <h1>
                    { formatNumber( this.state.digits ) }
                    <span className={ styles.supertext }>{ this.th( this.state.digits ) }</span>
                    &nbsp;digit of Pi
                </h1>

                <Link to="/experiment/pi/generate/" className={ `${ sharedStyles.button } ${ styles.again }` }>
                    TRY AGAIN
                </Link>

                <ShareButton classes={ styles.share } />

                <div className={ classnames( sharedStyles.experiment, sharedStyles.privacy, styles.experiment ) }>
                    <a href="https://policies.google.com/privacy?hl=en-US" target="_blank">Privacy</a>
                </div>
            </div>
        );
    }

    private th( value: string ): string {
        switch ( value[ value.length - 1 ] ) {
            case "1": return "st";
            case "2": return "nd";
            case "3": return "rd";
            default: return "th";
        }
    }
}

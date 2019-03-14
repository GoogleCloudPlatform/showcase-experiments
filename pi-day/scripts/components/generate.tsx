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
import { Link } from "react-router-dom";

import headerImage from "../../assets/header.svg";
import homeDesktopImage from "../../assets/home-desktop.svg";
import styles from "../../styles/generate.css";
import sharedStyles from "../../styles/shared.css";
import { MAX_VALUE } from "../services/pi";
import { formatNumber } from "../services/utils";
import { gaEvent } from "../services/ga";

interface GenerateState {
    digit: string;
}

export class Generate extends React.Component<{}, GenerateState> {
    state: GenerateState = {
        digit: "",
    }

    componentDidMount() {
        gaEvent( { event: "pageview", path: location.pathname } );
    }

    render() {
        return (
            <div className={ styles.page }>
                <img src={ headerImage } className={ sharedStyles.mobile }/>
                <img src={ homeDesktopImage } className={ sharedStyles.desktop } />

                <h1>Enter a number from<br/>1 to { formatNumber( MAX_VALUE ) }</h1>

                <p className={ styles.decription }>
                    Enter a number. Any number.<br />
                    For example, to create a unique art piece from <br />
                    the digits of E, the natural number, enter 27182818284
                </p>

                <div className={ styles.inputContainer }>
                    <input type="number"
                           value={ this.state.digit }
                           onChange={ e => this.setDigit( e.currentTarget.value ) }/>
                    <Link to={ "/experiment/pi/result/" +  ( this.state.digit || "1" ) } className={ styles.submit }>
                        <i className="material-icons">arrow_forward</i>
                    </Link>
                </div>

                <div className={ `${ sharedStyles.experiment } ${ styles.experiment }` }>
                    <a href="https://showcase.withgoogle.com/experiments">a Google Cloud experiment</a>
                    &nbsp;&bull;&nbsp;
                    <a href="https://policies.google.com/privacy?hl=en-US" target="_blank">Policy</a>
                </div>
            </div>
        );
    }

    private setDigit( value: string ) {
        if ( !value ) {
            return this.setState( { digit: "" } );
        }

        let digit = value.split( "" )
            .filter( a => !isNaN( parseInt( a ) ) )
            .join( "" )
            .substr( 0, 15 );

        digit = Math.min( Math.max( parseInt( digit || "1" ), 1 ), MAX_VALUE ).toString();

        this.setState( { digit } );
    }
}

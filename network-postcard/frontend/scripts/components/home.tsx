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
import { RouteComponentProps } from "react-router-dom";

import logoImage from "../../assets/logo.svg";
import styles from "../../styles/components/home.css";
import sharedStyles from "../../styles/shared.css";
import { BASE_URL } from "../config";
import { setImage, setOriginal } from "../services/store";
import { prepareImage } from "../services/image";
import { Nextbar } from "./nextbar";


export const Home: React.SFC<RouteComponentProps> = ( props ) => (
    <div className={ styles.page }>
        <Nextbar></Nextbar>
        <img src={ logoImage } />

        <h1>Network Journey</h1>

        <p className="home-intro">
            The Google Cloud network is super fast. We’ll prove it to you.
            <br/><br/>
            Snap a selfie and see how long it takes to travel across our servers located around the globe.
        </p>

        <a className={ classnames( sharedStyles.button ) }
           onClick={ () => loadImage().then( () => props.history.push( `${ BASE_URL }/journey` ) ) }>
            Select Image
        </a>

        <div className={ `${ sharedStyles.experiment } ${ styles.experiment }` }>
            <a href="https://showcase.withgoogle.com/experiments">a Google Cloud experiment</a>
            &nbsp;&bull;&nbsp;
            <a href="https://policies.google.com/privacy?hl=en-US" target="_blank">Privacy</a>
        </div>
    </div>
);

function loadImage(): Promise<void> {
    return new Promise( ( resolve, reject ) => {
        const input = document.createElement( "input" );
        input.type = "file";
        input.accept = "image/*";
        input.style.position = "fixed";
        input.style.top = "0px";
        input.style.left = "10000px";

        document.body.appendChild( input );

        input.click();
        input.addEventListener( "change", () => {
            if ( input.files ) {
                setOriginal( input.files[ 0 ] );

                prepareImage( input.files[ 0 ] ).then( ( blob ) => {
                    setImage( blob );
                    resolve();
                } );
            } else {
                reject();
            }
        } );
    } );
}

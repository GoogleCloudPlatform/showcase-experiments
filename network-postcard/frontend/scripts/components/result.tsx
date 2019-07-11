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
import { Link, RouteComponentProps } from "react-router-dom";

import styles from "../../styles/components/result.css";
import sharedStyles from "../../styles/shared.css";
import { BASE_URL } from "../config";
import { getImage, hasImage, getResult, getTime, getOriginal } from "../services/store";
import { WorldMap } from "./map";
import { ShareButton } from "./share-button";


interface ResultState {
    hasOverlay: boolean;
    locationName?: string;
    profile?: string;
}

export class Result extends React.Component<RouteComponentProps, ResultState> {
    state: ResultState = {
        hasOverlay: false,
    };

    componentDidMount() {
        if ( hasImage() ) {
            this.setState( { profile: URL.createObjectURL( getOriginal() ) } );
        } else {
            this.props.history.push( `${ BASE_URL }` );
        }
    }

    render() {
        return (
            <div className={ styles.page }>
                <div className={ styles.image } style={ { backgroundImage: `url(${ this.state.profile })` } }></div>

                <p>Your trip took  { getTime().toFixed( 2 ) } seconds.</p>

                <div className={ styles.map }>
                    <WorldMap type="pin" steps={ 8 } />
                </div>

                <div className={ styles.buttonWrapper }>
                    <ShareButton />
                    <Link to={ `${ BASE_URL }/journey` } className={ classnames( sharedStyles.button, styles.again ) }>
                        Try again
                    </Link>
                </div>

                <div className={ `${ sharedStyles.experiment } ${ styles.experiment }` }>
                    <a href="https://showcase.withgoogle.com/experiments">a Google Cloud experiment</a>
                    &nbsp;&bull;&nbsp;
                    <a href="https://policies.google.com/privacy?hl=en-US" target="_blank">Privacy</a>
                </div>

                <img className={ styles.resultImage } src={ getResult() }/>
            </div>
        );
    }
}

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
import { RouteComponentProps, withRouter } from "react-router";

import sharedStyle from "../../styles/shared.scss";
import { evaluate, Evaluation } from "../services/evaluate";
import { Overlay } from "./overlay";
import { FailureState } from "./failure";
import { HttpError } from "../services/http";
import { fullRoute } from "../config";

interface ButtonState {
    hasOverlay: boolean;
}

class Button extends React.Component<RouteComponentProps & { label: string, inverse?: boolean }, ButtonState> {

    state: ButtonState = {
        hasOverlay: false,
    };

    render() {
        const { label, inverse } = this.props;
        const classes = classnames( sharedStyle.button, sharedStyle.desktop, inverse ? sharedStyle.inverse : null );

        return (
            <>
                { this.state.hasOverlay ? <Overlay /> : null }

                <div className={ classes }
                     onClick={ () => this.uploadFile() }>
                    { label }
                </div>
            </>
        );
    }

    private uploadFile() {
        const input = document.createElement( "input" );
        input.type = "file";
        input.click();
        input.addEventListener( "input", () => {

            if ( input.files ) {
                this.setState( { hasOverlay: true } );

                evaluate( input.files[ 0 ] )
                    .then( ( result: Evaluation.Response ) => {
                        this.props.history.push( fullRoute( `/result/${ result.id }` ) );
                    } )
                    .catch( ( error: HttpError ) => {
                        if ( error.status === 500 && error.error && error.error.indexOf( "warmed up" ) > -1 ) {
                            this.props.history.push( fullRoute( `/error/${ FailureState.WARM_UP }` ) );
                        } else {
                            this.props.history.push( fullRoute( `/error/${ FailureState.ERROR }` ) );
                        }
                    } );
            }
        } );
    }
}

export const UploadButton = withRouter( Button );

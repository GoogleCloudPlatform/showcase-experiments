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
import { RouteChildrenProps } from "react-router";
import { Subscription } from "rxjs";
import classnames from "classnames";

import lowerMouthImage from "../../assets/lower-mouth.svg";
import upperMouthImage from "../../assets/upper-mouth.svg";
import styles from "../../styles/components/camera.scss";
import { fullRoute } from "../config";
import { evaluate, Evaluation } from "../services/evaluate";
import { HttpError } from "../services/http";
import { getStreamUpdate, startCamera, stopCamera } from "../services/webcam";
import { FailureState } from "./failure";
import { Overlay } from "./overlay";
import { VideoOutlet } from "./video-outlet";


interface CameraState {
    isPending: boolean;
    stream?: MediaStream;
    pendingImageUrl?: string;
}

export class Camera extends React.Component<RouteChildrenProps, CameraState> {

    state: CameraState = {
        isPending: false,
    };

    private videoOutlet?: VideoOutlet;
    private subscription?: Subscription;

    componentDidMount() {
        getStreamUpdate().subscribe( ( stream: MediaStream | null ) => {
            this.setState( { stream: stream || undefined } );
        } );

        startCamera();
    }

    componentWillUnmount() {
        if ( this.subscription ) {
            this.subscription.unsubscribe();
            this.subscription = undefined;
        }

        if ( this.state.pendingImageUrl ) {
            URL.revokeObjectURL( this.state.pendingImageUrl );
        }

        stopCamera();
    }

    render() {
        return (
            <div className={ classnames( styles.container, styles.background ) }>
                {
                    this.state.stream ?
                        <VideoOutlet stream={ this.state.stream }
                                     ref={ v => this.videoOutlet = v || undefined }>
                        </VideoOutlet> :
                        <div className={ styles.background }></div>
                }
                {
                    this.state.isPending ? (
                        <div className={ styles.loadingContainer }>
                            <img src={ this.state.pendingImageUrl }
                                 className={ styles.pendingImage }/>
                        </div>
                    ) : null
                }

                <img src={ upperMouthImage } width="100%" className={ styles.upperMouth }/>
                <img src={ lowerMouthImage } width="100%" className={ styles.lowerMouth }/>

                <div className={ styles.trigger } onClick={ () => this.snapshot() }></div>

                { this.state.isPending ? <Overlay /> : null }
            </div>
        );
    }

    private snapshot() {
        if ( ! this.videoOutlet ) {
            return;
        }

        this.videoOutlet.captureFrame().then( ( blob: Blob ) => {
            const url = URL.createObjectURL( blob );

            this.setState( {
                isPending: true,
                pendingImageUrl: url,
            } );

            evaluate( blob )
                .then( ( result: Evaluation.Response ) => {
                    this.props.history.push( fullRoute( `/result/${ result.id }` ) );
                } )
                .catch( ( error: HttpError ) => {
                    const errorType = error.status === 500 && error.error && error.error.indexOf( "warmed up" ) > -1 ?
                        FailureState.WARM_UP : FailureState.ERROR;

                    this.props.history.push( fullRoute( `/error/${ errorType }` ) );
                } );
        } );
    }
}

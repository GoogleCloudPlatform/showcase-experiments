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
import { Link } from "react-router-dom";
import { Subscription } from "rxjs";

import styles from "../../styles/components/camera.css";
import { BASE_URL } from "../config";
import { setImage } from "../services/store";
import { getStreamUpdate, startCamera, stopCamera } from "../services/webcam";
import { VideoOutlet } from "./video-outlet";

interface CameraState {
    stream?: MediaStream;
    image?: string;
}

export class Camera extends React.Component<RouteChildrenProps, CameraState> {

    state: CameraState = {};

    private subscription?: Subscription;
    private videoOutlet?: VideoOutlet;

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

        if ( this.state.image ) {
            URL.revokeObjectURL( this.state.image );
        }

        stopCamera();
    }

    render() {
        return (
            <div className={ styles.page }>
                {
                    this.state.stream ?
                        <VideoOutlet stream={ this.state.stream }
                                     ref={ v => this.videoOutlet = v || undefined }>
                        </VideoOutlet> : null
                }

<               div className={ styles.cameraTrigger } onClick={ () => this.snapshot() }></div>

                {
                    this.state.image ?
                        <div className={ styles.overlay }>
                            <img src={ this.state.image } width="100%" />
                            <Link to={ `${ BASE_URL }/journey` } className={ styles.send }>
                                <i className="material-icons">send</i>
                                Send picture
                            </Link>

                            <div className={ styles.retake }
                                 onClick={ () => this.setState( { image: undefined } ) }>
                                Retake
                            </div>
                        </div> :
                        null
                }

            </div>
        );
    }

    private snapshot() {
        if ( ! this.videoOutlet ) {
            return;
        }

        this.videoOutlet.captureFrame().then( ( blob: Blob ) => {
            setImage( blob );

            this.setState( { image: URL.createObjectURL( blob ) } );
        } );
    }
}

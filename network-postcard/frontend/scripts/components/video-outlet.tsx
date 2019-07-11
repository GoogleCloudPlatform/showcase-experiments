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

interface VideoOutletProps {
    stream: MediaStream;
}

export class VideoOutlet extends React.Component<VideoOutletProps> {

    private videoElement?: HTMLVideoElement;

    componentDidMount(): void {
        if ( this.videoElement ) {
            this.videoElement.srcObject = this.props.stream;
        }
    }

    render(): JSX.Element {
        return (
            <div className="container">
                <video ref={ r => this.videoElement = r || undefined }
                       autoPlay={ true }
                       className="container"
                       style={ { objectFit: "cover" } } />
            </div>
        );
    }

    captureFrame(): Promise<Blob> {
        if ( !this.videoElement ) {
            return Promise.reject();
        }

        // TODO(roboshoes): We should try if we can simply load the webcam in a resolution we need
        // instead of cutting the image out in retrospect.

        const canvas = document.createElement( "canvas" );
        const context = canvas.getContext( "2d" )!;
        const rect = this.videoElement.getBoundingClientRect();

        canvas.width = rect.width;
        canvas.height = rect.height;

        const videoSize = {
            width: this.videoElement.videoWidth,
            height: this.videoElement.videoHeight,
        };

        // TODO(roboshoes): This calculation only works if the image is scaled up to fit
        // vertically. Make sure to check scale first.
        const scalePercent = canvas.height / videoSize.height;
        const coveredPercent = canvas.width / ( videoSize.width * scalePercent );
        const coveredPixel = videoSize.width * coveredPercent;
        const sx = videoSize.width / 2 - coveredPixel / 2;

        context.drawImage(
            this.videoElement,
            sx, 0, coveredPixel, videoSize.height,
            0, 0, canvas.width, canvas.height,
        );

        return new Promise<Blob>( ( resolve, reject ) => {
            canvas.toBlob( b => b ? resolve( b ) : reject(), "image/png" );
        } );
    }
}

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

import { BehaviorSubject } from "rxjs";

const subject = new BehaviorSubject<MediaStream | null>( null );
const MEDIA_OPTIONS = {
    audio: false,
    video: {
        facingMode: { exact: "environment" }
    }
};
const MEDIA_OPTIONS_FALLBACK = {
    audio: false,
    video: true,
};

export function startCamera(): Promise<void> {
    if ( hasCamera() ) {
        return navigator.mediaDevices.getUserMedia( MEDIA_OPTIONS )
            .then( ( value: MediaStream ) => {
                subject.next( value );
            } )
            .catch( () => {
                return navigator.mediaDevices.getUserMedia( MEDIA_OPTIONS_FALLBACK )
                    .then( ( value: MediaStream ) => {
                        subject.next( value );
                    } );
            } );
    } else {
        return Promise.reject();
    }
}

export function stopCamera() {
    if ( subject.value ) {
        subject.value.getTracks().forEach( track => track.stop() );
        subject.next( null );
    }
}

export function getCameraStream(): MediaStream | null {
    return subject.value || null;
}

export function getStreamUpdate(): BehaviorSubject<MediaStream | null> {
    return subject;
}

function hasCamera(): boolean {
    return !!( navigator.mediaDevices && navigator.mediaDevices.getUserMedia );
}

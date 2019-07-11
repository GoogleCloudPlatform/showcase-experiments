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
import "firebase/firestore";

import firebase, { firestore } from "firebase/app";
import { Subject } from "rxjs";
import { setResult } from "./store";


firebase.initializeApp( {
    // apiKey: '### FIREBASE API KEY ###',
    // authDomain: '### FIREBASE AUTH DOMAIN ###',
    projectId: "gcprelay-next"
} );

const db: firestore.Firestore = firebase.firestore();

export interface JourneyHop {
    step: number;
    time: number;
    image: string;
}

export function sendImage( blob: Blob ): Subject<JourneyHop> {
    const subject = new Subject<JourneyHop>();
    const id = Math.round( Math.random() * 1000000000 ).toString();
    let max = -1;
    let latestImage = "";
    let isFirst = true;
    let startTime = Date.now();

    const removeListener = db.collection( "routes" ).doc( id ).onSnapshot( ( doc ) => {
        const data = doc.data() as SnapshotData | undefined;

        if ( ! data ) {
            return;
        }

        if ( isFirst && data.AllNodes.length === Object.keys( data.Nodes ).length ) {
            isFirst = false;
            return;
        }

        const previousMax = max;

        max = Math.max(
            max,
            Object.keys( data.Nodes ).reduce( ( previous, x ) => Math.max( parseInt( x, 10 ), previous ), 0 )
        );

        if ( max > previousMax ) {
            latestImage = `data:image/png;base64,${ data.Postcard }`;
        }

        if ( previousMax !== max ) {
            subject.next( {
                step: max,
                time: Date.now() - startTime,
                image: latestImage || "",
            } );
        }

        if ( max === 8 ) {
            setResult( `data:image/png;base64,${ data.Postcard }` );
            subject.complete();
            removeListener();
        }
    } );

    blobToDataURL( blob ).then( body => {
        fetch( `https://entrypoint.gcprelay.net/relay?init=true&id=${ id }`, {
            method: "POST",
            body,
            mode: "cors",
        } );

        startTime = Date.now();
    } );

    return subject;
}

function blobToDataURL( blob: Blob ): Promise<string> {
    return new Promise( resolve => {
        const reader = new FileReader();
        reader.readAsDataURL( blob );
        reader.onload = () => {
            const header = "data:image/png;base64,";
            resolve( ( reader.result as string ).substr( header.length ) );
        };
    } );
}

interface Timestamp {
    seconds: number;
    nanoseconds: number;
}

interface Node {
    Host: { Endpoint: string, Name: string, Private: string };
    In: Timestamp;
    Out: Timestamp;
    Slot: number;
}

interface SnapshotData {
    LastUpdate: Timestamp;
    ID: string;
    Initialized: boolean;
    AllNodes: Node[];
    Nodes: { [ key: number ]: Node };
    Postcard: string;
    Total: {
        Destination: Node,
        Duration: number,
        Nanoseconds: number,
        Origin: Node,
        Seconds: number
    };
}

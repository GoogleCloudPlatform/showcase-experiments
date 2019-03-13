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

export interface HttpError {
    status: number;
    error?: string;
}

export function postImage( blob: Blob, url: string ): Promise<string> {
    return new Promise( ( resolve, reject ) => {
        const form = new FormData();
        form.append( "image", blob, "image.png" );

        const xhr = new XMLHttpRequest();
        xhr.open( "POST", url );
        xhr.send( form );
        xhr.onload = function() {

            if ( xhr.status >= 200 && xhr.status < 300 ) {
                resolve( xhr.responseText );
            } else {
                reject( { status: xhr.status, error: xhr.responseText } as HttpError );
            }
        };
    } );
}

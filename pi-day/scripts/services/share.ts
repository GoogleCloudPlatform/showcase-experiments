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

const TWITTER_SHARE_URL = "https://twitter.com/intent/tweet?";
const TWITTER_POPUP_SETTINGS = "scrollbar=0,height=253,width=600";

const FACEBOOK_SHARE_URL = "https://www.facebook.com/dialog/share?";
const FACEBOOK_APP_ID = "2290016707907300";
const FACEBOOK_POPUP_SETTINGS = "height=500,width=700";

const input = document.createElement( "input" );

export function tweet( text: string, url: string = document.location.href ) {
    const params = `text=${ encodeURIComponent( text ) }`;

    window.open( `${ TWITTER_SHARE_URL }${ params }`, "_blank", TWITTER_POPUP_SETTINGS );
}

export function facebookShare( url: string = document.location.href ) {
    const params = `app_id=${ FACEBOOK_APP_ID }&display=popup&href=${ encodeURIComponent( url ) }`

    window.open( `${ FACEBOOK_SHARE_URL }${ params }`, "_blank", FACEBOOK_POPUP_SETTINGS );
}

export function copyToClipboard( text: string = document.location.href ) {
    input.value = text;

    document.body.appendChild( input );

    input.focus();
    input.select();

    document.execCommand( "copy" );
    document.body.removeChild( input );
}

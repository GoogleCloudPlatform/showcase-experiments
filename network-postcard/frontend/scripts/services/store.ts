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

let image: Blob | undefined;
let original: Blob | undefined;
let result = "";
let time = 0;

export function setOriginal( value: Blob ) {
    original = value;
}

export function getOriginal(): Blob {
    return original || new Blob();
}

export function setImage( value: Blob ) {
    image = value;
}

export function hasImage(): boolean {
    return !!image;
}

export function getImage(): Blob {
    return image || new Blob();
}

export function setResult( value: string ) {
    result = value;
}

export function getResult(): string {
    return result;
}

export function setTime( value: number ) {
    time = value;
}

export function getTime() {
    return time;
}

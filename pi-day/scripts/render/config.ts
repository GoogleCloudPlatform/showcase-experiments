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

export interface Attempt {
    amount: number;
    size: number;
}

export const distribution: Attempt[] = [
    {
        amount: 5,
        size: 10,
    },
    {
        amount: 5,
        size: 9,
    },
    {
        amount: 30,
        size: 7,
    },
    {
        amount: 100,
        size: 5
    },
    {
        amount: -1,
        size: 10,
    },
    {
        amount: -1,
        size: 5,
    },
    {
        amount: -1,
        size: 2,
    },
    {
        amount: -1,
        size: 1,
    }
];

export const coverDistribution: Attempt[] = [
    {
        amount: 10,
        size: 12,
    },
    {
        amount: 10,
        size: 10
    },
    {
        amount: -1,
        size: 5,
    },
    {
        amount: -1,
        size: 2,
    },
    {
        amount: -1,
        size: 1,
    }
]

export const backgroundColor = "white";
export const drawColor = "#eee";
export const blueColor = "#4285f4";
export const redColor = "rgba( 234, 67, 51, 0.67 )";
export const yellowColor = "rgba( 250, 187, 5, 0.6 )";

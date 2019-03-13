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

export interface StatsParams {
    tag: string,
    firstWord?: string,
    questionMark?: string,
    weekday?: string,
    accountCreation?: string,
    questionLength?: string,
    hour?: string,
}

export interface StatsAnser {
    minutes: number,
    probability_of_answer: number,
    probabiliy_of_downvote: number,
}

/**
 * Calls the backend and returns a url of a generated video. If this isn't possible the
 * promise fails.
 */
export function getStats( params: StatsParams ): Promise<StatsAnser> {
    let query = `?tag=${ params.tag }` +
        `&first_word=${ params.firstWord || "i" }` +
        `&ends_question=${ params.questionMark || "false" }` +
        `&weekday_utc=${ params.weekday || "Monday" }` +
        `&account_creation_year=${ params.accountCreation || "2018" }` +
        `&question_length=${ params.questionLength || "short" }` +
        `&hour_utc=${ params.hour || "0" }`;

    return fetch( `${ location.origin }/experiment/bqml-stackoverflow/api/query${ query }` )
        .then( response => response.json() );
}

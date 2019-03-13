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

import { tags } from "./tags";

export type QuestionID = "weekday" | "tag" | "questionMark" | "weekday" | "accountCreation" | "questionLength" | "hour" | "firstWord";

export interface Question {
    question: string;
    answer: string[];
    fullsize: boolean;
    mobile: boolean;
    dropdown: boolean;
    id: QuestionID;
}

export const questions: Question[] = [
    {
        question: "What is today",
        answer: [ "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday" ],
        fullsize: true,
        mobile: false,
        dropdown: false,
        id: "weekday",
    },
    {
        question: "What's the time (in UTC, please)",
        answer: [
            "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11",
            "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23",
        ],
        mobile: false,
        dropdown: true,
        fullsize: false,
        id: "hour",
    },
    {
        question: "Length of question",
        answer: [ "short", "medium", "long" ],
        mobile: true,
        fullsize: false,
        dropdown: false,
        id: "questionLength",
    },
    {
        question: "Ends with question mark",
        answer: [ "true", "false" ],
        mobile: true,
        fullsize: false,
        dropdown: false,
        id: "questionMark",
    },
    {
        question: "First word in title",
        answer: [ "why", "is", "i", "how", "what", "can" ],
        mobile: true,
        fullsize: false,
        dropdown: false,
        id: "firstWord",
    },
    {
        question: "Creation of StackOverflow Account",
        answer: [ "2018", "2017", "2016", "2015", "2014", "2013" ],
        mobile: false,
        fullsize: false,
        dropdown: false,
        id: "accountCreation",
    },
    {
        question: "Tag used",
        answer: tags,
        mobile: true,
        dropdown: true,
        fullsize: false,
        id: "tag",
    }
];

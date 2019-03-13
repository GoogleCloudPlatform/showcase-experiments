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
import { RouteComponentProps } from "react-router";
import classnames from "classnames";
import sharedStyle from "../../styles/shared.scss";
import styles from "../../styles/components/failure.scss";
import yuckImage from "../../assets/dislike.gif";
import { Link } from "react-router-dom";
import { fullRoute } from "../config";

type Props = RouteComponentProps<{ id?: FailureState }>;

export enum FailureState {
    WARM_UP = "warm-up",
    ERROR = "error",
}

export const Failure: React.SFC<Props> = ( props: Props ) => (
    <div className={ styles.page }>
        <img src={ yuckImage } width="250"/>

        <p className={ styles.warning }>{ getErrorMessage( props.match.params.id ) }</p>

        <Link to={ fullRoute( "/" ) } className={ classnames( sharedStyle.button, styles.button ) }>
            Home
        </Link>

        <div className={ sharedStyle.experiment }>
            <a href="https://showcase.withgoogle.com/experiments">a Google Cloud experiment</a>
            &nbsp;&bull;&nbsp;
            <a href="https://policies.google.com/privacy?hl=en" target="_blank">Privacy</a>
        </div>
    </div>
);

function getErrorMessage( code = FailureState.ERROR ): string {
    return {
        [ FailureState.WARM_UP ]: "The server needs to warm up the model. Check back in soon.",
        [ FailureState.ERROR ]: "Something went wrong. Sorry about that.",
    }[ code ];
}

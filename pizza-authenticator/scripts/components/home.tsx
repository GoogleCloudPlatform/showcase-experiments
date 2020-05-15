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
import classnames from "classnames";
import { RouteChildrenProps } from "react-router";

import styles from "../../styles/components/home.scss";
import sharedStyles from "../../styles/shared.scss";
import { UploadButton } from "./button-upload";
import instructionsGif from "../../assets/instructions.gif";
import { gaEvent } from "../services/ga";

export const Home: React.SFC<RouteChildrenProps> = () => (
   
    <div className={ classnames( styles.page, sharedStyles.page ) }>
        { gaEvent( { event: "pageview", path: location.pathname } ) }
        
        <img src={ instructionsGif } width="250" />

        <h1 className={ styles.title }>Pizza<br/>Authenticator</h1>

        <p className={ styles.paragraph }>
            Hi. I'm the pizza authenticator. I can tell what pizza you're eating
            because I've had every kind there is.
            <br/><br/>
            Let's see what you've got!
        </p>

        <UploadButton label="UPLOAD A PICTURE" />

        <div className={ styles.experiment }>
            <a href="https://showcase.withgoogle.com/experiments">a Google Cloud experiment</a>
            &nbsp;&bull;&nbsp;
            <a href="https://policies.google.com/privacy?hl=en" target="_blank">Privacy</a>
        </div>
    </div>
);

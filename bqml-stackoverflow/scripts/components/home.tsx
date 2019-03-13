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
import { Link } from "react-router-dom";

import styles from "../../styles/components/home.scss";
import sharedStyles from "../../styles/shared.scss";
import headerImage from "../../assets/header-mobile.svg";
import headerDesktopImage from "../../assets/header-desktop.svg";

export class Home extends React.Component {
    render() {
        return (
            <div className={ styles.page }>
                <img src={ headerImage } className={ sharedStyles.mobile } />
                <img src={ headerDesktopImage } className={ sharedStyles.desktop } />

                <h1>BQML Analyzer</h1>

                <p>
                    Search through stack overflow data to predict when your questions will be answered.
                </p>

                <Link to="/experiment/bqml-stackoverflow/insights" className={ sharedStyles.button }>
                    Let's go
                </Link>

                <div className="experiment">
                    <a href="https://showcase.withgoogle.com/experiments">a Google Cloud experiment</a>
                    &nbsp;&bull;&nbsp;
                    <a href="https://policies.google.com/privacy?hl=en" target="_blank">Privacy</a>
                </div>
            </div>
        )
    }
}

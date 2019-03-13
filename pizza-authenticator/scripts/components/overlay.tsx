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
import ReactCSSTransitionGroup from "react-addons-css-transition-group";

import styles from "../../styles/components/overlay.scss";
import chewingImage from "../../assets/analysing.gif";

export const Overlay = () => (
    <ReactCSSTransitionGroup transitionName="overlay"
                             transitionEnter={ false }
                             transitionLeave={ false }
                             transitionAppear={ true }
                             transitionAppearTimeout={ 500 }
                             transitionLeaveTimeout={ 500 }>
        <div className={ styles.page }>
            <img src={ chewingImage } className={ styles.image } width="250" />
            <p>Let me chew on that.</p>
        </div>
    </ReactCSSTransitionGroup>
);

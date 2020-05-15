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

import React, { Component } from "react";
import { render } from "react-dom";
import { BrowserRouter as Router, Redirect, Route, Switch, RouteComponentProps } from "react-router-dom";

import { Camera } from "./components/camera";
import { Failure } from "./components/failure";
import { Home } from "./components/home";
import { Result } from "./components/result";
import { Share } from "./components/share";
import { fullRoute } from "./config";
import { Nextbar } from "./components/nextbar";

const App: React.SFC = () => (
    <Router>
        <div style={ { width: "100%", height: "100%" } }>
            <Switch>
                <Route exact path={ fullRoute( "/" ) } component={ Home } />
                <Route path={ fullRoute( "/share" ) } component={ Share } />
                <Route path={ fullRoute( "/camera" ) } component={ Camera } />
                <Route path={ fullRoute( "/result/:id" ) } component={ Result } />
                <Route path={ fullRoute( "/error/:id" ) } component={ Failure } />
                <Route render={ () => <Redirect to={ fullRoute( "/" ) } /> }/>
            </Switch>
            <a className="opensource"
               target="_blank"
               href="https://github.com/GoogleCloudPlatform/showcase-experiments/tree/master/pizza-authenticator">
                <i className="fab fa-github"></i>
            </a>
            <Nextbar></Nextbar>
        </div>
    </Router>
);

render( <App/>, document.getElementById( "root" ) );

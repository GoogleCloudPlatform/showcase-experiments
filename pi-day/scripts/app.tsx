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
import { render } from "react-dom";
import { BrowserRouter, Redirect, Route, Switch } from "react-router-dom";

import { Generate } from "./components/generate";
import { Home } from "./components/home";
import { Result } from "./components/result";

const App: React.SFC = () => (
    <BrowserRouter>
        <>
            <Switch>
                <Route path="/experiment/pi/" exact component={ Home } />
                <Route path="/experiment/pi/generate" component={ Generate } />
                <Route path="/experiment/pi/result/" component={ Result } />
                <Route render={ () => <Redirect to="/experiment/pi/" /> } />
            </Switch>
            <a className="opensource"
               target="_blank"
               href="https://github.com/GoogleCloudPlatform/showcase-experiments/tree/master/pi-day">
                <i className="fab fa-github"></i>
            </a>
        </>
    </BrowserRouter>
)


render( <App />, document.getElementById( "root" ) );

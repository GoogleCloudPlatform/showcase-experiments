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
import { BrowserRouter as Router, Redirect, Route, Switch } from "react-router-dom";

import { Home } from "./components/home";
import { Insights } from "./components/insights";

const App: React.SFC = () => (
    <Router>
        <>
            <Switch>
                <Route exact path="/experiment/bqml-stackoverflow/" component={ Home } />
                <Route path="/experiment/bqml-stackoverflow/insights" component={ Insights } />
                <Route render={ () => <Redirect to="/experiment/bqml-stackoverflow/" /> }/>
            </Switch>
            <a className="opensource"
               target="_blank"
               href="https://github.com/GoogleCloudPlatform/showcase-experiments/tree/master/bqml-stackoverflow">
                <i className="fab fa-github"></i>
            </a>
        </>
    </Router>
);

render( <App/>, document.getElementById( "root" ) );

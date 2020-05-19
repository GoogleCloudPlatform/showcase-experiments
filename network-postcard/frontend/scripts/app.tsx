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

import { Camera } from "./components/camera";
import { Home } from "./components/home";
import { Journey } from "./components/journey";
import { Result } from "./components/result";
import { BASE_URL } from "./config";
import { setImage } from "./services/store";


const App: React.SFC = () => (
    <Router>
        <Switch>
            <Route exact path={ `${ BASE_URL }/` } component={ Home } />
            <Route exact path={ `${ BASE_URL }/camera` } component={ Camera } />
            <Route exact path={ `${ BASE_URL }/journey` } component={ Journey } />
            <Route exact path={ `${ BASE_URL }/result` } component={ Result } />
            <Route render={ () => <Redirect to={ `${ BASE_URL }/` } /> } />
        </Switch>
        
    </Router>
    
);

render( <App/>, document.getElementById( "root" ) );

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

import classnames from "classnames";
import React from "react";
import { Link, RouteComponentProps, withRouter } from "react-router-dom";

import sharedStyle from "../../styles/shared.scss";
import { fullRoute } from "../config";
import { startCamera } from "../services/webcam";

const Button: React.SFC<RouteComponentProps & { label: string, inverse?: boolean }> = ( { label, inverse } ) => (
    <Link to={ fullRoute( "/camera" ) }
          className={ classnames( sharedStyle.button, sharedStyle.mobile, inverse ? sharedStyle.inverse : null ) }>
        { label }
    </Link>
);

export const CameraButton = withRouter( Button );

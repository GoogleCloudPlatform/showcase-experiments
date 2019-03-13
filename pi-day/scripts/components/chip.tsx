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

import { renderChip, renderGif } from "../render/chip";

interface ChipRenderProps {
    digits: string
}

export class ChipRender extends React.Component<ChipRenderProps> {

    state: { url?: string } = {}

    constructor( props: ChipRenderProps ) {
        super( props );

        const digits = parseInt( this.props.digits, 10 );

        // renderGif( digits, 1000 ).then( blob => {
        //     this.setState( { url: URL.createObjectURL( blob ) } );
        // } );
    }

    render() {
        return <img src={ this.state.url } width="100%" />;
    }
};

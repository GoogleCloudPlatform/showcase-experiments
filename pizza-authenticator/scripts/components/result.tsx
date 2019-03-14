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
import { RouteComponentProps } from "react-router-dom";

import style from "../../styles/components/result.scss";
import yuckImage from "../../assets/dislike.gif";
import { Evaluation, getResult, isPizza } from "../services/evaluate";
import { ValidPizzaResult } from "./result-valid-pizza";
import { UploadButton } from "./button-upload";
import { gaEvent } from "../services/ga";
import { UnregisterCallback } from "history";

type ResultProps = RouteComponentProps<{ id: string }>;

interface ResultState {
    notPizza: boolean;
    isPending: boolean;
    response: Evaluation.Response | null;
    hasNoResult: boolean;
}

export class Result extends React.Component<ResultProps, ResultState> {

    state: ResultState = {
        notPizza: false,
        response: null,
        isPending: true,
        hasNoResult: false,
    };

    private unlisten: UnregisterCallback;

    constructor( props: ResultProps ) {
        super( props );

        this.unlisten = props.history.listen( () => {
            this.update();
        } );

        this.update();
    }

    private update() {
        getResult( this.props.match.params.id ).then( ( response ) => {
            this.setState( {
                response,
                notPizza: !isPizza( response ),
                isPending: false,
                hasNoResult: !response
            } );
        } );
    }

    componentDidMount() {
        gaEvent( { event: "pageview", path: location.pathname } );
    }

    componentWillUnmount() {
        this.unlisten();
    }

    render(): JSX.Element {
        const { response, notPizza, isPending, hasNoResult } = this.state;
        const hasResult = ! hasNoResult;
        const hasPizza = ! notPizza;

        return (
            <div className={ classnames( style.page, hasResult && hasPizza ? style.validPizza : null ) }>
                {
                    isPending ?
                        <div>Loading ...</div> :
                        (
                            hasNoResult ?
                                <EmptyResult /> :
                                <>
                                    { notPizza ?
                                        <NoPizzaResult /> :
                                        <ValidPizzaResult response={ response! } />
                                    }
                                </>
                        )
                }
            </div>
        );
    }
}

const NoPizzaResult = React.memo( () => (
    <div className={ style.noPizzaContainer}>
        <img src={ yuckImage } width="250" />

        <h1>Yuck!</h1>

        <p>That doesn't seem like Pizza at all.</p>

        <div className={ style.buttonContainer }>
            <UploadButton label={ "CHECK DIFFERENT SLICE" } />
        </div>
    </div>
) );

const EmptyResult = React.memo( () => (
    <p>404 - No result found</p>
) );

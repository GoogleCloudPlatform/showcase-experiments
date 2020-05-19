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
import { RouteComponentProps } from "react-router";

import styles from "../../styles/components/journey.css";
import sharedStyles from "../../styles/shared.css";
import { BASE_URL } from "../config";
import { JourneyHop, sendImage } from "../services/network";
import { getImage, hasImage, setTime } from "../services/store";
import { nodePositions, WorldMap } from "./map";
import { Nextbar } from "./nextbar";


interface JourneyState {
    image?: string;
    intermediate?: string;
    steps: number;
    time: string;
    preparing: boolean;
    stops: Array<{ name: string, time: string }>;
}

export class Journey extends React.Component<RouteComponentProps, JourneyState> {

    state: JourneyState = {
        steps: 0,
        time: "0:00",
        stops: [],
        preparing: true,
    };

    private map: WorldMap | null = null;

    constructor( props: RouteComponentProps ) {
        super( props );

        if ( ! hasImage() ) {
            this.props.history.push( "/" );
            return;
        }
    }

    componentWillUnmount() {
        if ( this.state && this.state.image ) {
            URL.revokeObjectURL( this.state.image );
        }
    }

    componentDidMount() {
        let seconds = Date.now();
        let timerStarted = false;
        const timer = () => {
            const delta = ( Date.now() - seconds ) / 1000;

            this.setState( {  time: delta.toFixed( 2 ) } );

            if ( this.state.steps < 8 ) {
                requestAnimationFrame( timer );
            } else {
                setTime( delta );

                setTimeout( () => {
                    this.props.history.push( `${ BASE_URL }/result` );
                }, 200 );
            }
        };

        sendImage( getImage() ).subscribe( ( hop: JourneyHop ) => {
            if ( !timerStarted ) {
                seconds = Date.now();
                timerStarted = true;
                this.setState( { preparing: false } );
                timer();
            }

            if ( hop.step >= 6 && this.map ) {
                this.map.scrollRight();
            }

            this.setState( { steps: hop.step, intermediate: hop.image} );
            this.extendList( hop.step );
        } );
    }

    render() {
        return (
            <div className={ styles.page }>
                <Nextbar></Nextbar>
                <div className={ styles.map }>
                    <WorldMap type="pin" steps={ this.state.steps } ref={ m => this.map = m }/>
                </div>

                <img className={ styles.preview } src={ this.state.intermediate } />

                <div className={ styles.list }>
                    <p>Traveling to:</p>
                    <div className={ styles.cityContainer }>
                        <div className={ styles.cities }>
                            {
                                this.state.stops.map( ( city, i ) => (
                                    <div className={ styles.cityLine } key={ i }>
                                        <span>{ city.name }</span>
                                        <span>{ city.time }s</span>
                                    </div>
                                ) )
                            }
                        </div>
                    </div>
                </div>

                <div className={ styles.counter }>
                    { this.state.preparing ?
                        <span>Preparing</span> :
                        <span>{ this.state.time }<span className={ styles.sec }>sec</span></span>
                    }
                </div>

                <div className={ `${ sharedStyles.experiment } ${ styles.experiment }` }>
                    <a href="https://showcase.withgoogle.com/experiments">a Google Cloud experiment</a>
                    &nbsp;&bull;&nbsp;
                    <a href="https://policies.google.com/privacy?hl=en-US" target="_blank">Privacy</a>
                </div>

            </div>
        );
    }

    private extendList( to: number ) {
        const results = this.state.stops;

        for ( let i = results.length; i <= to; i++ ) {
            results.push( {
                name: nodePositions[ i ].id,
                time: this.state.time,
            } );
        }

        this.setState( { stops: results } );
    }
}

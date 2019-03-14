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

import React, { Fragment } from "react";
import classnames from "classnames";
import styles from "../../styles/components/insights.scss";
import { RouteComponentProps } from "react-router";
import circleImage from "../../assets/circle.svg";
import { questions, Question, QuestionID } from "../data/questions";
import { ShareButton } from "./share-button";
import { getStats, StatsParams } from "../services/api";

class QuestionLogic implements Question {
    selected: string;
    question: string;
    answer: string[];
    fullsize: boolean;
    dropdown: boolean;
    mobile: boolean;
    id: QuestionID;

    constructor( question: Question,
                 private callback: () => void ) {
        this.question = question.question;
        this.answer = question.answer;
        this.fullsize = question.fullsize;
        this.mobile = question.mobile;
        this.dropdown = question.dropdown;
        this.selected = question.answer[ 0 ];
        this.id = question.id;
    }

    select( value: string ) {
        this.selected = value;
        this.callback();
    }
}

interface InsightsState {
    questions: QuestionLogic[],
    hasDropdown: boolean,
    dropdownQuestion?: QuestionLogic | undefined;
    answer: string,
    downvote: string,
    minutes: string,
}

export class Insights extends React.Component<{}, InsightsState> {

    state: InsightsState = {
        questions: [],
        hasDropdown: true,
        dropdownQuestion: undefined,
        minutes: "0:00",
        downvote: "0",
        answer: "0",
    }

    constructor( props: RouteComponentProps ) {
        super( props );

        this.notify = this.notify.bind( this );

        this.state.questions = questions.map( q => new QuestionLogic( q, this.notify ) );
    }

    componentDidMount() {
        this.calculateStats();
    }

    private notify() {
        this.calculateStats();
        this.forceUpdate();
    }

    private resolveDropdown( value: string ) {
        this.state.dropdownQuestion!.select( value );
        this.setState( { dropdownQuestion: undefined, hasDropdown: false } );
    }

    private getValue( id: QuestionID ): string {
        const question = this.state.questions.find( q => q.id === id )
        return question ? question.selected : "";
    }

    private calculateStats() {
        const params: StatsParams = {
            tag: this.getValue( "tag" ),
            accountCreation: this.getValue( "accountCreation" ),
            firstWord: this.getValue( "firstWord" ),
            questionLength: this.getValue( "questionLength" ),
            hour: this.getValue( "hour" ),
            weekday: this.getValue( "weekday" ),
        };

        getStats( params ).then( result => {
            this.setState( {
                minutes: this.formatMinutes( result.minutes ),
                downvote: Math.round( result.probabiliy_of_downvote * 100 ).toString(),
                answer: Math.round( result.probability_of_answer * 100 ).toString(),
            } );
        } );
    }

    private formatMinutes( minutes: number ): string {
        const hours = Math.floor( minutes / 60 );
        let mins = Math.floor( minutes % 60 ).toString();

        mins = mins.length === 1 ? "0" + mins : mins;

        return `${ hours }:${ mins }`;
    }

    render() {
        const { questions, hasDropdown, dropdownQuestion } = this.state;

        return (
            <div className={ styles.page } style={ { backgroundImage: `url( ${ circleImage } )` } }>
                <div className={ styles.answer }>
                    <Answer answer="Chance to get answer" value={ this.state.answer } unit="%" />
                    <Answer answer="Minutes to get answer" value={ this.state.minutes } />
                    <Answer answer="Chance to get downvoted" value={ this.state.downvote } unit="%" />
                </div>

                <div className={ styles.boxes }>
                    {
                        questions.map( ( question, i ) => {
                            return (
                                <div className={ classnames( styles.box, question.fullsize ? styles.fullsize : null, !question.mobile ? styles.desktop : null ) } key={ i }>

                                    <div className={ styles.title }>{ question.question }</div>

                                    { question.dropdown ?
                                        <div className={ classnames( styles.option, styles.selected, styles.dropdownOption ) }
                                             onClick={ () => this.setState( { dropdownQuestion: question, hasDropdown: true } ) }>
                                            { question.selected }
                                            <i className={ classnames( "material-icons", styles.icon ) }>arrow_drop_down</i>
                                        </div> :
                                        <Selection values={ question.answer } selected={ question.selected } select={ v => question.select( v ) } />
                                    }

                                </div>
                            )
                        } )
                    }
                </div>

                <ShareButton classes={ styles.share } text="I found these insights with BQML" />

                <div className="experiment">
                    <a href="https://showcase.withgoogle.com/experiments">a Google Cloud experiment</a>
                    &nbsp;&bull;&nbsp;
                    <a href="https://policies.google.com/privacy?hl=en" target="_blank">Privacy</a>
                </div>

                { hasDropdown && dropdownQuestion ?
                    <Dropdown options={ dropdownQuestion.answer }
                              selected={ dropdownQuestion.selected }
                              onSelected={ v => this.resolveDropdown( v ) } /> :
                    null
                }
            </div>
        );
    }
}

interface SelectionProps {
    values: string[];
    selected: string;
    select: ( value: string ) => void;
}

class Selection extends React.Component<SelectionProps> {
    render() {
        return (
            <div className={ styles.selection }>
                {
                    this.props.values.map( ( option: string, i: number ) => {
                        return (
                            <Fragment key={ i }>
                                { i > 0 ? <div className={ styles.spacer }></div> : null }
                                <div className={ classnames( styles.option, option === this.props.selected ? styles.selected : null ) }
                                     onClick={ () => this.props.select( option ) }>
                                    { option }
                                </div>
                            </Fragment>
                        );
                    } )
                }
            </div>
        );
    }
}

const Answer: React.SFC<{ answer: string, value: string, unit?: string }> = ( { answer, value, unit }) => (
    <div className={ styles.answer }>
        <div className={ styles.column }>
            <div className={ styles.resultType }>{ answer }</div>
            <div className={ styles.resultValue }>{ value }<span className={ styles.resultUnit }>{ unit }</span></div>
        </div>
    </div>
)


interface DropdownProps {
    options: string[];
    selected: string;
    onSelected: ( value: string ) => void;
}

class Dropdown extends React.Component<DropdownProps> {

    state = {
        filter: "",
    }

    render() {
        const { options, selected, onSelected } = this.props;

        return (
            <div className={ styles.dropdown }>
                <div className={ styles.dropdownWrapper}>
                    <div className={ styles.inputWrapper }>
                    <i className="material-icons">search</i>
                        <input type="text" className={ styles.input }
                               placeholder="Search tag"
                               onChange={ e => this.setState( { filter: e.currentTarget.value.toLowerCase() } ) } />
                    </div>

                    <div className={ styles.list }>
                        {
                            options
                                .filter( o => this.isShown( o ) )
                                .map( ( option, i ) => (
                                    <div className={ classnames( styles.choice, option === selected ? styles.chosen : null ) }
                                         key={ i }
                                         onClick={ () => onSelected( option )}>
                                        { option }
                                        <i className={ classnames( "material-icons", styles.icon ) }>check</i>
                                    </div>
                                ) )
                        }
                    </div>
                </div>
            </div>
        );
    }

    private isShown( value: string ): boolean {
        if ( this.state.filter === "" ) {
            return true;
        }

        return value.toLowerCase().indexOf( this.state.filter ) > -1;
    }
}

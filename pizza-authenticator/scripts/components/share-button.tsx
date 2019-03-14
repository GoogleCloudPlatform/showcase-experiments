import React from "react";
import classnames from "classnames";
import sharedStyles from "../../styles/shared.scss";
import { tweet, facebookShare } from "../services/share";

interface ShareButtonProps {
    classes?: string;
    text?: string;
}

const tweetCopy = "Can a machine tell the difference between authentic New York Pizza, Chicago deep " +
    "dish, and everything in between? Find out at g.co/showcase/pizzaauth. @GoogleCloud #showcaseexperiments";

export class ShareButton extends React.Component<ShareButtonProps> {
    state = { active: false };

    render() {
        const classes = classnames(
            sharedStyles.button,
            this.props.classes || "",
            this.state.active ? sharedStyles.active : ""
        );

        return (
            <div className={ classes }
                 onClick={ () => this.setState( { active: true } ) }>
                SHARE
                <div className={ sharedStyles.buttonShareContainer }>
                    <div className={ sharedStyles.buttonShareOption }
                         onClick={ () => tweet( tweetCopy ) }>
                        <i className="fab fa-twitter"></i>
                    </div>
                    <div className={ sharedStyles.buttonShareOption }
                         onClick={ () => facebookShare() }>
                        <i className="fab fa-facebook"></i>
                    </div>
                </div>
            </div>
        );
    }
}

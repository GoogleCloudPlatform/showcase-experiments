import React from "react";
import classnames from "classnames";
import sharedStyles from "../../styles/shared.scss";
import { tweet, facebookShare } from "../services/share";

interface ShareButtonProps {
    classes?: string;
    text?: string;
}

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
                Share
                <div className={ sharedStyles.buttonShareContainer }>
                    <div className={ sharedStyles.buttonShareOption }
                         onClick={ () => tweet( this.props.text || "Check out this out" ) }>
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

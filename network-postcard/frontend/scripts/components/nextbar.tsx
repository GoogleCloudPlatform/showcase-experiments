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

import styles from "../../styles/components/nextbar.css";
import iconImg from "../../assets/nextbar/gcloud-icon.svg";
import textImg from "../../assets/nextbar/gcloud-text.svg";
import shareImg from "../../assets/nextbar/share.svg";
import twitterImg from "../../assets/nextbar/twitter.svg";
import facebookImg from "../../assets/nextbar/facebook.svg";
import linkedinImg from "../../assets/nextbar/linkedin.svg";
import copyImg from "../../assets/nextbar/copy.svg";

export class Nextbar extends React.Component{
    ctaurl = "https://cloud.withgoogle.com/next/sf/next/sf/demos?demo=301";
    state = { showShare: false, cta: this.ctaurl, ctaText: "Try Cloud Vision" };
    
    
    
    render(){
        const { showShare } = this.state;
        return (
            <div className={styles.next20banner}>
                <div className={styles.title} onClick={ () => this.gotoCTA() }>
                    <img className={styles.icon} src={iconImg} />
                    <img className={styles.lockup} src={textImg} />
                    <span className={styles.logotext}>Next</span>
                </div>
                <div className={styles.cta}>
                    <img className={styles.share} height="24" width="24" src={shareImg} onClick={() => this.setState({ showShare: !showShare })}/>
                    { showShare ?
                    <div className={styles.share_box}>
                        <table>
                            <tbody>
                            <tr onClick={ () => this.share_twitter() }><th>Twitter</th><td><img src={twitterImg} /></td></tr>
                            <tr onClick={ () => this.share_facebook() }><th>Facebook</th><td><img src={facebookImg}  /></td></tr>
                            <tr onClick={ () => this.share_linkedin() }><th>LinkedIn</th><td><img src={linkedinImg}  /></td></tr>
                            <tr onClick={ () => this.share_copy() }><th>Copy Link</th><td><img src={copyImg}  /></td></tr>
                            </tbody>
                        </table>
                    </div>
                    : null
                    }
                </div>
            </div>
            
        )
    }

    gotoCTA(){
        location.href=this.state.cta;
    }

    share_twitter(){
        let share_url = "https://twitter.com/intent/tweet?";
        let text = "Check out this demo from Next 20 Showcase: " + this.state.cta;
        let params = `text=${ encodeURIComponent( text ) }`;
        window.open( `${ share_url }${ params }`, "_blank", "scrollbar=0,height=253,width=600" );
    }
    
    
    
    share_facebook(){
        let share_url = "https://www.facebook.com/dialog/share?";
        let facebookid = "2290016707907300";
        let params = `app_id=${ facebookid }&display=popup&href=${ encodeURIComponent( this.state.cta ) }`;
        window.open( share_url + params, "_blank", "height=500,width=700" );
    }
    
    share_linkedin(){
        let url = this.state.cta;
        let title = "Next 20 Showcase";
        let text = "Check out this demo from Next 20 Showcase";
        window.open('http://www.linkedin.com/shareArticle?mini=true&url='+encodeURIComponent(url), '', 'left=0,top=0,width=650,height=420,personalbar=0,toolbar=0,scrollbars=0,resizable=0');
    
    }
    
    share_copy(){
        let dummy = document.createElement('input'),
            text = this.state.cta;
        document.body.appendChild(dummy);
        dummy.value = text;
        dummy.select();
        document.execCommand('copy');
        document.body.removeChild(dummy);
    }
}



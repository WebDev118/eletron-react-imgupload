// @flow
import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { browserHistory } from 'react-router'
import config from '../constants/config';
import  style from './Home.css';
import axios from 'axios';

export default class Login extends Component {
  constructor(props){
    super(props);

    this.state = {
      email: '',
      password: '',
      hasError: false
    }
  }

  onEmailChange = (event) => {
    this.setState({
      email: event.target.value,
    })
  };
  onPasswordChange = (event) => {
    this.setState({
      password: event.target.value,
    })
  };
  handleKeyDown = (e) => {
    if (e.key === 'Enter' && e.shiftKey === false) {
      e.preventDefault();
      this.loginCheck();
    }
  };
  onSubmit = (e) => {
    e.preventDefault();
    this.loginCheck();
  }
  loginCheck = () => {
    var that = this;
    const { email, password } = this.state;
    if(email !== '' && password !== ''){
      axios.get(config.SITEURL+'/select_auth', {
        auth: {
          username: email,
          password: password
        }
      })
      .then(function (response) {
        var status = response.data.status;
        var user = response.data.user;
        if(status === "ok"){
          localStorage.setItem('email', user);
          localStorage.setItem('password', password);
          that.props.props.history.push("/manage");
        }
        else{
          that.setState({hasError: true});
        }
      })
      .catch(function (error) {
        console.log(error);
      });
    }
  }
  render() {
    return (
      <div className={style.limiter}>
         <div className={style.container_login100}>
          <div className={style.wrap_login100}>
            <form className={style.login100_form}>
              <span className={style.login100_form_logo}>
                <i className="fa fa-atom"/>
              </span>
              <span className={style.login100_form_title}>
                Log in
              </span>
              <div>{this.state.hasError && (<p className={style.login_error} >We don't recognize this user.</p>)}</div>
              <div className={style.wrap_input100} data-validate = "Enter username">
                <input className={style.input100} type="email" name="username" placeholder="Username" onChange={this.onEmailChange} onKeyDown={(e) => this.handleKeyDown(e)} required/>
                <span className={style.focus_input100} />
              </div>
              <div className={style.wrap_input100} data-validate = "Enter password">
                <input className={style.input100} type="password" name="pass" placeholder="Password" onChange={this.onPasswordChange} onKeyDown={(e) => this.handleKeyDown(e)} required/>
                <span className={style.focus_input100}/>
              </div>
              <div className={style.container_login100_form_btn}>
                <button className={style.login100_form_btn} onClick={(e) => this.onSubmit(e)} >Login</button>
              </div>
            </form>
          </div>
         </div>
      </div>
    );
  }
}

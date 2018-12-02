// @flow
import React, { Component } from 'react';
import Login from '../components/Login';

export default class LoginPage extends Component {
  constructor(props){
    super(props);
  };
  render() {

    return <Login props = { this.props }/>;
  };
}

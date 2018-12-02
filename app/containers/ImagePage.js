// @flow
import React, { Component } from 'react';
import Image from '../components/Image';

export default class ImagePage extends Component {
  constructor(props){
    super(props);
  };
  render() {
    return <Image props = { this.props }/>;
  };
}

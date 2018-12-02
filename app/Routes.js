import React from 'react';
import { Switch, Route } from 'react-router';
import App from './containers/App';
import LoginPage from './containers/LoginPage';
import Imagepage from './containers/Imagepage';

export default () => (
  <App>
    <Switch>
      <Route path="/manage" component={Imagepage} />
      <Route path="/" component={LoginPage} />
    </Switch>
  </App>
);

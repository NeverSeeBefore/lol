import React, { Component } from "react";

interface IState {}

export default class Home extends Component<{}, IState> {
  state = {};
  render() {
    return (
      <div className="P-not-found">
        <h3>404</h3>
      </div>
    );
  }
}

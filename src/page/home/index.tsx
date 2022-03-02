import { Button } from "antd";
import React, { Component } from "react";
import { useNavigate } from "react-router-dom";

interface IState {}

const Home: React.FunctionComponent = () => {
  const navigate = useNavigate();

  function navigateTo(path: string) {
    navigate(path);
  }

  return (
    <div className="P-home">
      <header>
        <div className="menu"></div>
        <div className="title">blog</div>
        <div className="user">user</div>
      </header>
      <section>
        <Button
          type="primary"
          onClick={() => {
            navigateTo("login");
          }}
        >
          go login
        </Button>
      </section>
    </div>
  );
};

export default Home;

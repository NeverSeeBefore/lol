import { Button } from "antd";
import React, { Component } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../../components/card";
import InDecoration from "../../components/InDecoration";
import Loading from "../../components/loading";
import style from "./index.module.scss";

interface IState {}

const Home: React.FunctionComponent = () => {
  const navigate = useNavigate();

  function navigateTo(path: string) {
    navigate(path);
  }

  return (
    <div className={style.home}>
      {/* <InDecoration></InDecoration> */}
      {/* <Card></Card> */}
      <Loading></Loading>
    </div>
  );
};

export default Home;

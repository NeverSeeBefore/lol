import React from "react";
import style from "./index.module.scss";

const Loading: React.FunctionComponent = () => {
  return (
    <div className={style.loading}>
      <div className={style.animationView}>
          <div className={style.square}></div>
          <div className={style.flower}></div>
      </div>
      <div className={style.tip}>loading, please wait.</div>
    </div>
  );
};

export default Loading;

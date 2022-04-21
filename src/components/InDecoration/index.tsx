import React from "react";
import style from "./index.module.scss";
console.log("in decoration", style);

interface IProps {
  tip?: string;
}

const InDecoration: React.FunctionComponent<IProps> = ({ tip = "in descration,not ready to use" }) => {
  return (
    <div className={style.inDecoration}>
      <div className={style.animationView}>
          <div className={style.animationItem}></div>
          <div className={style.animationItem}></div>
      </div>
      <div className={style.tip}>{tip}</div>
    </div>
  );
};

export default InDecoration;

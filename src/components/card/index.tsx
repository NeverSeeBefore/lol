import React from "react";
import style from "./index.module.scss";
console.log("styles", style);

export default function Card() {
  return (
    <div className={style.card}>
      <img
        className={style.poster}
        src="https://hbimg.huabanimg.com/f3cfe959327146e4eb3483b466fadbc4072fb875a9663-GDXJpW"
        alt=""
      />
      <div className={style.title}>
        <img className={style.icon} src="" alt="" />
        <div className={style.text}>Leagure Of Legends</div>
      </div>
    </div>
  );
}

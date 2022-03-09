import React from "react";
import style from "./index.module.scss";
console.log("styles", style);

export default function Card() {
  return (
    <div className={style.card}>
      <img
        className={style.poster}
        src="https://www.baidu.com/link?url=cTuaq2vuWJnextBzf440MJJKBxws-bSiKKXQMIxIn3NLsz_8G9QgqQThPr_AZHKrpF8a9lEmlZpnI6DKepH9uTOdbgq9oHX2kEAt6JcUE6xC9Q1L-kHeoDsW1NZBOgfYNFT9N7G_HsrRmfEW1Aa3E9haqilnboevddN63Fe4M857wLUXkrfGkCIg0hd5D9e-V9F5MFSL6gE6vKwl2cgmnwpNWpUhTlQkTAf1K_HXiXc4PJzB8OykC5GovQvGUUUzBVSNlOwCOovWp07KMoz7LklEobmIMhJy-bOWT7eCiyYMbZ2MdaykcTnS8ziZuTimRJldQ_S1Gmv_3Qjc0-duhjj_kgLt4Q85D2TE9Y6ehB-2W22Y2GtyMKLFxPWntiTQkP-l2tOATLxJPKZN1F7TCcRnMOCMYv5I_eECJMMGVKF0Bw1zGYAHD3NSWlHRkQQgHerxWcH-LDZoD-LwZO9MZYl3iS1JFpuW1mhI39zzcoW_cPnY7-PDJTiOY_RJj6-0nCQrHxMAGqzQdsFHnh3TbLN_q-JGhiRA4_-P3dvY86wEos-qkOCS3uoWjz0ocV1MKZJnFx0OzlFjY1XwiZSVIpB36oJN5tQwJqzAwu3HsVt3QDLnvlx978lgsTLAowlUajAe-gyi1T1G1P91JkLwnMuQrWv2AnllxHr-hY8zbbtmS-UNi9HsnJe7qPA7Ccrj&wd=&eqid=a64c25d7000c787e00000002621fa1c7"
        alt=""
      />
      <div className={style.title}>
        <img className={style.icon} src="" alt="" />
        <div className={style.text}>Leagure Of Legends</div>
      </div>
    </div>
  );
}

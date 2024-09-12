import React from 'react';
import Nav from '../Nav';
import styles from './index.module.less';
// type Props = any;

export default function Main(props: React.PropsWithChildren) {
  return (
    <div className={styles['main-wrap']}>
      <Nav />
      {props.children}
    </div>
  );
}

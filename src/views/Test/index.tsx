import React from 'react';
import { Outlet } from 'react-router-dom';
import TestNav from './components/TestNav';
import styles from './index.module.less';

interface IProps {}

function Test(props: IProps) {
  console.log('test render');

  return (
    <div className={styles['test-wrap']}>
      <div className={styles['test-nav']}>
        <TestNav />
      </div>
      <div className={styles['test-content']}>
        {/* This element will render either <DashboardMessages> when the URL is
            "/messages", <DashboardTasks> at "/tasks", or null if it is "/"
         */}
        <Outlet />
      </div>
    </div>
  );
}

export default Test;

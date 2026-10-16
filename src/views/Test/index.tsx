import { Outlet } from 'react-router-dom';
import TestNav from './components/TestNav';
import styles from './index.module.less';

function Test() {
  return (
    <div className={styles['test-wrap']}>
      <div className={styles['test-nav']}>
        <TestNav />
      </div>
      <div className={styles['test-content']}>
        <Outlet />
      </div>
    </div>
  );
}

export default Test;

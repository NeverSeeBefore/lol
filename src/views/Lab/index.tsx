import { NavLink, Outlet } from 'react-router-dom';
import { experiments } from './experiments';
import styles from './index.module.less';

export default function Lab() {
  return (
    <div className={styles.layout}>
      <nav className={styles.sidebar} aria-label="实验室导航">
        <div className={styles.heading}>
          <span className={styles.kicker}>EXPLORE / 试验中</span>
          <strong>实验室</strong>
        </div>
        <div className={styles['section-label']}>作品目录</div>
        {experiments.map((experiment) => (
          <NavLink
            key={experiment.path}
            to={experiment.path}
            className={({ isActive }) => (isActive ? `${styles.item} ${styles.active}` : styles.item)}
          >
            <span className={styles.number}>{experiment.number}</span>
            <span>{experiment.name}</span>
          </NavLink>
        ))}
        <div className={styles.footer}>更多小作品，会慢慢长出来。</div>
      </nav>
      <div className={styles.content}>
        <Outlet />
      </div>
    </div>
  );
}

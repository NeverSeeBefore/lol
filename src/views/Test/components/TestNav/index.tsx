import { NavLink } from 'react-router-dom';
import styles from './index.module.less';

export default function TestNav() {
  return (
    <div className={styles['nav-wrap']}>
      <NavLink end to="" className={({ isActive }) => (isActive ? styles.active : undefined)}>
        home
      </NavLink>
      <NavLink to="counter" className={({ isActive }) => (isActive ? styles.active : undefined)}>
        counter
      </NavLink>
      <NavLink to="tween" className={({ isActive }) => (isActive ? styles.active : undefined)}>
        tween
      </NavLink>
      <NavLink to="loading" className={({ isActive }) => (isActive ? styles.active : undefined)}>
        loading
      </NavLink>
      <NavLink to="aaa" className={({ isActive }) => (isActive ? styles.active : undefined)}>
        404
      </NavLink>
      <NavLink to="color-transform" className={({ isActive }) => (isActive ? styles.active : undefined)}>
        ColorTransform
      </NavLink>
    </div>
  );
}

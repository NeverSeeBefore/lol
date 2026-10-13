import React from 'react';
import { NavLink } from 'react-router-dom';
import styles from './index.module.less';

export default function Nav() {
  return (
    <div className={styles['nav-wrap']}>
      <NavLink to="/" className={({ isActive }) => (isActive ? styles.active : undefined)}>
        home
      </NavLink>
      <NavLink to="/site" className={({ isActive }) => (isActive ? styles.active : undefined)}>
        site
      </NavLink>
      <NavLink to="/about" className={({ isActive }) => (isActive ? styles.active : undefined)}>
        about
      </NavLink>
      <NavLink to="/test" className={({ isActive }) => (isActive ? styles.active : undefined)}>
        test
      </NavLink>
      <NavLink to="/tools" className={({ isActive }) => (isActive ? styles.active : undefined)}>
        tools
      </NavLink>
      <NavLink to="/aaa" className={({ isActive }) => (isActive ? styles.active : undefined)}>
        404
      </NavLink>
    </div>
  );
}

import { CSSProperties } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { tools } from './tools';
import styles from './index.module.less';

export default function Tools() {
  return (
    <div className={styles['tools-wrap']}>
      <nav className={styles['tools-nav']} aria-label="工具导航">
        <div className={styles['tools-nav-title']}>工具</div>
        {tools.map((tool) => (
          <NavLink
            key={tool.path}
            to={tool.path}
            className={({ isActive }) => (isActive ? `${styles['tool-item']} ${styles.active}` : styles['tool-item'])}
            style={{ '--item-accent': tool.colorVar } as CSSProperties}
          >
            <span className={styles['tool-dot']} aria-hidden="true" />
            {tool.name}
          </NavLink>
        ))}
      </nav>
      <div className={styles['tools-content']}>
        <Outlet />
      </div>
    </div>
  );
}

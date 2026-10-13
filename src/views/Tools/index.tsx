import { NavLink, Outlet } from 'react-router-dom';
import { tools } from './tools';
import styles from './index.module.less';

export default function Tools() {
  return (
    <div className={styles['tools-wrap']}>
      <div className={styles['tools-nav']}>
        {tools.map((tool, index) => (
          <span key={tool.path}>
            {index > 0 && ' | '}
            <NavLink to={tool.path} className={({ isActive }) => (isActive ? styles.active : '')}>
              {tool.name}
            </NavLink>
          </span>
        ))}
      </div>
      <div className={styles['tools-content']}>
        <Outlet />
      </div>
    </div>
  );
}

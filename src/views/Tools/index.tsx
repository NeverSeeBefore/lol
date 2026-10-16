import type { CSSProperties } from 'react';
import { ConfigProvider, theme } from 'antd';
import { NavLink, Outlet } from 'react-router-dom';
import { tools } from './tools';
import styles from './index.module.less';

const toolTheme = {
  algorithm: theme.darkAlgorithm,
  // 令牌映射见 docs/design/ui-spec.md §6.2（暗色 UI 规范）
  token: {
    borderRadius: 8,
    colorBgBase: '#131417',
    colorBgContainer: '#1a1c20',
    colorBgElevated: '#22252b',
    colorBgLayout: '#131417',
    colorBorder: 'rgba(232, 236, 241, 0.16)',
    colorBorderSecondary: 'rgba(232, 236, 241, 0.09)',
    colorPrimary: '#fa8c16',
    colorTextBase: '#e8ecf1',
    colorTextSecondary: '#9aa7b4',
    colorTextTertiary: '#788290',
    colorTextLightSolid: '#1a1206',
    controlOutlineWidth: 0,
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif",
  },
  components: {
    Button: { borderRadius: 4 },
    Input: { borderRadius: 4 },
    Modal: { borderRadiusLG: 12 },
  },
};

export default function Tools() {
  return (
    <ConfigProvider theme={toolTheme}>
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
    </ConfigProvider>
  );
}

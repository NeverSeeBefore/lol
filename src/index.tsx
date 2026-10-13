import React from 'react';
import { ConfigProvider, theme } from 'antd';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { store } from 'Src/store';
import 'Static/styles/global.less';
import App from './app';

const root = createRoot(document.getElementById('root')!);
root.render(
  <ConfigProvider
    theme={{
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
        // 琥珀底上的文字必须是深棕黑（darkAlgorithm 默认白字仅 ≈2.2:1）
        colorTextLightSolid: '#1a1206',
        // 关掉默认 focus 外发光，焦点统一走 global.less 的 --focus-ring 描边
        controlOutlineWidth: 0,
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif",
      },
      components: {
        Button: { borderRadius: 4 },
        Input: { borderRadius: 4 },
        Modal: { borderRadiusLG: 12 },
      },
    }}
  >
    <BrowserRouter>
      <Provider store={store}>
        <App />
      </Provider>
    </BrowserRouter>
  </ConfigProvider>,
);

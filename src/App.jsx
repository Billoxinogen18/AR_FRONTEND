// File: AR_Proj/AR_FRONTEND/src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { TonConnectButton, useTonConnectModal } from '@tonconnect/ui-react';
import { Layout, Menu, ConfigProvider, theme as antdTheme } from 'antd';
import { DollarCircleOutlined, ExperimentOutlined, UserOutlined } from '@ant-design/icons';
import './App.css'; // Main app styles including layout overrides
import EarnPage from './pages/EarnPage';
import GamePage from './pages/GamePage';
import UserPage from './pages/UserPage'; // Correctly importing UserPage

const { Header, Content, Sider } = Layout;

// No longer a placeholder for UserPage
// const UserPagePlaceholder = () => <div style={{ padding: 24, textAlign: 'center', color: '#e0e0e0' }}>USER Page (Profile & Settings) - Coming Soon!</div>;

const CurrentPathMenu = () => {
  const location = useLocation();
  let currentPath = location.pathname;
  if (currentPath === '/' || currentPath === '') {
    currentPath = '/earn'; // Default to earn page
  }

  const menuItems = [
    { key: '/earn', icon: <DollarCircleOutlined />, label: <NavLink to="/earn">EARN</NavLink> },
    { key: '/game', icon: <ExperimentOutlined />, label: <NavLink to="/game">GAME</NavLink> },
    { key: '/user', icon: <UserOutlined />, label: <NavLink to="/user">USER</NavLink> },
  ];

  return (
    <Menu
      theme="dark" // AntD dark theme base for menu
      mode="inline"
      selectedKeys={[currentPath]}
      style={{
        height: '100%',
        borderRight: 0,
        background: 'transparent', // Sider itself will have the glass effect
        padding: '10px 0',
      }}
      items={menuItems}
    />
  );
};

function App() {
  // This is the full ARIX_DARK_THEME object we've been using
  const ARIX_DARK_THEME = {
    algorithm: antdTheme.darkAlgorithm,
    token: {
      colorPrimary: '#00adee',
      colorInfo: '#00adee',
      colorSuccess: '#52c41a',
      colorError: '#ff4d4f',
      colorWarning: '#faad14',
      colorTextBase: '#e0e0e0',
      colorBgBase: '#101018',
      colorBgContainer: '#1a1a22',
      colorBgElevated: 'rgba(30, 30, 40, 0.7)',
      colorBorder: 'rgba(255, 255, 255, 0.15)',
      colorBorderSecondary: 'rgba(255, 255, 255, 0.1)',
      borderRadius: 12,
      fontFamily: "'Inter', sans-serif",
    },
    components: {
      Layout: {
        headerBg: 'rgba(20, 20, 30, 0.6)',
        siderBg: 'rgba(25, 25, 35, 0.5)',
        bodyBg: 'transparent',
      },
      Menu: {
        darkItemBg: 'transparent',
        darkItemSelectedBg: 'rgba(0, 173, 238, 0.2)',
        darkItemColor: 'rgba(220, 220, 230, 0.75)',
        darkItemSelectedColor: '#00adee',
        darkItemHoverBg: 'rgba(255, 255, 255, 0.05)',
        darkItemHoverColor: '#00adee',
        darkSubMenuItemBg: 'rgba(30, 30, 45, 0.4)',
      },
      Button: {
        colorPrimary: '#00adee',
        colorTextLightSolid: '#fff',
        colorBgContainerDisabled: '#303030',
        colorTextDisabled: '#777',
      },
      Card: {
         colorBgContainer: 'rgba(40, 42, 58, 0.4)',
         colorBorderSecondary: 'rgba(255, 255, 255, 0.08)',
         colorTextHeading: '#00adee',
      },
      Modal: {
         colorBgContainer: 'rgba(30, 30, 40, 0.7)',
         colorBorderSecondary: 'rgba(255, 255, 255, 0.1)',
         colorTextHeading: '#00adee',
      },
      InputNumber: {
         colorBgContainer: 'rgba(20, 22, 30, 0.5)',
         colorBorder: 'rgba(255, 255, 255, 0.1)',
         colorText: '#e0e0e0',
         colorTextDisabled: '#777',
         colorFillAlter: '#2a2a2a',
         colorBorderSecondary: 'rgba(255, 255, 255, 0.08)',
      },
      Statistic: {
        titleFontSize: 14,
        contentFontSize: 20,
        colorTextSecondary: '#aaa',
        colorText: '#e0e0e0',
      },
      Radio: {
        buttonSolidCheckedBg: '#00adee',
        buttonSolidCheckedColor: '#fff',
        buttonSolidCheckedHoverBg: '#00bfff',
        buttonSolidCheckedActiveBg: '#008cdd',
        colorBorder: 'rgba(255, 255, 255, 0.2)',
      },
      Tabs: {
        cardBg: 'transparent',
        itemColor: 'rgba(220, 220, 230, 0.65)',
        itemSelectedColor: '#00adee',
        itemHoverColor: '#00bfff',
        inkBarColor: '#00adee',
        horizontalMargin: '0',
        titleFontSize: '1em',
      }
    },
  };

  return (
    <ConfigProvider theme={ARIX_DARK_THEME}>
      <Router>
        <Layout style={{ minHeight: '100vh', background: ARIX_DARK_THEME.token.colorBgBase }}>
          <Header
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 20px',
              background: ARIX_DARK_THEME.components.Layout.headerBg,
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              borderBottom: `1px solid ${ARIX_DARK_THEME.token.colorBorderSecondary}`,
              position: 'sticky',
              top: 0,
              zIndex: 10,
            }}
          >
            <div style={{ color: ARIX_DARK_THEME.token.colorTextBase, fontSize: '22px', fontWeight: '600' }}>
              ARIX Terminal
            </div>
            <TonConnectButton />
          </Header>
          <Layout style={{ background: 'transparent' }}>
            <Sider
              width={200}
              breakpoint="lg"
              collapsedWidth="0"
              trigger={null}
              style={{
                background: ARIX_DARK_THEME.components.Layout.siderBg,
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                borderRight: `1px solid ${ARIX_DARK_THEME.token.colorBorderSecondary}`,
                height: 'calc(100vh - 64px)',
                position: 'sticky',
                top: '64px',
                zIndex: 9,
                overflow: 'auto',
                paddingTop: '10px'
              }}
            >
              <CurrentPathMenu />
            </Sider>
            <Layout style={{ padding: '0', background: 'transparent' }}>
              <Content
                style={{
                  padding: '24px',
                  margin: 0,
                  minHeight: 'calc(100vh - 64px - 50px)', // Assuming footer might be 50px for calculation
                  background: 'transparent',
                  color: ARIX_DARK_THEME.token.colorTextBase,
                  overflowY: 'auto',
                }}
              >
                <Routes>
                  <Route path="/" element={<EarnPage />} />
                  <Route path="/earn" element={<EarnPage />} />
                  <Route path="/game" element={<GamePage />} />
                  <Route path="/user" element={<UserPage />} /> {/* Using the actual UserPage */}
                </Routes>
              </Content>
            </Layout>
          </Layout>
        </Layout>
      </Router>
    </ConfigProvider>
  );
}

export default App;
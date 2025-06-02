// File: AR_FRONTEND/src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { TonConnectButton } from '@tonconnect/ui-react';
import { Layout, Menu, ConfigProvider, theme as antdTheme, Typography, Grid } from 'antd';
import { 
    DollarCircleOutlined, 
    ExperimentOutlined, 
    UserOutlined, 
    BellOutlined, 
    CheckSquareOutlined 
} from '@ant-design/icons';
import './App.css'; 
import EarnPage from './pages/EarnPage';
import GamePage from './pages/GamePage';
import UserPage from './pages/UserPage';
import TaskPage from './pages/TaskPage'; // Import new TaskPage

const { Header, Content, Sider } = Layout; // Removed Footer as it's not used
const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

// Placeholder page for PUSH/MODS
const PushPagePlaceholder = () => (
    <div style={{ padding: 24, textAlign: 'center', color: '#e0e0e0', minHeight: 'calc(100vh - 128px)' }}>
        <Title level={2} style={{color: 'white'}}>PUSH / MODS</Title>
        <Text style={{color: '#aaa'}}>Platform news, updates, and announcements will appear here. Stay tuned!</Text>
    </div>
);

const AppMenu = ({ mobile }) => {
  const location = useLocation();
  let currentPath = location.pathname;
  if (currentPath === '/' || currentPath === '') {
    currentPath = '/earn'; // Default to earn page
  }

  // Reordered menu items as per typical TMA layout (Task, Game, Earn, User, Push)
  const menuItems = [
    { key: '/task', icon: <CheckSquareOutlined />, label: <NavLink to="/task">TASK</NavLink> },
    { key: '/game', icon: <ExperimentOutlined />, label: <NavLink to="/game">GAME</NavLink> },
    { key: '/earn', icon: <DollarCircleOutlined />, label: <NavLink to="/earn">EARN</NavLink> },
    { key: '/user', icon: <UserOutlined />, label: <NavLink to="/user">USER</NavLink> },
    { key: '/push', icon: <BellOutlined />, label: <NavLink to="/push">PUSH</NavLink> },
  ];

  if (mobile) {
    return (
      <Menu
        theme="dark"
        mode="horizontal"
        selectedKeys={[currentPath]}
        items={menuItems}
        className="mobile-bottom-nav" // Apply class for specific styling
      />
    );
  }

  return (
    <Sider
      width={200}
      breakpoint="lg" 
      collapsedWidth="0" 
      trigger={null} 
      style={{
        background: 'rgba(25, 25, 35, 0.6)', 
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderRight: '1px solid rgba(255, 255, 255, 0.1)',
        height: 'calc(100vh - 64px)', 
        position: 'sticky',
        top: '64px', 
        zIndex: 999, 
        overflow: 'auto',
      }}
    >
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[currentPath]}
        style={{
          height: '100%',
          borderRight: 0,
          background: 'transparent',
          padding: '10px 0',
        }}
        items={menuItems}
      />
    </Sider>
  );
};

function App() {
  const screens = useBreakpoint();
  const isMobile = !screens.lg; 

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
      colorBgContainer: 'rgba(26, 26, 34, 0.8)', 
      colorBgElevated: 'rgba(30, 30, 40, 0.85)', 
      colorBorder: 'rgba(255, 255, 255, 0.15)',
      colorBorderSecondary: 'rgba(255, 255, 255, 0.1)',
      borderRadius: 12,
      fontFamily: "'Inter', sans-serif",
    },
    components: {
      Layout: {
        headerBg: 'rgba(20, 20, 30, 0.7)', 
        siderBg: 'rgba(25, 25, 35, 0.6)', 
        bodyBg: '#101018', 
        footerBg: 'transparent',
      },
      Menu: {
        darkItemBg: 'transparent',
        darkItemSelectedBg: 'rgba(0, 173, 238, 0.2)', 
        darkItemColor: 'rgba(220, 220, 230, 0.75)',
        darkItemSelectedColor: '#00adee',
        darkItemHoverBg: 'rgba(255, 255, 255, 0.05)',
        darkItemHoverColor: '#00adee',
        darkSubMenuItemBg: 'rgba(30, 30, 45, 0.4)',
        horizontalItemSelectedColor: '#00adee',
        itemHeight: 50, 
      },
      Button: {
        colorPrimary: '#00adee',
        colorTextLightSolid: '#fff',
        colorBgContainerDisabled: '#303030',
        colorTextDisabled: '#777',
        defaultBg: 'rgba(50, 50, 60, 0.7)',
        defaultColor: '#e0e0e0',
        defaultBorderColor: 'rgba(255, 255, 255, 0.2)',
        defaultHoverBg: 'rgba(60, 60, 70, 0.8)',
        defaultHoverColor: '#00adee',
        defaultActiveBg: 'rgba(40, 40, 50, 0.6)',
      },
      Card: {
         colorBgContainer: 'rgba(40, 42, 58, 0.5)', 
         colorBorderSecondary: 'rgba(255, 255, 255, 0.08)',
         colorTextHeading: '#00adee', 
      },
      Modal: {
         colorBgElevated: 'rgba(30, 30, 40, 0.9)', 
         colorBorderSecondary: 'rgba(255, 255, 255, 0.1)',
         colorTextHeading: '#00adee',
         boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.37)", 
      },
      InputNumber: {
         colorBgContainer: 'rgba(20, 22, 30, 0.5)',
         colorBorder: 'rgba(255, 255, 255, 0.1)',
         colorText: '#e0e0e0',
         colorTextDisabled: '#777',
         colorFillAlter: '#2a2a2a', 
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
      },
      Spin: { 
        colorPrimary: '#00adee',
      },
      Alert: { // Added Alert for consistency if used with glass-pane-alert
        colorInfoBg: 'rgba(0, 173, 238, 0.15)', // Example for info alert glass style
        colorInfoBorder: 'rgba(0, 173, 238, 0.3)',
      }
    },
  };

  return (
    <ConfigProvider theme={ARIX_DARK_THEME}>
      <Router>
        <Layout style={{ minHeight: '100vh', background: ARIX_DARK_THEME.token.colorBgBase }}>
          <Header className="app-header">
            <Title level={isMobile ? 4 : 3} style={{ color: ARIX_DARK_THEME.token.colorPrimary, margin: 0, fontWeight: 'bold' }}>
              ARIX Terminal
            </Title>
            <TonConnectButton />
          </Header>
          <Layout style={{ background: 'transparent', paddingTop: '64px' }}>
            {!isMobile && <AppMenu mobile={false} />}
            <Layout style={{ 
                paddingBottom: isMobile ? '60px' : '0', 
                background: 'transparent' 
            }} className={isMobile ? "mobile-view" : ""}>
              <Content
                style={{
                  padding: isMobile ? '16px' : '24px',
                  margin: 0,
                  minHeight: `calc(100vh - 64px ${isMobile ? '- 60px' : ''})`,
                  background: 'transparent',
                  color: ARIX_DARK_THEME.token.colorTextBase,
                  overflowY: 'auto', 
                }}
              >
                <Routes>
                  <Route path="/" element={<EarnPage />} />
                  <Route path="/earn" element={<EarnPage />} />
                  <Route path="/game" element={<GamePage />} />
                  <Route path="/user" element={<UserPage />} />
                  <Route path="/task" element={<TaskPage />} /> 
                  <Route path="/push" element={<PushPagePlaceholder />} />
                </Routes>
              </Content>
            </Layout>
          </Layout>
          {isMobile && <AppMenu mobile={true} />}
        </Layout>
      </Router>
    </ConfigProvider>
  );
}

export default App;
// File: AR_Proj/AR_FRONTEND/src/App.jsx
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
import ResponsiveMobileNav from './components/ResponsiveMobileNav';
import EarnPage from './pages/EarnPage';
import GamePage from './pages/GamePage';
import UserPage from './pages/UserPage';
import TaskPage from './pages/TaskPage';
import PushPage from './pages/PushPage';

const { Header, Content, Sider } = Layout;
const { Title } = Typography;
const { useBreakpoint } = Grid;

const menuConfig = [
  { key: '/task', icon: <CheckSquareOutlined />, labelText: "TASK" },
  { key: '/game', icon: <ExperimentOutlined />, labelText: "GAME" },
  { key: '/push', icon: <BellOutlined />, labelText: "PUSH" },
  { key: '/earn', icon: <DollarCircleOutlined />, labelText: "EARN" },
  { key: '/user', icon: <UserOutlined />, labelText: "USER" },
];

const DesktopMenu = () => {
  const location = useLocation();
  let currentPath = location.pathname;
  if (currentPath === '/' || currentPath === '') { 
    currentPath = '/earn'; 
  }

  const desktopMenuItems = menuConfig.map(item => ({
    key: item.key,
    icon: React.cloneElement(item.icon, { style: { fontSize: '16px' } }),
    label: <NavLink to={item.key}>{item.labelText}</NavLink>,
    style: { padding: '0 16px', fontSize: '0.9rem' },
  }));

  return (
    <Sider
      width={180} 
      className="desktop-sider"
      breakpoint="lg"
      collapsedWidth="0" 
      trigger={null} 
    >
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[currentPath]}
        items={desktopMenuItems}
        style={{ height: '100%', borderRight: 0, background: 'transparent', padding: '10px 0' }}
      />
    </Sider>
  );
};

function App() {
  const screens = useBreakpoint();
  const isMobile = !screens.lg;

  const TELEGRAM_DARK_THEME = {
    algorithm: antdTheme.darkAlgorithm,
    token: {
      colorPrimary: '#7e73ff', 
      colorInfo: '#7e73ff',
      colorSuccess: '#4CAF50', 
      colorError: '#F44336',   
      colorWarning: '#FFC107', 
      colorTextBase: '#e0e0e5', 
      colorBgBase: '#000000',      
      colorBgContainer: '#1c1c1e', 
      colorBgElevated: '#2a2a2a',  
      colorBorder: '#38383a',      
      colorBorderSecondary: '#2a2a2a', 
      borderRadius: 12,          
      borderRadiusLG: 16,        
      fontFamily: "'Inter', sans-serif",
      controlHeight: 40, 
      controlHeightLG: 44,
      controlHeightSM: 32,
    },
    components: {
      Layout: {
        headerBg: '#121212',
        siderBg: '#121212', 
        bodyBg: '#000000',
      },
      Menu: { 
        darkItemBg: 'transparent',
        darkItemSelectedBg: '#2c2c2e', 
        darkItemColor: '#a0a0a5',            
        darkItemSelectedColor: '#7e73ff',    
        darkItemHoverBg: '#252527',
        darkItemHoverColor: '#9a91ff',
        itemHeight: 40, 
        horizontalItemSelectedColor: '#7e73ff', 
      },
      Button: {
        colorPrimary: '#7e73ff',
        colorTextLightSolid: '#ffffff',
        defaultBg: '#2c2c2e',
        defaultColor: '#e0e0e5',
        defaultBorderColor: '#38383a',
        defaultHoverBg: '#353537',
        defaultHoverColor: '#9a91ff',
        defaultActiveBg: '#252527',
        borderRadius: 8,
        borderRadiusLG: 10,
      },
      Card: { 
         colorBgContainer: '#1c1c1e',
         colorBorderSecondary: '#38383a',
         colorTextHeading: '#ffffff',
         borderRadiusLG: 16,
      },
      Modal: {
         colorBgElevated: '#1c1c1e', 
         colorBorderSecondary: '#38383a',
         colorTextHeading: '#ffffff',
      },
      Input: {
        colorBgContainer: '#2c2c2e',
        colorBorder: '#38383a',
        colorText: '#e0e0e5',
        colorTextPlaceholder: '#6a6a6e',
        borderRadius: 8,
      },
      InputNumber: {
         colorBgContainer: '#2c2c2e',
         colorBorder: '#38383a',
         colorText: '#e0e0e5',
         borderRadius: 8,
      },
      Statistic: {
        titleFontSize: 13, 
        contentFontSize: 20, 
        colorTextDescription: '#8e8e93', 
        colorText: '#ffffff', 
      },
      Radio: {
        buttonSolidCheckedBg: '#7e73ff',
        buttonSolidCheckedHoverBg: '#9a91ff',
        buttonSolidCheckedActiveBg: '#6f65e8',
        colorBorder: '#38383a',
        borderRadius: 8,
        buttonPaddingInline: 15,
      },
      Tabs: { 
        cardBg: '#1c1c1e', 
        itemColor: '#a0a0a5',
        itemSelectedColor: '#ffffff',
        itemHoverColor: '#c0c0c5',
        inkBarColor: '#7e73ff',
        horizontalMargin: '0',
        titleFontSize: isMobile ? 14 : 15,
        borderRadius: 8, 
      },
      Spin: { colorPrimary: '#7e73ff',},
      Alert: {
        colorInfoBg: 'rgba(126, 115, 255, 0.15)',
        colorInfoBorder: 'rgba(126, 115, 255, 0.3)',
        borderRadius: 12,
      },
      List: {
        colorSplit: '#2a2a2a', 
      },
      Dropdown: {
        colorBgElevated: '#1c1c1e',
        colorBorder: '#38383a',
        borderRadius: 12,
        boxShadowSecondary: '0 6px 20px rgba(0, 0, 0, 0.3)',
      }
    },
  };

  return (
    <ConfigProvider theme={TELEGRAM_DARK_THEME}>
      <Router>
        <Layout className="app-layout" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          <Header className="app-header">
            <Title level={isMobile ? 5 : 4} className="app-header-title">
              ARIX Terminal
            </Title>
            <TonConnectButton className="ton-connect-button" />
          </Header>

          <Layout className="app-main-layout-container">
            {!isMobile && <DesktopMenu />}

            <Layout className={`app-content-wrapper ${isMobile ? "mobile-view" : ""}`}>
              <Content className="app-content"> 
                <Routes>
                  <Route path="/" element={<EarnPage />} /> 
                  <Route path="/earn" element={<EarnPage />} />
                  <Route path="/game" element={<GamePage />} />
                  <Route path="/user" element={<UserPage />} />
                  <Route path="/task" element={<TaskPage />} />
                  <Route path="/push" element={<PushPage />} />
                </Routes>
              </Content>
            </Layout>
          </Layout>

          {isMobile && <ResponsiveMobileNav menuConfig={menuConfig} />}
        </Layout>
      </Router>
    </ConfigProvider>
  );
}

export default App;
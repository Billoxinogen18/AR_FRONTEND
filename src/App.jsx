// File: AR_Proj/AR_FRONTEND/src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { TonConnectButton } from '@tonconnect/ui-react';
import { Layout, Menu, ConfigProvider, theme as antdTheme, Typography, Grid } from 'antd';
import {
    DollarCircleOutlined, // EARN
    ExperimentOutlined, // GAME
    UserOutlined, // USER
    BellOutlined, // PUSH
    CheckSquareOutlined // TASK
} from '@ant-design/icons';
import './App.css';
import EarnPage from './pages/EarnPage';
import GamePage from './pages/GamePage';
import UserPage from './pages/UserPage';
import TaskPage from './pages/TaskPage';
import PushPage from './pages/PushPage'; // Current PushPage (announcements)

const { Header, Content, Sider } = Layout;
const { Title } = Typography;
const { useBreakpoint } = Grid;

// Define icons and labels directly to match screenshots
const menuConfig = [
  { key: '/task', icon: <CheckSquareOutlined />, labelText: "TASK" },
  { key: '/game', icon: <ExperimentOutlined />, labelText: "GAME" },
  { key: '/push', icon: <BellOutlined />, labelText: "PUSH" }, // Using BellOutlined as a generic icon for PUSH
  { key: '/earn', icon: <DollarCircleOutlined />, labelText: "EARN" },
  { key: '/user', icon: <UserOutlined />, labelText: "USER" },
];

const AppMenu = ({ mobile }) => {
  const location = useLocation();
  let currentPath = location.pathname;
  if (currentPath === '/' || currentPath === '') { // Default to '/earn'
    currentPath = '/earn'; 
  }

  const commonItemStyle = mobile ? {} : { padding: '0 16px', fontSize: '0.9rem' };

  const menuItems = menuConfig.map(item => ({
    key: item.key,
    icon: React.cloneElement(item.icon, { style: { fontSize: mobile ? '20px' : '16px' } }),
    label: mobile ? <span className="mobile-menu-label">{item.labelText}</span> : <NavLink to={item.key}>{item.labelText}</NavLink>,
    style: commonItemStyle,
  }));


  if (mobile) {
    return (
      <Menu
        theme="dark"
        mode="horizontal"
        selectedKeys={[currentPath]}
        items={menuItems}
        className="mobile-bottom-nav"
      />
    );
  }

  // Desktop Sider
  return (
    <Sider
      width={180} // Slightly narrower Sider
      className="desktop-sider" // Class for desktop specific sider styles
      breakpoint="lg"
      collapsedWidth="0" 
      trigger={null} 
    >
      <Menu
        theme="dark" // Uses components.Menu.dark*
        mode="inline"
        selectedKeys={[currentPath]}
        items={menuItems}
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
      colorPrimary: '#7e73ff', // Accent purple-blue from screenshots
      colorInfo: '#7e73ff',
      colorSuccess: '#4CAF50', // Standard green
      colorError: '#F44336',   // Standard red
      colorWarning: '#FFC107', // Standard amber
      colorTextBase: '#e0e0e5', // Light grey text
      colorBgBase: '#000000',      // Pure black background
      colorBgContainer: '#1c1c1e', // Dark grey for cards, modals
      colorBgElevated: '#2a2a2a',  // Slightly lighter for elevated like dropdowns
      colorBorder: '#38383a',      // Subtle borders
      colorBorderSecondary: '#2a2a2a', // Even more subtle
      borderRadius: 12,          // Rounded corners for cards (can be overridden)
      borderRadiusLG: 16,        // Larger border radius
      fontFamily: "'Inter', sans-serif",
      controlHeight: 40, // Default height for inputs, buttons
      controlHeightLG: 44,
      controlHeightSM: 32,
    },
    components: {
      Layout: {
        headerBg: '#121212',
        siderBg: '#121212', 
        bodyBg: '#000000',
      },
      Menu: { // General Menu styles (for Sider)
        darkItemBg: 'transparent',
        darkItemSelectedBg: '#2c2c2e', 
        darkItemColor: '#a0a0a5',            
        darkItemSelectedColor: '#7e73ff',    
        darkItemHoverBg: '#252527',
        darkItemHoverColor: '#9a91ff',
        // For mobile, specific .mobile-bottom-nav CSS will override where needed
        // itemHeight: isMobile ? 56 : 40,
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
      Card: { // Used by .dark-theme-card or if directly using AntD Card with theme
         colorBgContainer: '#1c1c1e',
         colorBorderSecondary: '#38383a',
         colorTextHeading: '#ffffff',
         borderRadiusLG: 16,
      },
      Modal: {
         colorBgElevated: '#1c1c1e', // Modal content background
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
        titleFontSize: 13, // Smaller title for stats
        contentFontSize: 20, // Adjust as needed
        colorTextDescription: '#8e8e93', // For the title
        colorText: '#ffffff', // For the value
      },
      Radio: {
        buttonSolidCheckedBg: '#7e73ff',
        buttonSolidCheckedHoverBg: '#9a91ff',
        buttonSolidCheckedActiveBg: '#6f65e8',
        colorBorder: '#38383a',
        borderRadius: 8,
        buttonPaddingInline: 15, // AntD default might be too wide for some segments
      },
      Tabs: { // For tabbed content like in UserPage
        cardBg: '#1c1c1e', // Card style tab background
        itemColor: '#a0a0a5',
        itemSelectedColor: '#ffffff',
        itemHoverColor: '#c0c0c5',
        inkBarColor: '#7e73ff',
        horizontalMargin: '0',
        titleFontSize: isMobile ? 14 : 15,
        borderRadius: 8, // Tab item border radius for top corners
      },
      Spin: { colorPrimary: '#7e73ff',},
      Alert: {
        colorInfoBg: 'rgba(126, 115, 255, 0.15)',
        colorInfoBorder: 'rgba(126, 115, 255, 0.3)',
        borderRadius: 12,
      },
       List: {
          colorSplit: '#2a2a2a', // Border color for list items
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

          {/* Layout for Sider (desktop) + Main Content OR Main Content (mobile) */}
          <Layout className="app-main-layout-container">
            {!isMobile && <AppMenu mobile={false} />}

            {/* Content Wrapper for consistent padding and scrolling */}
            <Layout className={`app-content-wrapper ${isMobile ? "mobile-view" : ""}`}>
              <Content className="app-content"> {/* Max width is applied here */}
                <Routes>
                  <Route path="/" element={<EarnPage />} /> {/* Default to Earn */}
                  <Route path="/earn" element={<EarnPage />} />
                  <Route path="/game" element={<GamePage />} />
                  <Route path="/user" element={<UserPage />} />
                  <Route path="/task" element={<TaskPage />} />
                  <Route path="/push" element={<PushPage />} />
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
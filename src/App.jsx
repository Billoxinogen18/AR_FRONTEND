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
import EarnPage from './pages/EarnPage';
import GamePage from './pages/GamePage';
import UserPage from './pages/UserPage';
import TaskPage from './pages/TaskPage';
import PushPage from './pages/PushPage';

const { Header, Content, Sider } = Layout;
const { Title } = Typography;
const { useBreakpoint } = Grid;

const AppMenu = ({ mobile }) => {
  const location = useLocation();
  let currentPath = location.pathname;
  if (currentPath === '/' || currentPath === '') {
    currentPath = '/earn';
  }

  // Added 'key' directly to label NavLink for better focus and accessibility with Menu items
  const menuItems = [
    { key: '/task', icon: <CheckSquareOutlined />, label: <NavLink to="/task" key="/task-nav">TASK</NavLink> },
    { key: '/game', icon: <ExperimentOutlined />, label: <NavLink to="/game" key="/game-nav">GAME</NavLink> },
    { key: '/earn', icon: <DollarCircleOutlined />, label: <NavLink to="/earn" key="/earn-nav">EARN</NavLink> },
    { key: '/user', icon: <UserOutlined />, label: <NavLink to="/user" key="/user-nav">USER</NavLink> },
    { key: '/push', icon: <BellOutlined />, label: <NavLink to="/push" key="/push-nav">PUSH</NavLink> },
  ];

  // Updated label for mobile to wrap in a span with a class for specific CSS targeting
  const mobileMenuItems = menuItems.map(item => ({
    ...item,
    label: <span className="mobile-menu-label">{item.label.props.children}</span>
  }));


  if (mobile) {
    return (
      <Menu
        theme="dark" // Uses theme.components.Menu.dark* tokens
        mode="horizontal"
        selectedKeys={[currentPath]}
        items={mobileMenuItems}
        className="mobile-bottom-nav" // Crucial for fixed positioning and glass effect
      />
    );
  }

  // Desktop Sider
  return (
    <Sider
      width={200}
      breakpoint="lg"
      collapsedWidth="0"
      trigger={null} // Using CSS for responsive collapse if needed or keeping it always visible on lg+
      style={{
        background: 'rgba(25, 25, 35, 0.6)', // Sider glass effect
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderRight: '1px solid rgba(255, 255, 255, 0.1)',
        height: 'calc(100vh - 64px)', // Full height minus header
        position: 'sticky', // Sticky Sider below header
        top: '64px', // Stick below the header
        zIndex: 999, // Below header (1001), above content
        overflow: 'auto', // Allow Sider menu to scroll if content is long
      }}
    >
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[currentPath]}
        style={{
          height: '100%',
          borderRight: 0,
          background: 'transparent', // Sider's background provides the glass effect
          padding: '10px 0',
        }}
        items={menuItems} // Original items with NavLink for desktop
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
      colorPrimary: '#00adee', colorInfo: '#00adee', colorSuccess: '#52c41a',
      colorError: '#ff4d4f', colorWarning: '#faad14', colorTextBase: '#e0e0e0',
      colorBgBase: '#101018', colorBgContainer: 'rgba(26, 26, 34, 0.8)',
      colorBgElevated: 'rgba(30, 30, 40, 0.85)', colorBorder: 'rgba(255, 255, 255, 0.15)',
      colorBorderSecondary: 'rgba(255, 255, 255, 0.1)', borderRadius: 12,
      fontFamily: "'Inter', sans-serif",
    },
    components: {
      Layout: {
        headerBg: 'rgba(20, 20, 30, 0.7)', // More transparent for distinct glass header
        siderBg: 'rgba(25, 25, 35, 0.6)', // Sider with its own glass, matches .mobile-bottom-nav
        bodyBg: '#101018', // Main app background
        footerBg: 'transparent',
      },
      Menu: { // These apply to both desktop Sider menu and potentially mobile menu if not overridden by CSS
        darkItemBg: 'transparent',
        darkItemSelectedBg: 'rgba(0, 173, 238, 0.2)', // ARIX blue tint for selection
        darkItemColor: 'rgba(220, 220, 230, 0.75)', // Default item text/icon
        darkItemSelectedColor: '#00adee',            // Selected item text/icon (primary color)
        darkItemHoverBg: 'rgba(255, 255, 255, 0.05)',
        darkItemHoverColor: '#00adee',
        darkSubMenuItemBg: 'rgba(30, 30, 45, 0.4)',
        horizontalItemSelectedColor: '#00adee',
        itemHeight: isMobile ? 60 : 50, // Use 60px height for mobile bottom nav items
        // Ensure mobile bottom nav colors are handled via CSS (.mobile-bottom-nav .ant-menu-item-selected .anticon etc.)
        // if theme tokens don't provide enough control, which they often do for general menus.
        // For the mobile-bottom-nav, direct CSS is more reliable for the fixed layout and specific icon/label colors.
      },
      Button: {
        colorPrimary: '#00adee', colorTextLightSolid: '#fff',
        colorBgContainerDisabled: '#303030', colorTextDisabled: '#777',
        defaultBg: 'rgba(50, 50, 60, 0.7)', defaultColor: '#e0e0e0',
        defaultBorderColor: 'rgba(255, 255, 255, 0.2)', defaultHoverBg: 'rgba(60, 60, 70, 0.8)',
        defaultHoverColor: '#00adee', defaultActiveBg: 'rgba(40, 40, 50, 0.6)',
      },
      Card: {
         colorBgContainer: 'rgba(40, 42, 58, 0.5)', colorBorderSecondary: 'rgba(255, 255, 255, 0.08)',
         colorTextHeading: '#00adee',
      },
      Modal: {
         colorBgElevated: 'rgba(30, 30, 40, 0.9)', colorBorderSecondary: 'rgba(255, 255, 255, 0.1)',
         colorTextHeading: '#00adee', boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
      },
      InputNumber: {
         colorBgContainer: 'rgba(20, 22, 30, 0.5)', colorBorder: 'rgba(255, 255, 255, 0.1)',
         colorText: '#e0e0e0', colorTextDisabled: '#777', colorFillAlter: '#2a2a2a',
      },
      Statistic: {
        titleFontSize: 14, contentFontSize: 20,
        colorTextSecondary: '#aaa', colorText: '#e0e0e0',
      },
      Radio: {
        buttonSolidCheckedBg: '#00adee', buttonSolidCheckedColor: '#fff',
        buttonSolidCheckedHoverBg: '#00bfff', buttonSolidCheckedActiveBg: '#008cdd',
        colorBorder: 'rgba(255, 255, 255, 0.2)',
      },
      Tabs: {
        cardBg: 'transparent', itemColor: 'rgba(220, 220, 230, 0.65)',
        itemSelectedColor: '#00adee', itemHoverColor: '#00bfff',
        inkBarColor: '#00adee', horizontalMargin: '0', titleFontSize: '1em',
      },
      Spin: { colorPrimary: '#00adee',},
      Alert: {
        colorInfoBg: 'rgba(0, 173, 238, 0.15)',
        colorInfoBorder: 'rgba(0, 173, 238, 0.3)',
      }
    },
  };

  return (
    <ConfigProvider theme={ARIX_DARK_THEME}>
      <Router>
        {/* Outermost Layout: Takes full viewport height, background from theme */}
        <Layout style={{ minHeight: '100vh', background: ARIX_DARK_THEME.token.colorBgBase, display: 'flex', flexDirection: 'column' }}>
          <Header className="app-header" style={{ background: ARIX_DARK_THEME.components.Layout.headerBg }}>
            <Title level={isMobile ? 4 : 3} style={{ color: ARIX_DARK_THEME.token.colorPrimary, margin: 0, fontWeight: 'bold' }}>
              ARIX Terminal
            </Title>
            <TonConnectButton />
          </Header>

          {/* Inner Layout: Handles Sider + Content OR full width Content (mobile) */}
          {/* This layout also uses flex to allow the Content part to grow and scroll */}
          <Layout style={{ display: 'flex', flexDirection: 'row', flex: 1, background: 'transparent', overflow: 'hidden' }}>
            {!isMobile && <AppMenu mobile={false} />}

            {/* Content Wrapper: Manages padding for fixed header/footer and scrolling */}
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

          {/* Mobile Bottom Navigation is placed outside the main content scrolling area */}
          {isMobile && <AppMenu mobile={true} />}
        </Layout>
      </Router>
    </ConfigProvider>
  );
}

export default App;

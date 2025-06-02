// File: AR_FRONTEND/src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { TonConnectButton } from '@tonconnect/ui-react';
import { Layout, Menu, ConfigProvider, theme as antdTheme, Typography, Grid } from 'antd';
import { 
    DollarCircleOutlined, 
    ExperimentOutlined, 
    UserOutlined, 
    BellOutlined, // For PUSH
    CheckSquareOutlined // For TASK
} from '@ant-design/icons';
import './App.css'; 
import EarnPage from './pages/EarnPage';
import GamePage from './pages/GamePage';
import UserPage from './pages/UserPage';

const { Header, Content, Sider, Footer } = Layout;
const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

// Placeholder pages for TASK and PUSH
const TaskPagePlaceholder = () => (
    <div style={{ padding: 24, textAlign: 'center', color: '#e0e0e0', minHeight: 'calc(100vh - 128px)' }}>
        <Title level={2} style={{color: 'white'}}>TASK Page</Title>
        <Text style={{color: '#aaa'}}>Complete tasks to earn ARIX! This section is coming soon.</Text>
    </div>
);
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

  const menuItems = [
    { key: '/task', icon: <CheckSquareOutlined />, label: <NavLink to="/task">TASK</NavLink> },
    { key: '/game', icon: <ExperimentOutlined />, label: <NavLink to="/game">GAME</NavLink> },
    { key: '/push', icon: <BellOutlined />, label: <NavLink to="/push">PUSH</NavLink> },
    { key: '/earn', icon: <DollarCircleOutlined />, label: <NavLink to="/earn">EARN</NavLink> },
    { key: '/user', icon: <UserOutlined />, label: <NavLink to="/user">USER</NavLink> },
  ];

  if (mobile) {
    return (
      <Menu
        theme="dark"
        mode="horizontal"
        selectedKeys={[currentPath]}
        items={menuItems}
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          display: 'flex',
          justifyContent: 'space-around',
          background: 'rgba(20, 20, 30, 0.85)', // Darker, slightly more opaque for bottom bar
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        }}
        // For mobile bottom nav, icons are often more prominent or labels are smaller
        // This requires custom styling for Menu.Item if antd default is not sufficient
      />
    );
  }

  return (
    <Sider
      width={200}
      breakpoint="lg" // AntD's Sider will collapse based on this
      collapsedWidth="0" // Will disappear entirely on small screens if triggered
      trigger={null} // No default trigger, controlled by breakpoint
      style={{
        background: 'rgba(25, 25, 35, 0.6)', // From your theme
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderRight: '1px solid rgba(255, 255, 255, 0.1)',
        height: 'calc(100vh - 64px)', // Full height minus header
        position: 'sticky',
        top: '64px', // Sticky below the header
        zIndex: 9,
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
  const isMobile = !screens.lg; // Consider lg breakpoint for Sider collapse

  // Full ARIX_DARK_THEME object from your provided App.jsx
  const ARIX_DARK_THEME = {
    algorithm: antdTheme.darkAlgorithm,
    token: {
      colorPrimary: '#00adee',
      colorInfo: '#00adee',
      colorSuccess: '#52c41a',
      colorError: '#ff4d4f',
      colorWarning: '#faad14',
      colorTextBase: '#e0e0e0',
      colorBgBase: '#101018', // Main background
      colorBgContainer: 'rgba(26, 26, 34, 0.8)', // Default for Cards, Modals if not overridden
      colorBgElevated: 'rgba(30, 30, 40, 0.85)', // For popovers, dropdowns, modals that need to stand out
      colorBorder: 'rgba(255, 255, 255, 0.15)',
      colorBorderSecondary: 'rgba(255, 255, 255, 0.1)',
      borderRadius: 12,
      fontFamily: "'Inter', sans-serif",
    },
    components: {
      Layout: {
        headerBg: 'rgba(20, 20, 30, 0.7)', // Glassmorphic header
        siderBg: 'rgba(25, 25, 35, 0.6)', // Glassmorphic sider
        bodyBg: '#101018', // Ensure body matches base
        footerBg: 'transparent',
      },
      Menu: {
        darkItemBg: 'transparent',
        darkItemSelectedBg: 'rgba(0, 173, 238, 0.2)', // ARIX blue selection
        darkItemColor: 'rgba(220, 220, 230, 0.75)',
        darkItemSelectedColor: '#00adee',
        darkItemHoverBg: 'rgba(255, 255, 255, 0.05)',
        darkItemHoverColor: '#00adee',
        darkSubMenuItemBg: 'rgba(30, 30, 45, 0.4)',
        // For horizontal mobile menu
        horizontalItemSelectedColor: '#00adee',
        itemHeight: 50, // For bottom nav items
      },
      Button: {
        colorPrimary: '#00adee',
        colorTextLightSolid: '#fff',
        colorBgContainerDisabled: '#303030',
        colorTextDisabled: '#777',
        // Default button styling if needed
        defaultBg: 'rgba(50, 50, 60, 0.7)',
        defaultColor: '#e0e0e0',
        defaultBorderColor: 'rgba(255, 255, 255, 0.2)',
        defaultHoverBg: 'rgba(60, 60, 70, 0.8)',
        defaultHoverColor: '#00adee',
        defaultActiveBg: 'rgba(40, 40, 50, 0.6)',
      },
      Card: {
         colorBgContainer: 'rgba(40, 42, 58, 0.5)', // Neumorphic/Glass Card base
         colorBorderSecondary: 'rgba(255, 255, 255, 0.08)',
         colorTextHeading: '#00adee', // Card titles
      },
      Modal: {
         colorBgElevated: 'rgba(30, 30, 40, 0.9)', // Modals should be more opaque
         colorBorderSecondary: 'rgba(255, 255, 255, 0.1)',
         colorTextHeading: '#00adee',
         boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.37)", // Stronger shadow for modals
      },
      InputNumber: {
         colorBgContainer: 'rgba(20, 22, 30, 0.5)',
         colorBorder: 'rgba(255, 255, 255, 0.1)',
         colorText: '#e0e0e0',
         colorTextDisabled: '#777',
         colorFillAlter: '#2a2a2a', // Addon background
      },
      Statistic: {
        titleFontSize: 14,
        contentFontSize: 20, // Default, can be overridden per instance
        colorTextSecondary: '#aaa', // Title color
        colorText: '#e0e0e0', // Value color
      },
      Radio: {
        buttonSolidCheckedBg: '#00adee',
        buttonSolidCheckedColor: '#fff',
        buttonSolidCheckedHoverBg: '#00bfff',
        buttonSolidCheckedActiveBg: '#008cdd',
        colorBorder: 'rgba(255, 255, 255, 0.2)',
      },
      Tabs: {
        cardBg: 'transparent', // For tabs with card style
        itemColor: 'rgba(220, 220, 230, 0.65)',
        itemSelectedColor: '#00adee',
        itemHoverColor: '#00bfff',
        inkBarColor: '#00adee',
        horizontalMargin: '0',
        titleFontSize: '1em',
      },
      Spin: { // Customizing spin color
        colorPrimary: '#00adee',
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
              padding: '0 16px', // Reduced padding for mobile
              background: ARIX_DARK_THEME.components.Layout.headerBg,
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              borderBottom: `1px solid ${ARIX_DARK_THEME.token.colorBorderSecondary}`,
              position: 'sticky',
              top: 0,
              zIndex: 1001, // Ensure header is above sider/content
            }}
          >
            <Title level={isMobile ? 4 : 3} style={{ color: ARIX_DARK_THEME.token.colorPrimary, margin: 0, fontWeight: 'bold' }}>
              ARIX Terminal
            </Title>
            <TonConnectButton />
          </Header>
          <Layout style={{ background: 'transparent', paddingTop: '64px' /* Account for fixed header */ }}>
            {!isMobile && <AppMenu mobile={false} />}
            <Layout style={{ 
                paddingBottom: isMobile ? '50px' : '0', // Space for bottom nav on mobile
                background: 'transparent' 
            }}>
              <Content
                style={{
                  padding: isMobile ? '16px' : '24px', // Less padding on mobile
                  margin: 0,
                  minHeight: 'calc(100vh - 64px - (isMobile ? 50px : 0px))', // Adjust for header and bottom nav
                  background: 'transparent', // Content area itself is transparent
                  color: ARIX_DARK_THEME.token.colorTextBase,
                  overflowY: 'auto', // Allow content to scroll
                }}
              >
                <Routes>
                  <Route path="/" element={<EarnPage />} />
                  <Route path="/earn" element={<EarnPage />} />
                  <Route path="/game" element={<GamePage />} />
                  <Route path="/user" element={<UserPage />} />
                  <Route path="/task" element={<TaskPagePlaceholder />} />
                  <Route path="/push" element={<PushPagePlaceholder />} />
                </Routes>
              </Content>
            </Layout>
          </Layout>
          {isMobile && <AppMenu mobile={true} />} {/* Bottom navigation for mobile */}
        </Layout>
      </Router>
    </ConfigProvider>
  );
}

export default App;

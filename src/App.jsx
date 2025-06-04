// File: AR_FRONTEND/src/App.jsx
import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { TonConnectButton, useTonConnectUI } from '@tonconnect/ui-react';
import { Layout, Menu, ConfigProvider, theme as antdTheme, Typography, Grid, Spin } from 'antd';
import {
  DollarCircleOutlined, // EARN
  ExperimentOutlined,   // GAME (Using this for now, mockups have a dice/controller like icon)
  UserOutlined,         // USER
  BellOutlined,         // PUSH (Mockups have a play button in circle, Bell is a common alternative)
  TeamOutlined,         // New for REFERRAL (replaces Task icon from original code)
} from '@ant-design/icons';

import './App.css'; // Main app styles
import ResponsiveMobileNav from './components/ResponsiveMobileNav'; // Mobile navigation
import { TELEGRAM_BOT_USERNAME, REFERRAL_LINK_BASE, TONCONNECT_MANIFEST_URL } from './utils/constants';

// Lazy load pages for better initial load time
const EarnPage = lazy(() => import('./pages/EarnPage'));
const GamePage = lazy(() => import('./pages/GamePage'));
const UserPage = lazy(() => import('./pages/UserPage'));
const TaskPage = lazy(() => import('./pages/TaskPage')); // General tasks if still used
const ReferralPage = lazy(() => import('./pages/ReferralPage')); // New page for referrals
const PushPage = lazy(() => import('./pages/PushPage'));

const { Header, Content, Sider } = Layout;
const { Title } = Typography;
const { useBreakpoint } = Grid;

// Updated menuConfig based on mockups and new ReferralPage
// The "TASK" tab from original code is now "REFERRAL" based on mockups and requirements
const menuConfig = [
  { key: '/earn', icon: <DollarCircleOutlined />, labelText: "EARN" },
  { key: '/game', icon: <ExperimentOutlined />, labelText: "GAME" },
  { key: '/referral', icon: <TeamOutlined />, labelText: "REFERRAL" },
  { key: '/push', icon: <BellOutlined />, labelText: "PUSH" },
  { key: '/user', icon: <UserOutlined />, labelText: "USER" },
];

const DesktopMenu = () => {
  const location = useLocation();
  const navigate = useNavigate();
  let currentPath = location.pathname;
  // Default to Earn page if at root or unrecognized path for selection
  if (!menuConfig.some(item => item.key === currentPath)) {
    currentPath = '/earn';
  }


  const desktopMenuItems = menuConfig.map(item => ({
    key: item.key,
    icon: React.cloneElement(item.icon, { style: { fontSize: '16px' } }),
    label: item.labelText,
    onClick: () => navigate(item.key),
    style: { padding: '0 18px', fontSize: '0.9rem', fontWeight: 500 }, // Adjusted padding and font weight
  }));

  return (
      <Sider
          width={200} // Slightly wider sider
          className="desktop-sider"
          breakpoint="lg" // Breakpoint at which sider collapses
          collapsedWidth="0" // Fully collapse
          trigger={null} // No native trigger, controlled by layout
      >
        <div className="desktop-sider-logo-container">
          {/* You can add a logo here if you have one */}
          {/* <img src="/img/arix-logo-sidebar.png" alt="ARIX Logo" style={{ height: '40px', margin: '12px auto', display: 'block' }} /> */}
        </div>
        <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[currentPath]}
            items={desktopMenuItems}
            style={{ height: 'calc(100% - 60px)', borderRight: 0, background: 'transparent', padding: '10px 0' }}
        />
      </Sider>
  );
};

function App() {
  const screens = useBreakpoint();
  const isMobile = !screens.lg; // Use AntD's lg breakpoint for "desktop" view
  const [tonConnectUI, setOptions] = useTonConnectUI();

  useEffect(() => {
    // Update TonConnectUI options if needed, e.g., language
    // setOptions({ language: 'en' });

    // Extract referral code from URL and store it
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');
    if (refCode) {
      localStorage.setItem('arixReferralCode', refCode);
      // Clean the URL
      // window.history.replaceState({}, document.title, window.location.pathname);
    }

    // Initialize Telegram Web App SDK
    if (window.Telegram && window.Telegram.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      tg.expand();
      // Set theme params based on the app's dark theme
      // These colors should match your TELEGRAM_DARK_THEME for consistency
      tg.setHeaderColor('#121212'); // Match app-header background
      tg.setBackgroundColor('#000000'); // Match app-layout background

      // If you want to use Telegram's theme params instead:
      // const themeParams = tg.themeParams;
      // console.log("Telegram Theme Params:", themeParams);
      // You could then adapt your AntD theme dynamically, but for now, we use a fixed dark theme.
    }
  }, [setOptions]);

  // Theme configuration to match mockups (dark, purple/blue accents)
  const TELEGRAM_DARK_THEME = {
    algorithm: antdTheme.darkAlgorithm,
    token: {
      colorPrimary: '#7065F0', // Main accent color from mockups (buttons, highlights) - A bit more vibrant purple
      colorInfo: '#58D6FF',    // Light blue for info elements or alternative accents
      colorSuccess: '#4CAF50', // Green for success
      colorError: '#F44336',   // Red for errors
      colorWarning: '#FFC107', // Yellow for warnings
      colorTextBase: '#E0E0E5', // Primary light text on dark backgrounds
      colorTextSecondary: '#A0A0A5', // Softer text for less important info
      colorTextTertiary: '#8E8E93',  // Even softer text
      colorTextQuaternary: '#6A6A6E',// Very subtle text, like placeholders
      colorBgBase: '#0D0D0D',      // Main app background - very dark grey, almost black
      colorBgContainer: '#1A1A1A', // Card backgrounds, modal backgrounds - slightly lighter dark grey
      colorBgElevated: '#252525',  // Popovers, dropdowns - a step lighter
      colorBgLayout: '#0D0D0D',    // Main layout background (Header, Sider might be slightly different)
      colorBorder: '#303030',      // Borders for cards, inputs - subtle
      colorBorderSecondary: '#252525', // Dividers, table borders
      colorSplit: '#252525',       // Split lines in components like List
      borderRadius: 10,          // General border radius for cards, buttons
      borderRadiusLG: 14,        // Larger border radius for modals, main containers
      borderRadiusSM: 6,         // Smaller border radius for tags, small elements
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'",
      controlHeight: 38,         // Standard height for inputs, buttons
      controlHeightLG: 42,       // Large controls
      controlHeightSM: 30,       // Small controls
      fontSize: 14,
      fontSizeLG: 16,            // Larger text size
      fontSizeSM: 12,            // Smaller text size
      wireframe: false,          // Set to true to see component outlines
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)', // Softer default shadow for cards
      boxShadowSecondary: '0 6px 20px rgba(0, 0, 0, 0.25)', // For modals/popovers
    },
    components: {
      Layout: {
        headerBg: '#1A1A1A', // Header slightly different from main layout bg
        siderBg: '#1A1A1A',  // Sider background
        bodyBg: '#0D0D0D',   // Main content area background
      },
      Menu: {
        darkItemBg: 'transparent',
        darkItemSelectedBg: 'rgba(112, 101, 240, 0.15)', // Selected item background in menu
        darkItemColor: '#A0A0A5',
        darkItemSelectedColor: '#7065F0',
        darkItemHoverBg: 'rgba(112, 101, 240, 0.1)',
        darkItemHoverColor: '#8c80f3',
        itemHeight: 42,
        subMenuItemBg: '#1A1A1A',
        popupBg: '#252525', // For dropdown menus from "More" in mobile nav
      },
      Button: {
        colorPrimary: '#7065F0',
        colorTextLightSolid: '#FFFFFF',
        defaultBg: '#2C2C2E',
        defaultColor: '#E0E0E5',
        defaultBorderColor: '#38383A',
        defaultHoverBg: '#353537',
        defaultHoverBorderColor: '#7065F0',
        defaultHoverColor: '#8c80f3',
        defaultActiveBg: '#252527',
        borderRadius: 8,
        controlHeight: 38,
      },
      Card: {
        colorBgContainer: '#1A1A1A',
        colorBorderSecondary: '#303030',
        colorTextHeading: '#FFFFFF',
        borderRadiusLG: 14,
        paddingLG: 20,
        actionsBg: '#1A1A1A',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
      },
      Modal: {
        colorBgElevated: '#1A1A1A',
        colorBorderSecondary: '#303030',
        colorTextHeading: '#FFFFFF',
        borderRadiusLG: 14,
      },
      Input: {
        colorBgContainer: '#252525',
        colorBorder: '#303030',
        colorText: '#E0E0E5',
        colorTextPlaceholder: '#6A6A6E',
        borderRadius: 8,
        controlHeight: 38,
      },
      InputNumber: {
        colorBgContainer: '#252525',
        colorBorder: '#303030',
        colorText: '#E0E0E5',
        borderRadius: 8,
        controlHeight: 38,
        handleBg: '#252525',
        handleHoverColor: '#7065F0',
      },
      Statistic: {
        titleFontSize: 13,
        contentFontSize: 20,
        colorTextDescription: '#8E8E93',
        colorText: '#FFFFFF',
      },
      Radio: {
        buttonSolidCheckedBg: '#7065F0',
        buttonSolidCheckedHoverBg: '#8c80f3',
        buttonSolidCheckedActiveBg: '#6255e0',
        colorBorder: '#303030',
        borderRadius: 8,
        buttonPaddingInline: 15,
        controlHeight: 38,
      },
      Tabs: {
        cardBg: '#1A1A1A',
        itemColor: '#A0A0A5',
        itemSelectedColor: '#FFFFFF',
        itemHoverColor: '#C0C0C5',
        inkBarColor: '#7065F0',
        horizontalMargin: '0',
        titleFontSize: isMobile ? 14 : 15,
        cardPadding: '12px 16px', // Padding for tabs card style
      },
      Spin: { colorPrimary: '#7065F0',},
      Alert: {
        colorInfoBg: 'rgba(88, 214, 255, 0.1)',
        colorInfoBorder: 'rgba(88, 214, 255, 0.2)',
        colorSuccessBg: 'rgba(76, 175, 80, 0.1)',
        colorSuccessBorder: 'rgba(76, 175, 80, 0.2)',
        colorWarningBg: 'rgba(255, 193, 7, 0.1)',
        colorWarningBorder: 'rgba(255, 193, 7, 0.2)',
        colorErrorBg: 'rgba(244, 67, 54, 0.1)',
        colorErrorBorder: 'rgba(244, 67, 54, 0.2)',
        borderRadiusLG: 12,
      },
      List: {
        colorSplit: '#252525',
      },
      Descriptions: {
        colorTextSecondary: '#A0A0A5',
        colorText: '#E0E0E5',
        labelBg: 'transparent',
      },
      Empty: {
        colorTextDisabled: '#6A6A6E',
      },
      Dropdown: { // For "More" menu in mobile nav
        colorBgElevated: '#252525',
        colorBorderSecondary: '#303030',
        borderRadiusLG: 10,
        controlItemBgHover: 'rgba(112, 101, 240, 0.1)',
        controlItemBgActive: 'rgba(112, 101, 240, 0.15)',
      }
    },
  };

  const loadingSpinner = (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 120px)' }}>
        <Spin size="large" tip="Loading Page..." />
      </div>
  );

  return (
      <ConfigProvider theme={TELEGRAM_DARK_THEME}>
        <Layout className="app-layout">
          <Header className="app-header">
            <div className="app-header-logo-area">
              {/* Placeholder for logo if needed, or just title */}
              <img src="/img/arix-logo-header.png" alt="ARIX" className="app-header-logo" onError={(e) => e.currentTarget.style.display='none'}/>
              <Title level={isMobile ? 5 : 4} className="app-header-title">
                TERMINAL
              </Title>
            </div>
            <TonConnectButton className="ton-connect-button-custom" />
          </Header>

          <Layout className="app-main-layout-container">
            {!isMobile && <DesktopMenu />}

            <Layout className={`app-content-wrapper ${isMobile ? "mobile-view" : ""}`}>
              <Content className="app-content">
                <Suspense fallback={loadingSpinner}>
                  <Routes>
                    <Route path="/" element={<EarnPage />} />
                    <Route path="/earn" element={<EarnPage />} />
                    <Route path="/game" element={<GamePage />} />
                    <Route path="/referral" element={<ReferralPage />} />
                    <Route path="/tasks" element={<TaskPage />} />
                    <Route path="/push" element={<PushPage />} />
                    <Route path="/user" element={<UserPage />} />
                  </Routes>
                </Suspense>
              </Content>
            </Layout>
          </Layout>

          {isMobile && <ResponsiveMobileNav menuConfig={menuConfig} />}
        </Layout>
      </ConfigProvider>
  );
}

// Wrap App with Router if it's not already done in main.jsx
const RootApp = () => (
    <Router>
      <App />
    </Router>
);

export default RootApp;

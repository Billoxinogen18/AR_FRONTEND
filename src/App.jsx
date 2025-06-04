
import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { TonConnectButton, useTonConnectUI } from '@tonconnect/ui-react';
import { Layout, Menu, ConfigProvider, theme as antdTheme, Typography, Grid, Spin } from 'antd';
import {
  DollarCircleOutlined, 
  ExperimentOutlined,   
  UserOutlined,         
  BellOutlined,         
  TeamOutlined,         
} from '@ant-design/icons';

import './App.css'; 
import ResponsiveMobileNav from './components/ResponsiveMobileNav'; 
import { TELEGRAM_BOT_USERNAME, REFERRAL_LINK_BASE, TONCONNECT_MANIFEST_URL } from './utils/constants';


const EarnPage = lazy(() => import('./pages/EarnPage'));
const GamePage = lazy(() => import('./pages/GamePage'));
const UserPage = lazy(() => import('./pages/UserPage'));
const TaskPage = lazy(() => import('./pages/TaskPage')); 
const ReferralPage = lazy(() => import('./pages/ReferralPage')); 
const PushPage = lazy(() => import('./pages/PushPage'));

const { Header, Content, Sider } = Layout;
const { Title } = Typography;
const { useBreakpoint } = Grid;



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
  
  if (!menuConfig.some(item => item.key === currentPath)) {
    currentPath = '/earn';
  }


  const desktopMenuItems = menuConfig.map(item => ({
    key: item.key,
    icon: React.cloneElement(item.icon, { style: { fontSize: '16px' } }),
    label: item.labelText,
    onClick: () => navigate(item.key),
    style: { padding: '0 18px', fontSize: '0.9rem', fontWeight: 500 }, 
  }));

  return (
      <Sider
          width={200} 
          className="desktop-sider"
          breakpoint="lg" 
          collapsedWidth="0" 
          trigger={null} 
      >
        <div className="desktop-sider-logo-container">
          {}
          {}
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
  const isMobile = !screens.lg; 
  const [tonConnectUI, setOptions] = useTonConnectUI();

  useEffect(() => {
    
    

    
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');
    if (refCode) {
      localStorage.setItem('arixReferralCode', refCode);
      
      
    }

    
    if (window.Telegram && window.Telegram.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      tg.expand();
      
      
      tg.setHeaderColor('#121212'); 
      tg.setBackgroundColor('#000000'); 

      
      
      
      
    }
  }, [setOptions]);

  
  const TELEGRAM_DARK_THEME = {
    algorithm: antdTheme.darkAlgorithm,
    token: {
      colorPrimary: '#7065F0', 
      colorInfo: '#58D6FF',    
      colorSuccess: '#4CAF50', 
      colorError: '#F44336',   
      colorWarning: '#FFC107', 
      colorTextBase: '#E0E0E5', 
      colorTextSecondary: '#A0A0A5', 
      colorTextTertiary: '#8E8E93',  
      colorTextQuaternary: '#6A6A6E',
      colorBgBase: '#0D0D0D',      
      colorBgContainer: '#1A1A1A', 
      colorBgElevated: '#252525',  
      colorBgLayout: '#0D0D0D',    
      colorBorder: '#303030',      
      colorBorderSecondary: '#252525', 
      colorSplit: '#252525',       
      borderRadius: 10,          
      borderRadiusLG: 14,        
      borderRadiusSM: 6,         
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'",
      controlHeight: 38,         
      controlHeightLG: 42,       
      controlHeightSM: 30,       
      fontSize: 14,
      fontSizeLG: 16,            
      fontSizeSM: 12,            
      wireframe: false,          
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)', 
      boxShadowSecondary: '0 6px 20px rgba(0, 0, 0, 0.25)', 
    },
    components: {
      Layout: {
        headerBg: '#1A1A1A', 
        siderBg: '#1A1A1A',  
        bodyBg: '#0D0D0D',   
      },
      Menu: {
        darkItemBg: 'transparent',
        darkItemSelectedBg: 'rgba(112, 101, 240, 0.15)', 
        darkItemColor: '#A0A0A5',
        darkItemSelectedColor: '#7065F0',
        darkItemHoverBg: 'rgba(112, 101, 240, 0.1)',
        darkItemHoverColor: '#8c80f3',
        itemHeight: 42,
        subMenuItemBg: '#1A1A1A',
        popupBg: '#252525', 
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
        cardPadding: '12px 16px', 
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
      Dropdown: { 
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
              {}
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


const RootApp = () => (
    <Router>
      <App />
    </Router>
);

export default RootApp;

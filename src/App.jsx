import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, useLocation, Link } from 'react-router-dom';
import { TonConnectButton } from '@tonconnect/ui-react';
import { Layout, Menu, ConfigProvider, theme as antdTheme, Typography, Grid, Button, Row, Col, Space, Affix } from 'antd';
import {
    DollarCircleOutlined,
    ExperimentOutlined,
    UserOutlined,
    CheckSquareOutlined,
    CloseOutlined,
    MoreOutlined,
    RiseOutlined,
    FallOutlined,
    ThunderboltOutlined,
    SettingOutlined,
    CustomerServiceOutlined,
    ReadOutlined,
    PlaySquareOutlined,
    RedditOutlined,
} from '@ant-design/icons';
import './App.css';
import EarnPage from './pages/EarnPage';
import GamePage from './pages/GamePage';
import UserPage from './pages/UserPage';
import TaskPage from './pages/TaskPage';
import PushPage from './pages/PushPage';

const { Header, Content } = Layout;
const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const AppHeader = () => {
  const isMobile = !useBreakpoint().lg;
  return (
    <Affix offsetTop={0}>
      <Header
        className="app-header"
        style={{
          background: '#121212',
          borderBottom: '1px solid #2C2C2C',
        }}
      >
        <Button type="text" icon={<CloseOutlined style={{ color: '#8A8A8A' }} />} onClick={() => console.log("Close TMA")} />
        <Title level={4} style={{ color: '#E0E0E5', margin: 0, display: 'flex', alignItems: 'center' }}>
          <RedditOutlined style={{ color: '#00BFFF', marginRight: 8 }} /> TERMINAL
        </Title>
        <Button type="text" icon={<MoreOutlined style={{ color: '#8A8A8A' }} />} />
      </Header>
    </Affix>
  );
};

const BalanceHeader = () => {
    const isMobile = !useBreakpoint().md;
    return (
        <div className="main-balance-header">
            <div className="balance-display">
                <RedditOutlined className="anticon-golden" />
                <Text className="balance-value">0</Text>
                <Text className="balance-currency">TON</Text>
            </div>
            <Row gutter={isMobile ? 8 : 16} justify="center">
                <Col>
                    <Button icon={<RiseOutlined />} style={{ minWidth: isMobile ? '100px' : '120px' }}>Top up</Button>
                </Col>
                <Col>
                    <Button icon={<FallOutlined />} style={{ minWidth: isMobile ? '100px' : '120px' }}>Cashout</Button>
                </Col>
            </Row>
            <div className="coinflip-banner">
                <Text>X2 or maybe x256? <Link to="/game" style={{ fontWeight: 'bold' }}>Play Coinflip and try your luck! →</Link></Text>
            </div>
        </div>
    );
};


const AppMenu = ({ mobile }) => {
  const location = useLocation();
  let currentPath = location.pathname;
  if (currentPath === '/' || currentPath === '') {
    currentPath = '/earn';
  }

  const menuItems = [
    { key: '/task', icon: <CheckSquareOutlined />, labelText: 'TASK' },
    { key: '/game', icon: <ExperimentOutlined />, labelText: 'GAME' },
    { key: '/push', icon: <ThunderboltOutlined />, labelText: 'PUSH', className: 'push-nav-item' },
    { key: '/earn', icon: <DollarCircleOutlined />, labelText: 'EARN' },
    { key: '/user', icon: <UserOutlined />, labelText: 'USER' },
  ];

  const processedMenuItems = menuItems.map(item => ({
    key: item.key,
    icon: item.icon,
    className: item.className || '',
    label: mobile ? <span className="mobile-menu-label">{item.labelText}</span> : <NavLink to={item.key} key={`${item.key}-nav`}>{item.labelText}</NavLink>,
  }));


  if (mobile) {
    return (
      <Menu
        theme="dark"
        mode="horizontal"
        selectedKeys={[currentPath]}
        items={processedMenuItems}
        className="mobile-bottom-nav"
      />
    );
  }

  return null;
};

function App() {
  const screens = useBreakpoint();
  const isMobile = !screens.lg;

  const TERMINAL_DARK_THEME = {
    algorithm: antdTheme.darkAlgorithm,
    token: {
      colorPrimary: '#00BFFF', colorInfo: '#00BFFF', colorSuccess: '#4CAF50',
      colorError: '#F44336', colorWarning: '#FF9800', colorTextBase: '#E0E0E5',
      colorBgBase: '#0D0D0D', colorBgContainer: '#1A1A1A',
      colorBgElevated: '#1F1F1F', colorBorder: '#2C2C2C',
      colorBorderSecondary: '#252525', borderRadius: 8,
      fontFamily: "'Inter', sans-serif",
    },
    components: {
      Layout: {
        headerBg: '#121212',
        siderBg: '#181818',
        bodyBg: '#0D0D0D',
      },
      Menu: {
        darkItemBg: 'transparent',
        darkItemSelectedBg: 'transparent',
        darkItemColor: '#8A8A8A',
        darkItemSelectedColor: '#00BFFF',
        darkItemHoverBg: 'rgba(255, 255, 255, 0.03)',
        darkItemHoverColor: '#00BFFF',
        itemHeight: 60,
      },
      Button: {
        colorPrimary: '#00BFFF', colorTextLightSolid: '#111',
        colorBgContainerDisabled: '#2C2C2C', colorTextDisabled: '#555',
        defaultBg: '#252525', defaultColor: '#E0E0E5',
        defaultBorderColor: '#333', defaultHoverBg: '#303030',
        defaultHoverColor: '#00BFFF', defaultActiveBg: '#202020',
        defaultGhostColor: '#00BFFF', defaultGhostBorderColor: '#00BFFF',
        fontWeight: 500,
      },
      Card: {
         colorBgContainer: '#1A1A1A', colorBorderSecondary: '#2C2C2C',
         colorTextHeading: '#00BFFF',
      },
      Modal: {
         colorBgElevated: '#1F1F1F', colorBorderSecondary: '#2C2C2C',
         colorTextHeading: '#00BFFF', boxShadow: "0 6px 24px 0 rgba(0, 0, 0, 0.2)",
      },
      InputNumber: {
         colorBgContainer: '#252525', colorBorder: '#333',
         colorText: '#E0E0E5', colorTextDisabled: '#555', colorFillAlter: '#202020',
         activeBorderColor: '#00BFFF', hoverBorderColor: '#009FCC',
      },
      Input: {
        colorBgContainer: '#252525', colorBorder: '#333',
        colorText: '#E0E0E5', colorTextDisabled: '#555',
        activeBorderColor: '#00BFFF', hoverBorderColor: '#009FCC',
        addonBg: '#1F1F1F',
      },
      Statistic: {
        titleFontSize: 14, contentFontSize: 20,
        colorTextSecondary: '#8A8A8A', colorText: '#E0E0E5',
      },
      Radio: {
        buttonSolidCheckedBg: '#00BFFF', buttonSolidCheckedColor: '#111',
        buttonSolidCheckedHoverBg: '#00AADD', buttonSolidCheckedActiveBg: '#0088BB',
        colorBorder: '#333',
        buttonBg: '#252525', buttonColor: '#E0E0E5',
      },
      Tabs: {
        cardBg: 'transparent', itemColor: '#8A8A8A',
        itemSelectedColor: '#00BFFF', itemHoverColor: '#00AADD',
        inkBarColor: '#00BFFF', horizontalMargin: '0', titleFontSize: '1em',
        colorBorderSecondary: '#2C2C2C',
      },
      Spin: { colorPrimary: '#00BFFF',},
      Alert: {
        colorInfoBg: 'rgba(0, 191, 255, 0.1)',
        colorInfoBorder: 'rgba(0, 191, 255, 0.3)',
        colorInfoIcon: '#00BFFF',
      },
      List: {
        itemPadding: '12px 0',
        colorSplit: '#2C2C2C',
      },
      Empty: {
        colorText: '#8A8A8A',
        colorTextDisabled: '#555',
      }
    },
  };

  return (
    <ConfigProvider theme={TERMINAL_DARK_THEME}>
      <Router>
        <Layout style={{ minHeight: '100vh', background: TERMINAL_DARK_THEME.token.colorBgBase, display: 'flex', flexDirection: 'column' }}>
          <AppHeader />
          <BalanceHeader />

          <Layout style={{ display: 'flex', flexDirection: 'row', flex: 1, background: 'transparent', overflow: 'hidden' }}>
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

          <TonConnectButton style={{ position: 'fixed', bottom: isMobile? '70px' : '20px', right: '20px', zIndex: 1002 }} />
          {isMobile && <AppMenu mobile={true} />}
        </Layout>
      </Router>
    </ConfigProvider>
  );
}

export default App;
// File: ar_terminal/tma_frontend/src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { TonConnectButton } from '@tonconnect/ui-react';
import { Layout, Menu } from 'antd';

import './App.css';
import EarnPage from './pages/EarnPage'; // Import the actual EarnPage
// Import other actual pages when ready
// import GamePage from './pages/GamePage';
// import UserPage from './pages/UserPage';

const { Header, Content, Footer, Sider } = Layout;

// Placeholders for pages not yet fully built out
const GamePagePlaceholder = () => <div style={{ padding: 24, textAlign: 'center', color: 'white' }}>GAME Page (Coinflip) - Coming Soon!</div>;
const UserPagePlaceholder = () => <div style={{ padding: 24, textAlign: 'center', color: 'white' }}>USER Page (Profile & Settings) - Coming Soon!</div>;

// Helper component to get current path for Menu default selection
const CurrentPathMenu = () => {
  const location = useLocation();
  const currentPath = location.pathname === '/' ? '/earn' : location.pathname;
  return (
    <Menu
      theme="dark"
      mode="inline"
      selectedKeys={[currentPath]}
      style={{ height: '100%', borderRight: 0, backgroundColor: '#1f1f1f' }}
    >
      <Menu.Item key="/earn">
        <NavLink to="/earn">EARN</NavLink>
      </Menu.Item>
      <Menu.Item key="/game">
        <NavLink to="/game">GAME</NavLink>
      </Menu.Item>
      <Menu.Item key="/user">
        <NavLink to="/user">USER</NavLink>
      </Menu.Item>
    </Menu>
  );
};

function App() {
  return (
    <Router>
      <Layout style={{ minHeight: '100vh' }}>
        <Header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', backgroundColor: '#141414', borderBottom: '1px solid #303030' }}>
          <div style={{ color: 'white', fontSize: '20px' }}>ARIX Terminal</div>
          <TonConnectButton />
        </Header>
        <Layout>
          <Sider width={200} style={{ background: '#1f1f1f', borderRight: '1px solid #303030' }}>
            <CurrentPathMenu />
          </Sider>
          <Layout style={{ padding: '0', backgroundColor: '#000' }}>
            <Content
              style={{
                padding: 24,
                margin: 0,
                minHeight: 280,
                background: '#0a0a0a', 
                color: 'white'
              }}
            >
              <Routes>
                <Route path="/" element={<EarnPage />} /> {/* Default to EarnPage */}
                <Route path="/earn" element={<EarnPage />} />
                <Route path="/game" element={<GamePagePlaceholder />} /> {/* Use actual GamePage when ready */}
                <Route path="/user" element={<UserPagePlaceholder />} /> {/* Use actual UserPage when ready */}
              </Routes>
            </Content>
          </Layout>
        </Layout>
        <Footer style={{ textAlign: 'center', backgroundColor: '#000', color: '#aaa', borderTop: '1px solid #303030' }}>
          ARIX Terminal ©2025 Created with ARIX
        </Footer>
      </Layout>
    </Router>
  );
}

export default App;
// File: AR_Proj/AR_FRONTEND/src/pages/UserPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Typography, Tabs, message, Spin, Button } from 'antd';
import { useTonAddress } from '@tonconnect/ui-react';
import UserProfileCard from '../components/user/UserProfileCard';
import TransactionList, { renderStakeHistoryItem, renderCoinflipHistoryItem } from '../components/user/TransactionList';
import { getAllUserStakes, getCoinflipHistoryForUser } from '../services/api';

const { Title, Text } = Typography;

const UserPage = () => {
  const userFriendlyAddress = useTonAddress();
  const rawAddress = useTonAddress(false);
  const [stakeHistory, setStakeHistory] = useState([]);
  const [coinflipHistory, setCoinflipHistory] = useState([]);
  const [loadingStakes, setLoadingStakes] = useState(false);
  const [loadingCoinflips, setLoadingCoinflips] = useState(false);
  const [activeTab, setActiveTab] = useState('stakes');

  const fetchAllStakeHistory = useCallback(async () => {
    if (!rawAddress) return;
    setLoadingStakes(true);
    try {
      const response = await getAllUserStakes(rawAddress);
      setStakeHistory(response.data || []);
    } catch (error) {
      message.error('Failed to fetch staking history.');
      console.error("Fetch all stakes error:", error);
    } finally {
      setLoadingStakes(false);
    }
  }, [rawAddress]);

  const fetchCoinflipHistory = useCallback(async () => {
    if (!rawAddress) return;
    setLoadingCoinflips(true);
    try {
      const response = await getCoinflipHistoryForUser(rawAddress);
      setCoinflipHistory(response.data || []);
    } catch (error) {
      message.error('Failed to fetch Coinflip game history.');
      console.error("Fetch coinflip history error:", error);
    } finally {
      setLoadingCoinflips(false);
    }
  }, [rawAddress]);

  useEffect(() => {
    if (rawAddress) {
      if (activeTab === 'stakes') {
        fetchAllStakeHistory();
      } else if (activeTab === 'games') {
        fetchCoinflipHistory();
      }
    } else {
        setStakeHistory([]);
        setCoinflipHistory([]);
    }
  }, [rawAddress, activeTab, fetchAllStakeHistory, fetchCoinflipHistory]);
  
  const handleRefreshAll = () => {
    if (rawAddress) {
      if (activeTab === 'stakes') fetchAllStakeHistory();
      if (activeTab === 'games') fetchCoinflipHistory();
      // UserProfileCard has its own internal refresh for balance
      message.success("Data refresh initiated!");
    }
  };

  const tabItems = [
    {
      key: 'stakes',
      label: 'Staking History',
      children: (
        <TransactionList
          items={stakeHistory}
          isLoading={loadingStakes}
          renderItemDetails={renderStakeHistoryItem}
          itemType="staking activity"
        />
      ),
    },
    {
      key: 'games',
      label: 'Coinflip Game History',
      children: (
        <TransactionList
          items={coinflipHistory}
          isLoading={loadingCoinflips}
          renderItemDetails={renderCoinflipHistoryItem}
          itemType="Coinflip game"
        />
      ),
    },
    // You can add more tabs for other game types or tasks later
  ];

  if (!userFriendlyAddress) {
     return (
      <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
        <Title level={2} style={{ color: 'white', marginBottom: '30px', fontWeight: 'bold' }}>User Profile</Title>
        <UserProfileCard /> {/* Shows connect wallet prompt if not connected */}
        <Text style={{color: '#aaa', display: 'block', marginTop: 20}}>Connect your wallet to see your ARIX Hub and history.</Text>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
      <Title level={2} style={{ color: 'white', textAlign: 'center', marginBottom: '30px', fontWeight: 'bold' }}>
        Your ARIX Hub
      </Title>
      <UserProfileCard />
      
      <div style={{marginTop: 20, marginBottom: 20, textAlign: 'right'}}>
        <Button onClick={handleRefreshAll} loading={loadingStakes || loadingCoinflips}>Refresh Current Tab History</Button>
      </div>

      <Tabs
        defaultActiveKey="stakes"
        items={tabItems}
        onChange={(key) => setActiveTab(key)}
        centered
        className="neumorphic-tabs" // You can add custom styling for tabs in App.css if needed
      />
    </div>
  );
};

export default UserPage;
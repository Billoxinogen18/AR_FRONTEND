// File: AR_FRONTEND/src/pages/UserPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Typography, Tabs, message, Spin, Button, Grid, Card } from 'antd';
import { useTonAddress, useTonConnectUI } from '@tonconnect/ui-react';
import UserProfileCard from '../components/user/UserProfileCard';
import TransactionList, { renderStakeHistoryItem, renderCoinflipHistoryItem } from '../components/user/TransactionList';
import { getUserStakesAndRewards, getCoinflipHistoryForUser, requestUsdtWithdrawal } from '../services/api';

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const UserPage = () => {
  const userFriendlyAddress = useTonAddress();
  const rawAddress = useTonAddress(false);
  const [tonConnectUI] = useTonConnectUI();
  
  const [profileAndStakeData, setProfileAndStakeData] = useState({ stakes: [], totalClaimableUsdt: '0.00' });
  const [coinflipHistory, setCoinflipHistory] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [isWithdrawalLoading, setIsWithdrawalLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('stakes');

  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const fetchDataForTab = useCallback(async (tabKey, showMessage = false) => {
    if (!rawAddress) {
      setProfileAndStakeData({ stakes: [], totalClaimableUsdt: '0.00' });
      setCoinflipHistory([]);
      setLoadingData(false);
      return;
    }
    setLoadingData(true);
    try {
      if (tabKey === 'stakes') {
        const response = await getUserStakesAndRewards(rawAddress); 
        setProfileAndStakeData({
            stakes: response.data?.stakes || [],
            totalClaimableUsdt: response.data?.totalClaimableUsdt || '0.00'
        });
      } else if (tabKey === 'games') {
        const response = await getCoinflipHistoryForUser(rawAddress);
        setCoinflipHistory(response.data || []);
      }
      if (showMessage) message.success("Data refreshed!");
    } catch (error) {
      message.error(`Failed to fetch ${tabKey} history.`);
      console.error(`Fetch ${tabKey} error:`, error);
      if (tabKey === 'stakes') setProfileAndStakeData({ stakes: [], totalClaimableUsdt: '0.00' });
      if (tabKey === 'games') setCoinflipHistory([]);
    } finally {
      setLoadingData(false);
    }
  }, [rawAddress]);

  useEffect(() => {
    if (userFriendlyAddress) { // Fetch data when wallet is connected
        fetchDataForTab(activeTab);
    } else { // Clear data if wallet disconnects
        setProfileAndStakeData({ stakes: [], totalClaimableUsdt: '0.00' });
        setCoinflipHistory([]);
        setLoadingData(false); // No data to load if not connected
    }
  }, [userFriendlyAddress, activeTab, fetchDataForTab]); // Re-fetch if userFriendlyAddress or tab changes
  
  const handleRefreshAllData = () => {
      if (userFriendlyAddress) {
          fetchDataForTab(activeTab, true); // Pass true to show refresh message
          // UserProfileCard handles its own ARIX balance refresh internally,
          // but USDT total is refreshed via fetchDataForTab.
      } else {
          message.warn("Connect your wallet to refresh data.");
      }
  };

  const handleWithdrawUsdt = async () => {
    if (parseFloat(profileAndStakeData.totalClaimableUsdt) < 3) { // Min $3 withdrawal
        message.warn("Minimum USDT withdrawal is $3.00.");
        return;
    }
    setIsWithdrawalLoading(true);
    const key = 'usdtWithdrawal';
    message.loading({ content: 'Processing USDT withdrawal request...', key, duration: 0 });
    try {
        // Actual API call to backend
        const response = await requestUsdtWithdrawal({ 
            userWalletAddress: rawAddress, 
            amountUsdt: parseFloat(profileAndStakeData.totalClaimableUsdt) // Example: withdraw all claimable
        });
        message.success({ content: response.data.message || "USDT Withdrawal request submitted successfully!", key, duration: 4 });
        fetchDataForTab('stakes', false); // Refresh stake and USDT data silently
    } catch (error) {
        message.error({ content: error?.response?.data?.message || "USDT Withdrawal request failed.", key, duration: 4 });
        console.error("USDT Withdrawal Error:", error);
    } finally {
        setIsWithdrawalLoading(false);
    }
  };

  const tabItems = [
    {
      key: 'stakes',
      label: <span style={{fontSize: isMobile ? '0.9em' : '1em'}}>Stakes & USDT Rewards</span>,
      children: (
        <TransactionList 
          items={profileAndStakeData.stakes} 
          isLoading={loadingData && activeTab === 'stakes'} 
          renderItemDetails={renderStakeHistoryItem} 
          itemType="staking activity" 
          listTitle="Your ARIX Stakes & USDT Earnings"
        />
      ),
    },
    {
      key: 'games',
      label: <span style={{fontSize: isMobile ? '0.9em' : '1em'}}>Coinflip History</span>,
      children: (
        <TransactionList 
          items={coinflipHistory} 
          isLoading={loadingData && activeTab === 'games'} 
          renderItemDetails={renderCoinflipHistoryItem} 
          itemType="Coinflip game" 
          listTitle="Your Coinflip Game Log"
        />
      ),
    },
  ];

  const renderContent = () => {
    if (loadingData && !profileAndStakeData.stakes.length && !coinflipHistory.length && userFriendlyAddress) {
        return <div style={{textAlign: 'center', padding: '50px 0'}}><Spin size="large" tip="Loading Your Hub Data..." /></div>;
    }
    return (
        <>
            <UserProfileCard 
                totalClaimableUsdt={profileAndStakeData.totalClaimableUsdt}
                onWithdrawUsdt={handleWithdrawUsdt}
                onRefreshBalances={handleRefreshAllData} // UserProfileCard's refresh button will call this
                isDataLoading={loadingData} // Pass loading state to disable buttons in card
            />
            <div style={{marginTop: 20, marginBottom: 20, textAlign: 'right'}}>
              <Button onClick={handleRefreshAllData} loading={loadingData}>Refresh Current History</Button>
            </div>
            <Tabs 
                defaultActiveKey="stakes" 
                activeKey={activeTab}
                items={tabItems} 
                onChange={(key) => setActiveTab(key)} 
                centered 
                className="neumorphic-tabs" 
                size={isMobile ? 'small' : 'middle'}
            />
        </>
      );
  };


  return (
      <div style={{ padding: isMobile ? '16px' : '24px', maxWidth: '960px', margin: '0 auto' }}>
        <Title level={2} style={{ color: 'white', textAlign: 'center', marginBottom: isMobile ? '20px' : '30px', fontWeight: 'bold' }}>
          Your ARIX Hub
        </Title>
        {!userFriendlyAddress ? (
             <Card className="neumorphic-glass-card" style={{ marginBottom: 24, textAlign: 'center', padding: '30px' }}>
                <Text style={{ color: '#aaa', display:'block', marginBottom: 20 }}>Please connect your wallet to view your ARIX Hub and history.</Text>
                <Button type="primary" onClick={() => tonConnectUI.openModal()}>Connect Wallet</Button>
             </Card>
        ) : renderContent() }
      </div>
  );
};

export default UserPage;

// File: AR_FRONTEND/src/pages/UserPage.jsx
// File: AR_FRONTEND/src/pages/UserPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Typography, Tabs, message, Spin, Button, Grid, Card } from 'antd';
import { useTonAddress, useTonConnectUI } from '@tonconnect/ui-react';
import UserProfileCard from '../components/user/UserProfileCard';
import TransactionList, { renderStakeHistoryItem, renderCoinflipHistoryItem } from '../components/user/TransactionList';
// Updated import: requestArixRewardWithdrawal instead of requestUsdtWithdrawal
import { getUserStakesAndRewards, getCoinflipHistoryForUser, requestArixRewardWithdrawal } from '../services/api'; 
import { getArxUsdtPriceFromBackend } from '../services/priceServiceFrontend'; // Import price service

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const MIN_ARIX_WITHDRAWAL_APPROX_USD_VALUE = 3; // Minimum withdrawal equivalent to $3 USD


const UserPage = () => {
  const userFriendlyAddress = useTonAddress();
  const rawAddress = useTonAddress(false);
  const [tonConnectUI] = useTonConnectUI();
  
  // Renamed state from totalClaimableUsdt to totalClaimableArix
  const [profileAndStakeData, setProfileAndStakeData] = useState({ stakes: [], totalClaimableArix: '0.000000000' }); 
  const [coinflipHistory, setCoinflipHistory] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [isWithdrawalLoading, setIsWithdrawalLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('stakes');
  const [currentArxPrice, setCurrentArxPrice] = useState(null); // State for ARIX price

  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const fetchCurrentArxPrice = useCallback(async () => {
    try {
      const price = await getArxUsdtPriceFromBackend();
      setCurrentArxPrice(price);
    } catch (error) {
      console.error("Failed to fetch ARIX price for withdrawal check:", error);
      setCurrentArxPrice(null);
    }
  }, []);

  const fetchDataForTab = useCallback(async (tabKey, showMessage = false) => {
    if (!rawAddress) {
      setProfileAndStakeData({ stakes: [], totalClaimableArix: '0.000000000' }); // Renamed
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
            totalClaimableArix: response.data?.totalClaimableArix || '0.000000000' // Renamed
        });
      } else if (tabKey === 'games') {
        const response = await getCoinflipHistoryForUser(rawAddress);
        setCoinflipHistory(response.data || []);
      }
      if (showMessage) message.success("Data refreshed!");
    } catch (error) {
      message.error(`Failed to fetch ${tabKey} history.`);
      console.error(`Fetch ${tabKey} error:`, error);
      if (tabKey === 'stakes') setProfileAndStakeData({ stakes: [], totalClaimableArix: '0.000000000' }); // Renamed
      if (tabKey === 'games') setCoinflipHistory([]);
    } finally {
      setLoadingData(false);
    }
  }, [rawAddress]);

  useEffect(() => {
    fetchCurrentArxPrice(); // Fetch price on component mount
    if (userFriendlyAddress) { 
        fetchDataForTab(activeTab);
    } else { 
        setProfileAndStakeData({ stakes: [], totalClaimableArix: '0.000000000' }); // Renamed
        setCoinflipHistory([]);
        setLoadingData(false); 
    }
  }, [userFriendlyAddress, activeTab, fetchDataForTab, fetchCurrentArxPrice]); 
  
  const handleRefreshAllData = () => {
      if (userFriendlyAddress) {
          fetchDataForTab(activeTab, true); 
          fetchCurrentArxPrice(); // Ensure price is also refreshed
      } else {
          message.warn("Connect your wallet to refresh data.");
      }
  };

  const handleWithdrawArix = async () => { // Renamed from handleWithdrawUsdt
    if (!currentArxPrice || currentArxPrice <= 0) {
        message.warn("Cannot process withdrawal: ARIX price not available.");
        return;
    }
    const minArixWithdrawalAmount = MIN_ARIX_WITHDRAWAL_APPROX_USD_VALUE / currentArxPrice;

    if (parseFloat(profileAndStakeData.totalClaimableArix) < minArixWithdrawalAmount) { // Check against ARIX balance
        message.warn(`Minimum ARIX withdrawal is approx. ${minArixWithdrawalAmount.toFixed(ARIX_DECIMALS)} ARIX (equivalent to $${MIN_ARIX_WITHDRAWAL_APPROX_USD_VALUE.toFixed(2)} USD).`);
        return;
    }
    setIsWithdrawalLoading(true);
    const key = 'arixWithdrawal'; // Changed key
    message.loading({ content: 'Processing ARIX withdrawal request...', key, duration: 0 }); // Updated message
    try {
        const response = await requestArixRewardWithdrawal({ // Renamed API call
            userWalletAddress: rawAddress, 
            amountArix: parseFloat(profileAndStakeData.totalClaimableArix) // Pass the ARIX amount
        });
        message.success({ content: response.data.message || "ARIX Withdrawal request submitted successfully!", key, duration: 4 }); // Updated message
        fetchDataForTab('stakes', false); // Refresh stake and ARIX data silently
    } catch (error) {
        message.error({ content: error?.response?.data?.message || "ARIX Withdrawal request failed.", key, duration: 4 }); // Updated message
        console.error("ARIX Withdrawal Error:", error); // Updated message
    } finally {
        setIsWithdrawalLoading(false);
    }
  };

  const tabItems = [
    {
      key: 'stakes',
      label: <span style={{fontSize: isMobile ? '0.9em' : '1em'}}>Stakes & ARIX Rewards</span>, 
      children: (
        <TransactionList 
          items={profileAndStakeData.stakes} 
          isLoading={loadingData && activeTab === 'stakes'} 
          renderItemDetails={renderStakeHistoryItem} 
          itemType="staking activity" 
          listTitle="Your ARIX Stakes & ARIX Earnings" 
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
                totalClaimableArix={profileAndStakeData.totalClaimableArix} // Pass totalClaimableArix
                onWithdrawArix={handleWithdrawArix} // Pass handleWithdrawArix
                onRefreshBalances={handleRefreshAllData} 
                isDataLoading={loadingData} 
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
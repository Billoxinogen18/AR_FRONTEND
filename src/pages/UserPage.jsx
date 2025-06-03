// File: AR_FRONTEND/src/pages/UserPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Typography, Tabs, message, Spin, Button, Grid, Card, Row, Col, Radio, Divider, Tooltip, Alert, Empty } from 'antd'; // Added Empty
import { useTonAddress, useTonConnectUI } from '@tonconnect/ui-react';
// Icons for future use if re-enabled
// import { FacebookOutlined, InstagramOutlined, SendOutlined, ReadOutlined, InfoCircleOutlined, SettingOutlined, EditOutlined, QqOutlined, BulbOutlined, CopyOutlined, QuestionCircleOutlined } from '@ant-design/icons'; 

import UserProfileCard from '../components/user/UserProfileCard';
import TransactionList, { renderStakeHistoryItem, renderCoinflipHistoryItem } from '../components/user/TransactionList';
import { getUserStakesAndRewards, getCoinflipHistoryForUser, requestArixRewardWithdrawal } from '../services/api'; 
import { getArxUsdtPriceFromBackend } from '../services/priceServiceFrontend';
import { ARIX_DECIMALS } from '../utils/tonUtils';


const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs; // Kept for AntD Tabs structure
const { useBreakpoint } = Grid;

const MIN_ARIX_WITHDRAWAL_APPROX_USD_VALUE = 3;


const UserPage = () => {
  const userFriendlyAddress = useTonAddress();
  const rawAddress = useTonAddress(false);
  const [tonConnectUI] = useTonConnectUI();
  
  const [profileAndStakeData, setProfileAndStakeData] = useState({ stakes: [], totalClaimableArix: '0.000000000' }); 
  const [coinflipHistory, setCoinflipHistory] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  // const [isWithdrawalLoading, setIsWithdrawalLoading] = useState(false); // Managed within UserProfileCard now via onWithdrawArix prop
  const [activeTab, setActiveTab] = useState('stakes');
  const [currentArxPrice, setCurrentArxPrice] = useState(null);

  const screens = useBreakpoint();
  const isMobile = !screens.md;
  
  // States for UI stubs - commented out as features are removed for now
  // const [language, setLanguage] = useState('en');
  // const [colorTheme, setColorTheme] = useState('terminal');
  // const [soundEnabled, setSoundEnabled] = useState(true);
  // const [musicEnabled, setMusicEnabled] = useState(false);

  const fetchCurrentArxPrice = useCallback(async () => {
    try {
      const price = await getArxUsdtPriceFromBackend();
      setCurrentArxPrice(price);
    } catch (error) {
      console.error("Failed to fetch ARIX price:", error);
      setCurrentArxPrice(null); 
    }
  }, []);

  const fetchDataForTab = useCallback(async (tabKey, showMessage = false) => {
    if (!rawAddress) {
      setProfileAndStakeData({ stakes: [], totalClaimableArix: '0.000000000' });
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
            totalClaimableArix: response.data?.totalClaimableArix || '0.000000000'
        });
      } else if (tabKey === 'games') {
        const response = await getCoinflipHistoryForUser(rawAddress);
        setCoinflipHistory(response.data || []);
      }
      if (showMessage) message.success("History data refreshed!");
    } catch (error) {
      message.error(`Failed to fetch ${tabKey} history.`);
      console.error(`Fetch ${tabKey} error:`, error);
      if (tabKey === 'stakes') setProfileAndStakeData({ stakes: [], totalClaimableArix: '0.000000000' });
      if (tabKey === 'games') setCoinflipHistory([]);
    } finally {
      setLoadingData(false);
    }
  }, [rawAddress]);

  useEffect(() => {
    fetchCurrentArxPrice(); 
    if (userFriendlyAddress) { 
        fetchDataForTab(activeTab);
    } else { 
        setProfileAndStakeData({ stakes: [], totalClaimableArix: '0.000000000' });
        setCoinflipHistory([]);
        setLoadingData(false); 
    }
  }, [userFriendlyAddress, activeTab, fetchDataForTab, fetchCurrentArxPrice]); 
  
  const handleRefreshAllData = () => { // Simplified: Profile card's refresh will call this via prop
      if (userFriendlyAddress) {
          fetchDataForTab(activeTab, true); 
          fetchCurrentArxPrice();
      } else {
          message.warn("Connect your wallet to refresh data.");
      }
  };

  const handleWithdrawArix = async () => { // Logic now passed to UserProfileCard and called from there if button enabled
    if (!currentArxPrice || currentArxPrice <= 0) {
        message.warn("Cannot process withdrawal: ARIX price not available. Try refreshing.");
        return;
    }
    const minArixForWithdrawal = (MIN_ARIX_WITHDRAWAL_APPROX_USD_VALUE / currentArxPrice);

    if (parseFloat(profileAndStakeData.totalClaimableArix) < minArixForWithdrawal) {
        message.warn(`Minimum ARIX withdrawal is approx. ${minArixForWithdrawal.toFixed(ARIX_DECIMALS)} ARIX. Your balance: ${parseFloat(profileAndStakeData.totalClaimableArix).toFixed(ARIX_DECIMALS)} ARIX.`);
        return;
    }
    // setIsWithdrawalLoading(true); // UserProfileCard can manage its own loading state for the button
    const key = 'arixWithdrawalUserPage';
    message.loading({ content: 'Processing ARIX withdrawal request...', key, duration: 0 });
    try {
        const response = await requestArixRewardWithdrawal({ 
            userWalletAddress: rawAddress, 
            amountArix: parseFloat(profileAndStakeData.totalClaimableArix) 
        });
        message.success({ content: response.data.message || "ARIX Withdrawal request submitted successfully!", key, duration: 4 });
        fetchDataForTab('stakes', false); // Refresh quietly after withdrawal
    } catch (error) {
        message.error({ content: error?.response?.data?.message || "ARIX Withdrawal request failed.", key, duration: 4 });
        console.error("ARIX Withdrawal Error from UserPage:", error);
    } finally {
        // setIsWithdrawalLoading(false);
    }
  };

  const tabItems = [
    {
      key: 'stakes',
      label: <span style={{fontSize: isMobile ? '0.9rem' : '1rem'}}>ARIX Staking History</span>, 
      children: (
        <TransactionList 
          items={profileAndStakeData.stakes} 
          isLoading={loadingData && activeTab === 'stakes'} 
          renderItemDetails={renderStakeHistoryItem} 
          itemType="staking activity" 
          listTitle={null} // Title provided by tab, or remove if redundant
          listStyle={{marginTop:0, borderTop:'none', boxShadow:'none', background:'transparent'}} 
        />
      ),
    },
    {
      key: 'games',
      label: <span style={{fontSize: isMobile ? '0.9rem' : '1rem'}}>Game History</span>,
      children: (
        <TransactionList 
          items={coinflipHistory} 
          isLoading={loadingData && activeTab === 'games'} 
          renderItemDetails={renderCoinflipHistoryItem} 
          itemType="Coinflip game" 
          listTitle={null}
          listStyle={{marginTop:0, borderTop:'none', boxShadow:'none', background:'transparent'}}
        />
      ),
    },
  ];
  
  const renderContent = () => {
    if (loadingData && !profileAndStakeData.stakes.length && !coinflipHistory.length && userFriendlyAddress) {
        return <div style={{textAlign: 'center', padding: '50px 0'}}><Spin size="large" tip="Loading Your Hub Data..." /></div>;
    }
    
    const noHistoryForStakes = activeTab === 'stakes' && !profileAndStakeData.stakes.length && !loadingData;
    const noHistoryForGames = activeTab === 'games' && !coinflipHistory.length && !loadingData;

    return (
        <>
            <UserProfileCard 
                totalClaimableArix={profileAndStakeData.totalClaimableArix}
                onWithdrawArix={handleWithdrawArix}
                onRefreshBalances={handleRefreshAllData} 
                isDataLoading={loadingData} 
                currentArxPrice={currentArxPrice}
            />
            
            <Divider style={{borderColor: '#2a2a2a', margin: '24px 0 16px 0'}}><Text style={{color:'#6a6a6e', fontSize:'0.8rem'}}>ACTIVITY LOGS</Text></Divider>

            <Tabs 
                defaultActiveKey="stakes" 
                activeKey={activeTab}
                items={tabItems} 
                onChange={(key) => setActiveTab(key)} 
                centered 
                className="dark-theme-tabs"
                size={isMobile ? 'small' : 'middle'}
            />
             {(noHistoryForStakes || noHistoryForGames) && (
                <Card className="dark-theme-card" style={{marginTop: 0, borderTopLeftRadius:0, borderTopRightRadius:0, borderTop:'none', textAlign: 'center'}}>
                    <Empty 
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={
                        <Title level={4} style={{color: '#a0a0a5'}}>So much empty, engage!</Title>
                        }
                    />
                    <Paragraph style={{color: '#8e8e93'}}>
                        Your {activeTab === 'stakes' ? 'staking' : 'gaming'} history will appear here.
                    </Paragraph>
                </Card>
            )}
        </>
      );
  };


  return (
      <div style={{ padding: isMobile ? '0px' : '0px' }}> {/* Reduced main padding */}
        <Title level={2} className="page-title">User Hub</Title>
        {!userFriendlyAddress ? (
             <Card className="dark-theme-card" style={{textAlign: 'center', padding: '30px', margin: isMobile ? '0 16px' : '0' }}>
                <Text style={{ color: '#a0a0a5', display:'block', marginBottom: 20, fontSize: '1rem' }}>Please connect your wallet to view your ARIX Hub and history.</Text>
                <Button type="primary" size="large" onClick={() => tonConnectUI.openModal()}>Connect Wallet</Button>
             </Card>
        ) : renderContent() }
      </div>
  );
};

export default UserPage;
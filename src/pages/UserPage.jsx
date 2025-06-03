// File: AR_FRONTEND/src/pages/UserPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Typography, Tabs, message, Spin, Button, Grid, Card, Row, Col, Radio, Divider, Tooltip, Alert } from 'antd';
import { useTonAddress, useTonConnectUI } from '@tonconnect/ui-react';
import { FacebookOutlined, InstagramOutlined, SendOutlined, ReadOutlined, InfoCircleOutlined, SettingOutlined, EditOutlined, QqOutlined, BulbOutlined, CopyOutlined, QuestionCircleOutlined } from '@ant-design/icons'; // Import more icons

import UserProfileCard from '../components/user/UserProfileCard';
import TransactionList, { renderStakeHistoryItem, renderCoinflipHistoryItem } from '../components/user/TransactionList';
import { getUserStakesAndRewards, getCoinflipHistoryForUser, requestArixRewardWithdrawal } from '../services/api'; 
import { getArxUsdtPriceFromBackend } from '../services/priceServiceFrontend';
import { ARIX_DECIMALS } from '../utils/tonUtils';


const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { useBreakpoint } = Grid;

const MIN_ARIX_WITHDRAWAL_APPROX_USD_VALUE = 3;


const UserPage = () => {
  const userFriendlyAddress = useTonAddress();
  const rawAddress = useTonAddress(false);
  const [tonConnectUI] = useTonConnectUI();
  
  const [profileAndStakeData, setProfileAndStakeData] = useState({ stakes: [], totalClaimableArix: '0.000000000' }); 
  const [coinflipHistory, setCoinflipHistory] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [isWithdrawalLoading, setIsWithdrawalLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('stakes');
  const [currentArxPrice, setCurrentArxPrice] = useState(null);

  const screens = useBreakpoint();
  const isMobile = !screens.md;
  
  // State for UI stubs, default to 'en' and 'Terminal' as per screenshot
  const [language, setLanguage] = useState('en');
  const [colorTheme, setColorTheme] = useState('terminal');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [musicEnabled, setMusicEnabled] = useState(false);

  const fetchCurrentArxPrice = useCallback(async () => {
    try {
      const price = await getArxUsdtPriceFromBackend();
      setCurrentArxPrice(price);
    } catch (error) {
      console.error("Failed to fetch ARIX price:", error);
      setCurrentArxPrice(null); // Handle error state
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
  
  const handleRefreshAllData = () => {
      if (userFriendlyAddress) {
          fetchDataForTab(activeTab, true); 
          fetchCurrentArxPrice();
      } else {
          message.warn("Connect your wallet to refresh data.");
      }
  };

  const handleWithdrawArix = async () => {
    if (!currentArxPrice || currentArxPrice <= 0) {
        message.warn("Cannot process withdrawal: ARIX price not available. Try refreshing.");
        return;
    }
    const minArixWithdrawalAmount = MIN_ARIX_WITHDRAWAL_APPROX_USD_VALUE / currentArxPrice;

    if (parseFloat(profileAndStakeData.totalClaimableArix) < minArixWithdrawalAmount) {
        message.warn(`Minimum ARIX withdrawal is approx. ${minArixWithdrawalAmount.toFixed(ARIX_DECIMALS)} ARIX. Your balance: ${parseFloat(profileAndStakeData.totalClaimableArix).toFixed(ARIX_DECIMALS)} ARIX.`);
        return;
    }
    setIsWithdrawalLoading(true);
    const key = 'arixWithdrawal';
    message.loading({ content: 'Processing ARIX withdrawal request...', key, duration: 0 });
    try {
        const response = await requestArixRewardWithdrawal({ 
            userWalletAddress: rawAddress, 
            amountArix: parseFloat(profileAndStakeData.totalClaimableArix) 
        });
        message.success({ content: response.data.message || "ARIX Withdrawal request submitted successfully!", key, duration: 4 });
        fetchDataForTab('stakes', false); 
    } catch (error) {
        message.error({ content: error?.response?.data?.message || "ARIX Withdrawal request failed.", key, duration: 4 });
        console.error("ARIX Withdrawal Error:", error);
    } finally {
        setIsWithdrawalLoading(false);
    }
  };

  const tabItems = [
    {
      key: 'stakes',
      label: <span style={{fontSize: isMobile ? '0.9rem' : '1rem'}}>ARIX Staking</span>, 
      children: (
        <TransactionList 
          items={profileAndStakeData.stakes} 
          isLoading={loadingData && activeTab === 'stakes'} 
          renderItemDetails={renderStakeHistoryItem} 
          itemType="staking activity" 
          listTitle="Your ARIX Stakes & Earnings History" 
          listStyle={{marginTop:0}} // Remove default top margin for lists in tabs
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
          listTitle="Your Coinflip Game Log"
          listStyle={{marginTop:0}}
        />
      ),
    },
  ];

  const ReferralSection = () => (
    <div className="user-settings-section">
      <Title level={5} className="section-title">REFERRAL LINK</Title>
       {/* Placeholder for referral boxes based on screenshot */}
       <Row gutter={8} style={{ marginBottom: 10 }}>
            {Array(8).fill(0).map((_, idx) => (
                 <Col span={3} key={idx}><div style={{background:'#2c2c2e', height: '30px', borderRadius:'6px', border: '1px solid #38383a', display:'flex', alignItems:'center', justifyContent:'center', color:'#6a6a6e'}}>X</div></Col>
            ))}
       </Row>
       <Button type="default" block disabled icon={<EditOutlined />}>
          Activate an internal wallet to invite friends (Coming Soon)
      </Button>
    </div>
  );

  const SettingsSection = () => (
    <div className="user-settings-section">
      <Title level={5} className="section-title">LANGUAGE</Title>
      <Radio.Group value={language} onChange={(e) => setLanguage(e.target.value)} buttonStyle="solid" style={{width: '100%'}} className="dark-segmented-control">
        <Radio.Button value="en">English</Radio.Button>
        <Radio.Button value="ru">Русский</Radio.Button>
        <Radio.Button value="uk">Українська</Radio.Button>
      </Radio.Group>

      <Title level={5} className="section-title" style={{marginTop: 20}}>COLOR THEME</Title>
      <Radio.Group value={colorTheme} onChange={(e) => setColorTheme(e.target.value)} buttonStyle="solid" style={{width: '100%'}} className="dark-segmented-control">
        <Radio.Button value="terminal">Terminal</Radio.Button>
        <Radio.Button value="telegram" disabled>Telegram (Soon)</Radio.Button>
      </Radio.Group>

      <Title level={5} className="section-title" style={{marginTop: 20}}>SOUND</Title>
      <Radio.Group value={soundEnabled} onChange={(e) => setSoundEnabled(e.target.value)} buttonStyle="solid" style={{width: '100%'}} className="dark-segmented-control">
        <Radio.Button value={true}>On</Radio.Button>
        <Radio.Button value={false}>Off</Radio.Button>
      </Radio.Group>

      <Title level={5} className="section-title" style={{marginTop: 20}}>MUSIC</Title>
      <Radio.Group value={musicEnabled} onChange={(e) => setMusicEnabled(e.target.value)} buttonStyle="solid" style={{width: '100%'}} className="dark-segmented-control">
        <Radio.Button value={true}>On</Radio.Button>
        <Radio.Button value={false}>Off</Radio.Button>
      </Radio.Group>

      <Row gutter={[8,8]} style={{marginTop: 24}} className="support-guide-buttons">
            <Col xs={24} sm={8}>
                <Button block type="default" icon={<QuestionCircleOutlined />}>Support</Button>
            </Col>
            <Col xs={24} sm={8}>
                 <Button block type="default" icon={<ReadOutlined />}>Guide</Button>
            </Col>
            <Col xs={24} sm={8}>
                 <Button block type="default" icon={<InfoCircleOutlined />}>Onboarding</Button>
            </Col>
      </Row>
      <div className="social-links-container" style={{marginTop: 20}}>
            <Tooltip title="Telegram (Coming Soon)">
                <Button type="text" shape="circle" icon={<SendOutlined />} size="large" disabled />
            </Tooltip>
            <Tooltip title="Discord (Coming Soon)">
                <Button type="text" shape="circle" icon={<QqOutlined />} size="large" disabled />
            </Tooltip>
             <Tooltip title="Instagram (Coming Soon)">
                <Button type="text" shape="circle" icon={<InstagramOutlined />} size="large" disabled />
            </Tooltip>
        </div>
    </div>
  );
  
  const renderContent = () => {
    if (loadingData && !profileAndStakeData.stakes.length && !coinflipHistory.length && userFriendlyAddress) {
        return <div style={{textAlign: 'center', padding: '50px 0'}}><Spin size="large" tip="Loading Your Hub Data..." /></div>;
    }
    return (
        <>
            <UserProfileCard 
                totalClaimableArix={profileAndStakeData.totalClaimableArix}
                onWithdrawArix={handleWithdrawArix}
                onRefreshBalances={handleRefreshAllData} 
                isDataLoading={loadingData} 
                currentArxPrice={currentArxPrice} // Pass current ARIX price
            />
            {/* Removed the global refresh button here, user profile has one. Can be re-added if desired. */}

            {/* Placeholder Sections based on screenshots - logic is UI stub only */}
            <ReferralSection />
            <Divider style={{borderColor: '#2a2a2a', margin: '24px 0'}} />
            <SettingsSection />
             <Divider style={{borderColor: '#2a2a2a', margin: '30px 0 20px 0'}} />


            {/* History Tabs */}
            <Tabs 
                defaultActiveKey="stakes" 
                activeKey={activeTab}
                items={tabItems} 
                onChange={(key) => setActiveTab(key)} 
                centered 
                className="dark-theme-tabs" // Custom class for potential specific tab styling
                size={isMobile ? 'small' : 'middle'}
            />
        </>
      );
  };


  return (
      <div style={{ padding: isMobile ? '16px' : '24px'}}>
        <Title level={2} className="page-title">User Hub</Title>
        {!userFriendlyAddress ? (
             <Card className="dark-theme-card" style={{textAlign: 'center', padding: '30px' }}>
                <Text style={{ color: '#a0a0a5', display:'block', marginBottom: 20, fontSize: '1rem' }}>Please connect your wallet to view your ARIX Hub and history.</Text>
                <Button type="primary" size="large" onClick={() => tonConnectUI.openModal()}>Connect Wallet</Button>
             </Card>
        ) : renderContent() }
      </div>
  );
};

export default UserPage;
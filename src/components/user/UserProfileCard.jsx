// File: AR_FRONTEND/src/components/user/UserProfileCard.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Card, Typography, Button, Spin, message, Tooltip, Row, Col, Grid, Statistic as AntdStatistic, Alert } from 'antd';
import { CopyOutlined, RedoOutlined, GlobalOutlined, DollarCircleOutlined, WalletOutlined } from '@ant-design/icons';
import { useTonAddress } from '@tonconnect/ui-react';
import { getJettonWalletAddress, getJettonBalance, fromArixSmallestUnits, ARIX_DECIMALS } from '../../utils/tonUtils';
// getArxUsdtPriceFromBackend is now passed as a prop currentArxPrice

const { Text, Paragraph, Title } = Typography;
const { useBreakpoint } = Grid;

const ARIX_JETTON_MASTER_ADDRESS = import.meta.env.VITE_ARIX_TOKEN_MASTER_ADDRESS;
const TON_NETWORK = import.meta.env.VITE_TON_NETWORK || "mainnet";
const MIN_ARIX_WITHDRAWAL_APPROX_USD_VALUE = 3;

const UserProfileCard = ({ totalClaimableArix, onWithdrawArix, onRefreshBalances, isDataLoading, currentArxPrice }) => {
  const userFriendlyAddress = useTonAddress();
  const rawAddress = useTonAddress(false);
  const [arixBalance, setArixBalance] = useState(0);
  const [loadingArix, setLoadingArix] = useState(false);
  const [loadingWithdraw, setLoadingWithdraw] = useState(false); // Managed by parent for UserPage for actual withdrawal

  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const fetchArixBalanceOnly = useCallback(async () => {
    if (!rawAddress || !ARIX_JETTON_MASTER_ADDRESS) {
      setArixBalance(0);
      return;
    }
    setLoadingArix(true);
    try {
      const userArixJettonWallet = await getJettonWalletAddress(rawAddress, ARIX_JETTON_MASTER_ADDRESS);
      if (userArixJettonWallet) {
        const balanceSmallestUnits = await getJettonBalance(userArixJettonWallet);
        setArixBalance(fromArixSmallestUnits(balanceSmallestUnits));
      } else {
        setArixBalance(0);
      }
    } catch (err) {
      console.error("Failed to fetch ARIX balance:", err);
      setArixBalance(0);
    } finally {
      setLoadingArix(false);
    }
  }, [rawAddress]);

  useEffect(() => {
    if (rawAddress) {
      fetchArixBalanceOnly();
    } else {
      setArixBalance(0);
    }
  }, [rawAddress, fetchArixBalanceOnly]);

  const handleRefresh = () => {
    fetchArixBalanceOnly(); 
    if (onRefreshBalances) { 
      onRefreshBalances(); // This will trigger a refresh in UserPage, which includes fetching the price again.
    }
    message.success("Balance refresh initiated!");
  };
  
  const handleWithdrawClick = async () => {
    // This component now relies on UserPage to pass currentArxPrice
    // The actual withdrawal logic is also handled by onWithdrawArix from UserPage
    if (onWithdrawArix) {
        // onWithdrawArix should contain all necessary validation before calling API
        onWithdrawArix(); 
    }
  };

  const explorerUrl = TON_NETWORK === 'testnet'
    ? `https://testnet.tonscan.org/address/${userFriendlyAddress}` // use userFriendlyAddress for explorers generally
    : `https://tonscan.org/address/${userFriendlyAddress}`;

  const copyToClipboard = (textToCopy) => {
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy)
        .then(() => message.success('Address copied to clipboard!'))
        .catch(err => message.error('Failed to copy address.'));
  };

  if (!userFriendlyAddress) {
    return ( // Consistent with how other pages handle no wallet connection
      <Card className="dark-theme-card" style={{ marginBottom: 24, textAlign: 'center', padding: '20px'}}>
        <Text style={{ color: '#a0a0a5', fontSize: '0.95rem' }}>Please connect your wallet to view profile details.</Text>
      </Card>
    );
  }
  
  const minArixForWithdrawal = (currentArxPrice && currentArxPrice > 0) 
      ? (MIN_ARIX_WITHDRAWAL_APPROX_USD_VALUE / currentArxPrice) 
      : Infinity; // If price not available, effectively disable withdrawal via high minimum

  return (
    <Card className="dark-theme-card profile-card" style={{ marginBottom: 24 }} bordered={false}>
      {/* <Title level={isMobile ? 4 : 3} style={{ color: '#ffffff', textAlign: 'center', marginBottom: 20, fontWeight:600 }}>Your ARIX Profile</Title> */}
      
      <Spin spinning={isDataLoading || loadingArix} tip="Loading profile...">
        <Row gutter={isMobile ? [16, 16] : [24, 24]}>
          <Col xs={24} md={12} className="wallet-info-col">
              <Title level={5} className="section-title" style={{marginTop:0, textAlign: isMobile? 'center':'left'}}>Wallet Details</Title>
              <Paragraph className="profile-text-item">
                <Text strong className="profile-text-label">Address: </Text>
                <Text copyable={{ text: userFriendlyAddress, tooltips: ['Copy', 'Copied!'], icon: <CopyOutlined style={{color: '#7e73ff'}}/> }} style={{color: 'white'}}>
                  {isMobile ? `${userFriendlyAddress.slice(0, 8)}...${userFriendlyAddress.slice(-5)}` : userFriendlyAddress}
                </Text>
              </Paragraph>
              {/* Raw address might not be needed by most users */}
              {/* {!isMobile && rawAddress && (
                   <Paragraph className="profile-text-item" style={{fontSize: '0.85em' }}>
                      <Text strong className="profile-text-label">Raw: </Text>
                      <Text style={{ color: '#ccc' }}>{rawAddress} </Text>
                      <Tooltip title="Copy Raw Address"><Button icon={<CopyOutlined />} type="text" size="small" onClick={() => copyToClipboard(rawAddress)} style={{color: '#7e73ff', padding: '0 4px'}} /></Tooltip>
                   </Paragraph>
              )} */}
              <Paragraph className="profile-text-item">
                <Text strong className="profile-text-label">Explorer: </Text>
                <a href={explorerUrl} target="_blank" rel="noopener noreferrer" style={{color: '#7e73ff'}}>
                  <GlobalOutlined style={{marginRight: 4}}/>{TON_NETWORK === 'testnet' ? 'Testnet Tonscan' : 'Tonscan'}
                </a>
              </Paragraph>
                <Button 
                    icon={<RedoOutlined />} 
                    onClick={handleRefresh} 
                    loading={loadingArix || isDataLoading} 
                    block={isMobile} 
                    style={{marginTop: isMobile ? 12 : 8}}
                >Refresh Balances</Button>
          </Col>

          <Col xs={24} md={12} className="balances-col">
              <Title level={5} className="section-title" style={{marginTop: isMobile ? 20 : 0, textAlign: isMobile ? 'center' : 'left'}}>Balances & Rewards</Title>
              <Row gutter={[8,12]}>
                <Col xs={24} sm={12} md={24}>
                    <AntdStatistic 
                        title="Your ARIX Balance"
                        value={arixBalance} 
                        precision={ARIX_DECIMALS} 
                        suffix="ARIX"
                        valueStyle={{color: '#7e73ff'}}
                    />
                     {currentArxPrice != null && (
                        <Text style={{ color: '#6a6a6e', fontSize: '0.8em', display: 'block', marginTop: -2, marginBottom: 8 }}>
                            ~${(arixBalance * currentArxPrice).toFixed(2)} USD
                        </Text>
                    )}
                </Col>
                <Col xs={24} sm={12} md={24}>
                    <AntdStatistic 
                        title="Claimable ARIX Rewards" 
                        value={parseFloat(totalClaimableArix || 0)}
                        precision={ARIX_DECIMALS}
                        suffix="ARIX"
                        valueStyle={{color: '#4CAF50'}}
                    />
                    {currentArxPrice != null && (
                        <Text style={{ color: '#6a6a6e', fontSize: '0.8em', display: 'block', marginTop: -2, marginBottom: 8 }}>
                           ~${(parseFloat(totalClaimableArix || 0) * currentArxPrice).toFixed(2)} USD
                        </Text>
                    )}
                </Col>
              </Row>
              <Button 
                  type="primary" icon={<DollarCircleOutlined />} 
                  onClick={handleWithdrawClick} 
                  disabled={
                    !currentArxPrice || currentArxPrice <= 0 ||
                    parseFloat(totalClaimableArix || 0) < minArixForWithdrawal ||
                    isDataLoading || loadingArix // Parent manages actual withdrawal loading state via onWithdrawArix
                  }
                  block style={{marginTop: 12}}
              > Withdraw ARIX Rewards </Button>
               {currentArxPrice && parseFloat(totalClaimableArix || 0) > 0 && parseFloat(totalClaimableArix || 0) < minArixForWithdrawal &&
                <Alert 
                    message={`Minimum withdrawal is approx. ${minArixForWithdrawal.toFixed(ARIX_DECIMALS)} ARIX ($${MIN_ARIX_WITHDRAWAL_APPROX_USD_VALUE.toFixed(2)}).`} 
                    type="warning" showIcon 
                    style={{fontSize:'0.8rem', padding: '6px 10px', marginTop: 10}} 
                />
              }
          </Col>
        </Row>
      </Spin>
    </Card>
  );
};

export default UserProfileCard;
// File: AR_FRONTEND/src/components/user/UserProfileCard.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Card, Typography, Button, Spin, message, Tooltip, Row, Col, Grid, Statistic as AntdStatistic } from 'antd';
import { CopyOutlined, RedoOutlined, GlobalOutlined, DollarCircleOutlined } from '@ant-design/icons';
import { useTonAddress } from '@tonconnect/ui-react';
import { getJettonWalletAddress, getJettonBalance, fromArixSmallestUnits, ARIX_DECIMALS } from '../../utils/tonUtils';

const { Text, Paragraph, Title } = Typography;
const { useBreakpoint } = Grid;

const ARIX_JETTON_MASTER_ADDRESS = import.meta.env.VITE_ARIX_TOKEN_MASTER_ADDRESS;
const TON_NETWORK = import.meta.env.VITE_TON_NETWORK || "mainnet";
const MIN_USDT_WITHDRAWAL = 3; // Example, align with backend

const UserProfileCard = ({ totalClaimableUsdt, onWithdrawUsdt, onRefreshBalances, isDataLoading }) => {
  const userFriendlyAddress = useTonAddress();
  const rawAddress = useTonAddress(false);
  const [arixBalance, setArixBalance] = useState(0);
  const [loadingArix, setLoadingArix] = useState(false);
  const [loadingWithdraw, setLoadingWithdraw] = useState(false);

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
      // message.error("Could not fetch ARIX balance."); // UserPage can show general refresh message
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
    fetchArixBalanceOnly(); // Refreshes ARIX balance specific to this card
    if (onRefreshBalances) { // Calls parent (UserPage) to refresh its data (stakes, USDT total)
      onRefreshBalances();
    }
    message.success("Balance refresh initiated!");
  };
  
  const handleWithdrawClick = async () => {
    if (parseFloat(totalClaimableUsdt || 0) < MIN_USDT_WITHDRAWAL) {
        message.warn(`Minimum USDT withdrawal is $${MIN_USDT_WITHDRAWAL}.`);
        return;
    }
    setLoadingWithdraw(true);
    if (onWithdrawUsdt) {
        try {
            await onWithdrawUsdt(); // This is the function passed from UserPage
        } catch (e) {
            // Error messages should be handled by onWithdrawUsdt or UserPage
            console.error("Withdrawal error in UserProfileCard caught:", e);
        }
    }
    setLoadingWithdraw(false);
  };

  const explorerUrl = TON_NETWORK === 'testnet'
    ? `https://testnet.tonscan.org/address/${rawAddress}`
    : `https://tonscan.org/address/${rawAddress}`;

  const copyToClipboard = (textToCopy) => {
    if (!textToCopy) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(textToCopy)
        .then(() => message.success('Address copied to clipboard!'))
        .catch(err => {
            console.error('Failed to copy address using navigator.clipboard:', err);
            message.error('Failed to copy address.');
        });
    } else { // Fallback for older browsers or insecure contexts
      const textArea = document.createElement("textarea");
      textArea.value = textToCopy;
      textArea.style.position = "fixed"; // Prevent scrolling to bottom of page
      textArea.style.left = "-9999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        message.success('Address copied to clipboard! (fallback)');
      } catch (err) {
        console.error('Failed to copy address using execCommand:', err);
        message.error('Failed to copy address.');
      }
      document.body.removeChild(textArea);
    }
  };

  if (!userFriendlyAddress) {
    // This state is primarily handled by UserPage, but as a standalone component guard:
    return (
      <Card className="neumorphic-glass-card profile-card" style={{ marginBottom: 24, textAlign: 'center' }}>
        <Text style={{ color: '#aaa' }}>Please connect your wallet to view profile details.</Text>
      </Card>
    );
  }

  return (
    <Card className="neumorphic-glass-card profile-card" style={{ marginBottom: 24 }} bordered={false}>
      <Title level={isMobile ? 4 : 3} style={{ color: '#00adee', textAlign: 'center', marginBottom: 20 }}>Your ARIX Hub Profile</Title>
      
      <Spin spinning={isDataLoading && loadingArix} tip="Loading profile...">
        <Row gutter={isMobile ? [16, 20] : [24, 24]}>
          <Col xs={24} md={12} className="wallet-info-col">
              <Title level={5} style={{color: '#aaa', marginBottom: 12}}>Wallet Details</Title>
              <Paragraph className="profile-text-item" style={{ wordBreak: 'break-all' }}>
                <Text strong className="profile-text-label">Address: </Text>
                <Text copyable={{ text: userFriendlyAddress, tooltips: ['Copy', 'Copied!'] }} style={{ color: 'white' }}>
                  {isMobile ? `${userFriendlyAddress.slice(0, 8)}...${userFriendlyAddress.slice(-5)}` : userFriendlyAddress}
                </Text>
              </Paragraph>
              {!isMobile && rawAddress && (
                   <Paragraph className="profile-text-item" style={{ wordBreak: 'break-all', fontSize: '0.85em' }}>
                      <Text strong className="profile-text-label">Raw: </Text>
                      <Text style={{ color: '#ccc' }}>{rawAddress} </Text>
                      <Tooltip title="Copy Raw Address"><Button icon={<CopyOutlined />} type="text" size="small" onClick={() => copyToClipboard(rawAddress)} className="copy-button-inline" /></Tooltip>
                   </Paragraph>
              )}
              <Paragraph className="profile-text-item">
                <Text strong className="profile-text-label">Explorer: </Text>
                <a href={explorerUrl} target="_blank" rel="noopener noreferrer" style={{color: '#00adee'}}>
                  <GlobalOutlined style={{marginRight: 4}}/>{TON_NETWORK === 'testnet' ? 'Tonscan (Testnet)' : 'Tonscan'}
                </a>
              </Paragraph>
          </Col>

          <Col xs={24} md={12} className="balances-col">
              <Title level={5} style={{color: '#aaa', marginBottom: 12, marginTop: isMobile ? 20 : 0 }}>Balances & Actions</Title>
              <div className="balance-item">
                  <AntdStatistic 
                    title={<Text className="profile-text-label">ARIX Balance</Text>} 
                    value={arixBalance} 
                    precision={ARIX_DECIMALS} 
                    suffix="ARIX" 
                    valueStyle={{color: '#00adee', fontSize: isMobile ? '1.3em' : '1.5em', lineHeight: '1.2'}} 
                  />
              </div>
               <div className="balance-item" style={{marginTop: 10}}>
                  <AntdStatistic 
                    title={<Text className="profile-text-label">Claimable USDT Rewards</Text>} 
                    value={parseFloat(totalClaimableUsdt || 0)} 
                    precision={2} 
                    suffix="USDT" 
                    valueStyle={{color: '#52c41a', fontSize: isMobile ? '1.3em' : '1.5em', lineHeight: '1.2'}}
                  />
              </div>
              <Row gutter={[8,12]} style={{marginTop: 20}}>
                  <Col xs={24} sm={12}>
                      <Button icon={<RedoOutlined />} onClick={handleRefresh} loading={loadingArix || isDataLoading} block>Refresh Balances</Button>
                  </Col>
                  <Col xs={24} sm={12}>
                       <Button 
                          type="primary" icon={<DollarCircleOutlined />} 
                          onClick={handleWithdrawClick} 
                          disabled={parseFloat(totalClaimableUsdt || 0) < MIN_USDT_WITHDRAWAL || loadingWithdraw || isDataLoading}
                          loading={loadingWithdraw} block
                      > Withdraw USDT </Button>
                  </Col>
              </Row>
          </Col>
        </Row>
      </Spin>
    </Card>
  );
};

export default UserProfileCard;
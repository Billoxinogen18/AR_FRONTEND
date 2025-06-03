// File: AR_FRONTEND/src/components/user/UserProfileCard.jsx
// File: AR_FRONTEND/src/components/user/UserProfileCard.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Card, Typography, Button, Spin, message, Tooltip, Row, Col, Grid, Statistic as AntdStatistic } from 'antd';
import { CopyOutlined, RedoOutlined, GlobalOutlined, DollarCircleOutlined } from '@ant-design/icons';
import { useTonAddress } from '@tonconnect/ui-react';
import { getJettonWalletAddress, getJettonBalance, fromArixSmallestUnits, ARIX_DECIMALS } from '../../utils/tonUtils';
import { getArxUsdtPriceFromBackend } from '../../services/priceServiceFrontend'; // Import to get current ARIX price

const { Text, Paragraph, Title } = Typography;
const { useBreakpoint } = Grid;

const ARIX_JETTON_MASTER_ADDRESS = import.meta.env.VITE_ARIX_TOKEN_MASTER_ADDRESS;
const TON_NETWORK = import.meta.env.VITE_TON_NETWORK || "mainnet";
const MIN_ARIX_WITHDRAWAL_APPROX_USD_VALUE = 3; // Minimum withdrawal equivalent to $3 USD

// Prop totalClaimableUsdt should be renamed to totalClaimableArix
const UserProfileCard = ({ totalClaimableArix, onWithdrawArix, onRefreshBalances, isDataLoading }) => { // Renamed props
  const userFriendlyAddress = useTonAddress();
  const rawAddress = useTonAddress(false);
  const [arixBalance, setArixBalance] = useState(0);
  const [loadingArix, setLoadingArix] = useState(false);
  const [loadingWithdraw, setLoadingWithdraw] = useState(false);
  const [currentArxPrice, setCurrentArxPrice] = useState(null); // Fetch current ARIX price

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

  const fetchCurrentArxPrice = useCallback(async () => {
    try {
      const price = await getArxUsdtPriceFromBackend();
      setCurrentArxPrice(price);
    } catch (error) {
      console.error("Failed to fetch ARIX price for withdrawal check:", error);
      setCurrentArxPrice(null);
    }
  }, []);

  useEffect(() => {
    if (rawAddress) {
      fetchArixBalanceOnly();
      fetchCurrentArxPrice(); // Fetch price on mount/wallet connect
    } else {
      setArixBalance(0);
      setCurrentArxPrice(null);
    }
  }, [rawAddress, fetchArixBalanceOnly, fetchCurrentArxPrice]);

  const handleRefresh = () => {
    fetchArixBalanceOnly(); 
    fetchCurrentArxPrice(); // Refresh price too
    if (onRefreshBalances) { 
      onRefreshBalances();
    }
    message.success("Balance refresh initiated!");
  };
  
  const handleWithdrawClick = async () => {
    if (!currentArxPrice || currentArxPrice <= 0) {
        message.warn("Cannot process withdrawal: ARIX price not available.");
        return;
    }
    const minArixWithdrawalAmount = MIN_ARIX_WITHDRAWAL_APPROX_USD_VALUE / currentArxPrice;

    if (parseFloat(totalClaimableArix || 0) < minArixWithdrawalAmount) { // Check against ARIX balance
        message.warn(`Minimum ARIX withdrawal is approx. ${minArixWithdrawalAmount.toFixed(ARIX_DECIMALS)} ARIX (equivalent to $${MIN_ARIX_WITHDRAWAL_APPROX_USD_VALUE.toFixed(2)} USD).`);
        return;
    }
    setLoadingWithdraw(true);
    if (onWithdrawArix) { // Call the renamed prop function
        try {
            await onWithdrawArix(parseFloat(totalClaimableArix)); // Pass the actual ARIX amount
        } catch (e) {
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
    } else { 
      const textArea = document.createElement("textarea");
      textArea.value = textToCopy;
      textArea.style.position = "fixed"; 
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
                    title={<Text className="profile-text-label">Claimable ARIX Rewards</Text>} {/* Updated title */}
                    value={parseFloat(totalClaimableArix || 0)} // Using totalClaimableArix
                    precision={ARIX_DECIMALS} // Display ARIX precision
                    suffix="ARIX" // Changed suffix
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
                          disabled={
                            !currentArxPrice || currentArxPrice <= 0 || // Disable if price not available
                            parseFloat(totalClaimableArix || 0) < (MIN_ARIX_WITHDRAWAL_APPROX_USD_VALUE / currentArxPrice) || // Check ARIX amount against USD equivalent
                            loadingWithdraw || isDataLoading
                          }
                          loading={loadingWithdraw} block
                      > Withdraw ARIX </Button> {/* Changed button text */}
                  </Col>
              </Row>
          </Col>
        </Row>
      </Spin>
    </Card>
  );
};

export default UserProfileCard;
// File: AR_FRONTEND/src/components/user/UserProfileCard.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Card, Typography, Button, Spin, message, Tooltip, Row, Col, Grid, Statistic as AntdStatistic, Alert } from 'antd';
import {
  CopyOutlined,
  RedoOutlined,
  GlobalOutlined,
  DollarCircleOutlined,
  WalletOutlined,
  LogoutOutlined,
  TeamOutlined,
  RiseOutlined, // Used for ARIX price trend or general info
  InfoCircleOutlined,
  LinkOutlined // For connect wallet button
} from '@ant-design/icons';
import { useTonAddress, useTonConnectUI } from '@tonconnect/ui-react';
import { useNavigate } from 'react-router-dom';

import {
  getJettonWalletAddress,
  getJettonBalance,
  fromArixSmallestUnits,
  ARIX_DECIMALS,
  USDT_DECIMALS,
  MIN_USDT_WITHDRAWAL_USD_VALUE,
  TON_EXPLORER_URL
} from '../../utils/tonUtils';
import { requestUsdtWithdrawal, requestArixRewardWithdrawal } from '../../services/api';

const { Text, Paragraph, Title } = Typography;
const { useBreakpoint } = Grid;

const ARIX_JETTON_MASTER_ADDRESS = import.meta.env.VITE_ARIX_TOKEN_MASTER_ADDRESS;

const UserProfileCard = ({
                           userProfileData,
                           referralData,
                           activeStakes,
                           currentArxPrice,
                           onRefreshAllData,
                           isDataLoading,
                           onInitiateUnstakeProcess, // Callback to UserPage to handle unstake flow
                         }) => {
  const userFriendlyAddress = useTonAddress();
  const rawAddress = useTonAddress(false);
  const [tonConnectUI] = useTonConnectUI();
  const navigate = useNavigate();

  const [arixWalletBalance, setArixWalletBalance] = useState(0);
  const [loadingArixWalletBalance, setLoadingArixWalletBalance] = useState(false);
  const [isWithdrawUsdtLoading, setIsWithdrawUsdtLoading] = useState(false);
  const [isWithdrawArixLoading, setIsWithdrawArixLoading] = useState(false);

  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const fetchArixWalletBalance = useCallback(async (showMsg = false) => {
    if (!rawAddress || !ARIX_JETTON_MASTER_ADDRESS) {
      setArixWalletBalance(0);
      return;
    }
    setLoadingArixWalletBalance(true);
    try {
      const userArixJettonWallet = await getJettonWalletAddress(rawAddress, ARIX_JETTON_MASTER_ADDRESS);
      if (userArixJettonWallet) {
        const balanceSmallestUnits = await getJettonBalance(userArixJettonWallet);
        setArixWalletBalance(fromArixSmallestUnits(balanceSmallestUnits));
        if (showMsg) message.success("ARIX wallet balance refreshed!");
      } else {
        setArixWalletBalance(0);
        // Do not show info message if wallet not found, as it might be normal for new users
      }
    } catch (err) {
      console.error("Failed to fetch ARIX wallet balance:", err);
      setArixWalletBalance(0);
      if (showMsg) message.error("Could not refresh ARIX wallet balance.");
    } finally {
      setLoadingArixWalletBalance(false);
    }
  }, [rawAddress]);

  useEffect(() => {
    if (rawAddress) {
      fetchArixWalletBalance();
    } else {
      setArixWalletBalance(0);
    }
  }, [rawAddress, fetchArixWalletBalance]);

  const handleRefresh = () => {
    if (userFriendlyAddress) {
      fetchArixWalletBalance(true);
    }
    if (onRefreshAllData) {
      onRefreshAllData(true);
    } else if (!userFriendlyAddress) {
      message.info("Connect your wallet to refresh data.");
    }
  };

  const handleWithdrawUsdt = async () => {
    if (!rawAddress || !userProfileData) {
      message.error("User data not loaded. Please refresh.");
      return;
    }
    const claimableUsdt = parseFloat(userProfileData.claimableUsdtBalance || 0);
    if (claimableUsdt < MIN_USDT_WITHDRAWAL_USD_VALUE) {
      message.warn(`Minimum USDT withdrawal is $${MIN_USDT_WITHDRAWAL_USD_VALUE.toFixed(USDT_DECIMALS)}. Your balance: $${claimableUsdt.toFixed(USDT_DECIMALS)}`);
      return;
    }
    setIsWithdrawUsdtLoading(true);
    const key = 'usdtWithdrawalUserCard';
    message.loading({ content: 'Processing USDT withdrawal...', key, duration: 0 });
    try {
      const response = await requestUsdtWithdrawal({
        userWalletAddress: rawAddress,
        amountUsdt: claimableUsdt
      });
      message.success({ content: response.data.message || "USDT Withdrawal request submitted successfully!", key, duration: 5 });
      if (onRefreshAllData) onRefreshAllData(false);
    } catch (error) {
      message.error({ content: error?.response?.data?.message || "USDT Withdrawal request failed.", key, duration: 5 });
      console.error("USDT Withdrawal Error from UserProfileCard:", error);
    } finally {
      setIsWithdrawUsdtLoading(false);
    }
  };

  const handleWithdrawArix = async () => {
    if (!rawAddress || !userProfileData || !currentArxPrice || currentArxPrice <= 0) {
      message.warn("Cannot process ARIX withdrawal: Price or balance info missing. Please refresh.");
      return;
    }
    const claimableArix = parseFloat(userProfileData.claimableArixRewards || 0);
    const minArixForWithdrawal = MIN_USDT_WITHDRAWAL_USD_VALUE / currentArxPrice;

    if (claimableArix < minArixForWithdrawal) {
      message.warn(`Minimum ARIX withdrawal is approx. ${minArixForWithdrawal.toFixed(ARIX_DECIMALS)} ARIX ($${MIN_USDT_WITHDRAWAL_USD_VALUE.toFixed(USDT_DECIMALS)}). Your balance: ${claimableArix.toFixed(ARIX_DECIMALS)} ARIX.`);
      return;
    }

    setIsWithdrawArixLoading(true);
    const key = 'arixWithdrawalUserCard';
    message.loading({ content: 'Processing ARIX reward withdrawal...', key, duration: 0 });
    try {
      const response = await requestArixRewardWithdrawal({
        userWalletAddress: rawAddress,
        amountArix: claimableArix
      });
      message.success({ content: response.data.message || "ARIX reward withdrawal request submitted!", key, duration: 5 });
      if (onRefreshAllData) onRefreshAllData(false);
    } catch (error) {
      message.error({ content: error?.response?.data?.message || "ARIX reward withdrawal failed.", key, duration: 5 });
      console.error("ARIX Reward Withdrawal Error:", error);
    } finally {
      setIsWithdrawArixLoading(false);
    }
  };

  const handleUnstakeNowClick = () => {
    if (onInitiateUnstakeProcess) {
      onInitiateUnstakeProcess();
    } else {
      message.info("Unstake feature is managed on the Earn page or not available right now.");
    }
  };

  const explorerLink = userFriendlyAddress ? `${TON_EXPLORER_URL}/address/${userFriendlyAddress}` : '#';

  const copyUserAddress = () => {
    if (!userFriendlyAddress) return;
    navigator.clipboard.writeText(userFriendlyAddress)
        .then(() => message.success('Wallet address copied!'))
        .catch(err => message.error('Failed to copy address.'));
  };

  const totalStakedArix = activeStakes?.reduce((sum, stake) => sum + parseFloat(stake.arixAmountStaked || 0), 0) || 0;
  const totalStakedUsdtEquivalent = currentArxPrice && totalStakedArix > 0 ? (totalStakedArix * currentArxPrice) : 0;

  const claimableUsdtNum = parseFloat(userProfileData?.claimableUsdtBalance || 0);
  const claimableArixNum = parseFloat(userProfileData?.claimableArixRewards || 0);
  const minArixForWithdrawal = currentArxPrice && currentArxPrice > 0 ? (MIN_USDT_WITHDRAWAL_USD_VALUE / currentArxPrice) : Infinity;

  if (!userFriendlyAddress && !isDataLoading) {
    return (
        <Card className="dark-theme-card profile-dashboard-card connect-wallet-prompt" bordered={false}>
          <WalletOutlined className="connect-wallet-icon" />
          <Title level={4} className="connect-wallet-title">Connect Your Wallet</Title>
          <Paragraph className="connect-wallet-text">
            Please connect your TON wallet to view your ARIX user dashboard, manage stakes, and track rewards.
          </Paragraph>
          <Button type="primary" size="large" onClick={() => tonConnectUI.openModal()} icon={<LinkOutlined />}>
            Connect Wallet
          </Button>
        </Card>
    );
  }

  return (
      <Card className="dark-theme-card profile-dashboard-card" bordered={false}>
        <Spin spinning={isDataLoading || loadingArixWalletBalance} tip="Loading dashboard data...">
          <Row gutter={isMobile ? [16, 20] : [24, 24]}>
            <Col xs={24} md={24} lg={8} className="dashboard-column wallet-details-column">
              <Title level={5} className="dashboard-column-title">Wallet & ARIX Info</Title>
              <Paragraph className="dashboard-text-item ellipsis-text">
                <Text strong className="dashboard-label">Address: </Text>
                <Tooltip title={userFriendlyAddress || 'N/A'}>
                  <Text className="dashboard-value">
                    {isMobile ? `${userFriendlyAddress?.slice(0, 6)}...${userFriendlyAddress?.slice(-4)}` : userFriendlyAddress || 'N/A'}
                  </Text>
                </Tooltip>
                <Button icon={<CopyOutlined />} type="text" size="small" onClick={copyUserAddress} className="dashboard-action-icon" />
              </Paragraph>
              <Paragraph className="dashboard-text-item">
                <Text strong className="dashboard-label">Explorer: </Text>
                <a href={explorerLink} target="_blank" rel="noopener noreferrer" className="dashboard-link">
                  <GlobalOutlined style={{ marginRight: 4 }} />View on Tonscan
                </a>
              </Paragraph>
              <AntdStatistic
                  title="ARIX Wallet Balance"
                  value={arixWalletBalance.toFixed(ARIX_DECIMALS)}
                  suffix=" ARIX"
                  valueStyle={{ color: '#7065F0' }}
                  className="dashboard-statistic"
              />
              {currentArxPrice != null && (
                  <Text className="dashboard-value-equivalent">
                    ~${(arixWalletBalance * currentArxPrice).toFixed(USD_DECIMALS)} USD
                  </Text>
              )}
              <AntdStatistic
                  title="Current ARIX Price"
                  value={currentArxPrice ? `$${currentArxPrice.toFixed(4)}` : 'Loading...'}
                  valueStyle={{color: '#58D6FF'}}
                  className="dashboard-statistic"
              />
              <Button
                  icon={<RedoOutlined />}
                  onClick={handleRefresh}
                  loading={isDataLoading || loadingArixWalletBalance}
                  block
                  className="dashboard-button refresh-button"
                  size="middle"
              >
                Refresh Data
              </Button>
            </Col>

            <Col xs={24} md={12} lg={8} className="dashboard-column staking-rewards-column">
              <Title level={5} className="dashboard-column-title">Staking & Rewards</Title>
              <AntdStatistic title="Total Staked ARIX" value={totalStakedArix.toFixed(ARIX_DECIMALS)} suffix=" ARIX" className="dashboard-statistic"/>
              {currentArxPrice != null && totalStakedArix > 0 && (
                  <Text className="dashboard-value-equivalent">
                    ~${totalStakedUsdtEquivalent.toFixed(USD_DECIMALS)} USD
                  </Text>
              )}
              <AntdStatistic title="Accumulated Reward (USDT)" value={`$${claimableUsdtNum.toFixed(USDT_DECIMALS)}`} valueStyle={{ color: '#4CAF50' }} className="dashboard-statistic" />
              <Button
                  type="primary"
                  icon={<DollarCircleOutlined />}
                  onClick={handleWithdrawUsdt}
                  disabled={claimableUsdtNum < MIN_USDT_WITHDRAWAL_USD_VALUE || isWithdrawUsdtLoading || !userFriendlyAddress}
                  loading={isWithdrawUsdtLoading}
                  block
                  className="dashboard-button withdraw-usdt-button"
                  size="middle"
              >
                Withdraw USDT Reward
              </Button>
              {claimableUsdtNum > 0 && claimableUsdtNum < MIN_USDT_WITHDRAWAL_USD_VALUE &&
                  <Alert message={`Min. USDT withdrawal: $${MIN_USDT_WITHDRAWAL_USD_VALUE.toFixed(USDT_DECIMALS)}`} type="warning" showIcon className="mini-alert"/>
              }
              <div style={{marginTop: 16}}>
                <AntdStatistic title="Claimable ARIX (Games/Tasks)" value={`${claimableArixNum.toFixed(ARIX_DECIMALS)} ARIX`} valueStyle={{color: '#FFC107'}} className="dashboard-statistic"/>
                <Button
                    onClick={handleWithdrawArix}
                    disabled={!currentArxPrice || claimableArixNum < minArixForWithdrawal || isWithdrawArixLoading || !userFriendlyAddress}
                    loading={isWithdrawArixLoading}
                    block className="dashboard-button withdraw-arix-button" size="middle"
                > Withdraw ARIX Rewards</Button>
                {currentArxPrice && claimableArixNum > 0 && claimableArixNum < minArixForWithdrawal &&
                    <Alert message={`Min. ARIX withdrawal ~ $${MIN_USDT_WITHDRAWAL_USD_VALUE.toFixed(USDT_DECIMALS)}`} type="warning" showIcon className="mini-alert"/>
                }
              </div>
              <Button
                  danger
                  icon={<LogoutOutlined />}
                  onClick={handleUnstakeNowClick}
                  disabled={totalStakedArix <= 0 || !userFriendlyAddress}
                  block
                  className="dashboard-button unstake-button"
                  size="middle"
              >
                Unstake ARIX Now
              </Button>
              {totalStakedArix > 0 &&
                  <Tooltip title="Early unstaking of ARIX principal incurs a penalty specific to the staking plan. USDT rewards are not affected by this ARIX penalty.">
                    <Paragraph className="dashboard-note">
                      <InfoCircleOutlined style={{marginRight: 4}} /> Early unstake penalty applies.
                    </Paragraph>
                  </Tooltip>
              }
            </Col>

            <Col xs={24} md={12} lg={8} className="dashboard-column referral-info-column">
              <Title level={5} className="dashboard-column-title">Referral Network</Title>
              <AntdStatistic title="Total Users Invited" value={referralData?.totalUsersInvited ?? 'N/A'} className="dashboard-statistic"/>
              <AntdStatistic title="Level 1 Referrals" value={referralData?.l1ReferralCount ?? 'N/A'} className="dashboard-statistic"/>
              <AntdStatistic title="Level 2 Referrals" value={referralData?.l2ReferralCount ?? 'N/A'} className="dashboard-statistic"/>
              <AntdStatistic title="L1 Earnings (USDT)" value={`$${parseFloat(referralData?.l1EarningsUsdt ?? 0).toFixed(USDT_DECIMALS)}`} valueStyle={{ color: '#4CAF50' }} className="dashboard-statistic"/>
              <AntdStatistic title="L2 Earnings (USDT)" value={`$${parseFloat(referralData?.l2EarningsUsdt ?? 0).toFixed(USDT_DECIMALS)}`} valueStyle={{ color: '#4CAF50' }} className="dashboard-statistic"/>
              <Button
                  type="default"
                  icon={<TeamOutlined />}
                  onClick={() => navigate('/referral')}
                  block
                  className="dashboard-button view-referral-button"
                  size="middle"
              >
                View Referral Panel
              </Button>
            </Col>
          </Row>
        </Spin>
      </Card>
  );
};

export default UserProfileCard;

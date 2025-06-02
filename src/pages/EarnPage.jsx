// File: AR_Proj/AR_FRONTEND/src/pages/EarnPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Row, Col, Card, InputNumber, Button, Typography, Spin, message, Modal, Alert, Divider, Statistic as AntdStatistic } from 'antd';
import { useTonConnectUI, useTonAddress } from '@tonconnect/ui-react';
import { CheckCircleOutlined, RedoOutlined, InfoCircleOutlined, DollarCircleOutlined } from '@ant-design/icons';
import { Cell, Builder } from '@ton/core';
import { v4 as uuidv4 } from 'uuid'; 

import StakingPlans from '../components/earn/StakingPlans';
import { 
    getStakingConfig, 
    recordUserStake, 
    getUserStakesAndRewards,
    initiateArixUnstake,
    confirmArixUnstake,
    requestUsdtWithdrawal      
} from '../services/api'; 
import {
  getJettonWalletAddress,
  getJettonBalance,
  createJettonTransferMessage,
  createStakeForwardPayload, 
  toArixSmallestUnits,
  fromArixSmallestUnits,
  ARIX_DECIMALS,
  waitForTransactionConfirmation
} from '../utils/tonUtils';
import { getArxUsdtPriceFromBackend } from '../services/priceServiceFrontend';

const { Title, Text, Paragraph } = Typography;

const ARIX_JETTON_MASTER_ADDRESS = import.meta.env.VITE_ARIX_TOKEN_MASTER_ADDRESS;
let STAKING_CONTRACT_ADDRESS = import.meta.env.VITE_STAKING_CONTRACT_ADDRESS; 
let STAKING_CONTRACT_JETTON_WALLET_ADDRESS = import.meta.env.VITE_STAKING_CONTRACT_JETTON_WALLET_ADDRESS;
const MIN_USDT_WITHDRAWAL = 3; 

const getReferrerAddress = () => {
    return null; 
};

const uuidToScStakeId = (uuidStr) => {
    if (!uuidStr) return BigInt(0);
    const hexPart = uuidStr.replace(/-/g, '').substring(0, 16); 
    return BigInt('0x' + hexPart);
};

const EarnPage = () => {
  const [stakingConfigData, setStakingConfigData] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [inputUsdtAmount, setInputUsdtAmount] = useState(null);
  const [calculatedArixAmount, setCalculatedArixAmount] = useState(0);
  
  const [currentArxPrice, setCurrentArxPrice] = useState(null);
  const [arixBalance, setArixBalance] = useState(0);
  const [totalClaimableUsdt, setTotalClaimableUsdt] = useState(0);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false); 
  const [stakeSubmitLoading, setStakeSubmitLoading] = useState(false); 
  const [unstakeSubmitLoading, setUnstakeSubmitLoading] = useState(false); 

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [activeStakes, setActiveStakes] = useState([]);

  const userFriendlyAddress = useTonAddress();
  const rawAddress = useTonAddress(false); 
  const [tonConnectUI] = useTonConnectUI();

  const fetchStakingConfigAndPrice = useCallback(async () => {
    try {
      const response = await getStakingConfig();
      const config = response.data;
      setStakingConfigData(config);

      STAKING_CONTRACT_ADDRESS = config?.stakingContractAddress || STAKING_CONTRACT_ADDRESS;
      STAKING_CONTRACT_JETTON_WALLET_ADDRESS = config?.stakingContractJettonWalletAddress || STAKING_CONTRACT_JETTON_WALLET_ADDRESS;
      
      if (config?.currentArxUsdtPrice) {
        setCurrentArxPrice(config.currentArxUsdtPrice);
      } else {
        const price = await getArxUsdtPriceFromBackend();
        setCurrentArxPrice(price);
      }
    } catch (error) {
      message.error("Failed to fetch staking configuration.", 5);
      console.error("[EarnPage] Fetch staking config error:", error);
    }
  }, []);

  const fetchArixBalance = useCallback(async () => {
    if (!rawAddress || !ARIX_JETTON_MASTER_ADDRESS) { setArixBalance(0); return; }
    try {
      const userArixJettonWallet = await getJettonWalletAddress(rawAddress, ARIX_JETTON_MASTER_ADDRESS);
      if (userArixJettonWallet) {
        const balanceSmallestUnits = await getJettonBalance(userArixJettonWallet);
        setArixBalance(fromArixSmallestUnits(balanceSmallestUnits));
      } else { setArixBalance(0); }
    } catch (error) { console.error("[EarnPage] Failed to fetch ARIX balance:", error); setArixBalance(0); }
  }, [rawAddress]);

  const fetchUserStakesAndRewardsData = useCallback(async () => {
    if (!rawAddress) { setActiveStakes([]); setTotalClaimableUsdt(0); return; }
    try {
      const response = await getUserStakesAndRewards(rawAddress);
      setActiveStakes(response.data?.stakes || []);
      setTotalClaimableUsdt(parseFloat(response.data?.totalClaimableUsdt || 0));
    } catch (error) {
      message.error('Failed to fetch your stakes & USDT earnings.', 5);
      console.error("[EarnPage] Fetch user stakes/rewards error:", error);
      setActiveStakes([]); setTotalClaimableUsdt(0);
    }
  }, [rawAddress]);

   const refreshAllData = useCallback(async (showSuccessMessage = true) => {
      if (!userFriendlyAddress) return;
      setLoading(true);
      try {
        await Promise.all([ fetchStakingConfigAndPrice(), fetchArixBalance(), fetchUserStakesAndRewardsData() ]);
        if (showSuccessMessage) message.success("All data refreshed!", 2);
      } catch (error) {
        message.error("Failed to refresh all data.", 3);
        console.error("[EarnPage] Error refreshing all data:", error);
      } finally { setLoading(false); }
   }, [userFriendlyAddress, fetchStakingConfigAndPrice, fetchArixBalance, fetchUserStakesAndRewardsData]);

  useEffect(() => {
    setLoading(true);
    fetchStakingConfigAndPrice().finally(() => {
      if (userFriendlyAddress) {
        Promise.all([fetchArixBalance(), fetchUserStakesAndRewardsData()]).finally(() => setLoading(false));
      } else {
        setLoading(false); setArixBalance(0); setActiveStakes([]); setTotalClaimableUsdt(0);
      }
    });
  }, [fetchStakingConfigAndPrice, userFriendlyAddress, fetchArixBalance, fetchUserStakesAndRewardsData]);

  useEffect(() => {
    if (inputUsdtAmount && currentArxPrice && currentArxPrice > 0) {
      setCalculatedArixAmount(parseFloat((inputUsdtAmount / currentArxPrice).toFixed(ARIX_DECIMALS)));
    } else { setCalculatedArixAmount(0); }
  }, [inputUsdtAmount, currentArxPrice]);

  const handlePlanSelect = (plan) => {
    if (!currentArxPrice || currentArxPrice <= 0 || !stakingConfigData?.stakingPlans) {
      message.error("Price or staking plans not available. Please refresh.", 3); refreshAllData(false); return;
    }
    const fullPlanDetails = stakingConfigData.stakingPlans.find(p => (p.key || p.id.toString()) === (plan.key || plan.id.toString()));
    if (!fullPlanDetails) {
      message.error("Selected plan details not found. Please refresh.", 3); refreshAllData(false); return;
    }
    setSelectedPlan(fullPlanDetails);
    setInputUsdtAmount(null); setCalculatedArixAmount(0); setIsModalVisible(true);
  };

  const handleUsdtAmountChange = (value) => { setInputUsdtAmount(value === null ? null : parseFloat(value)); };

  const handleConfirmStake = async () => {
    if (!rawAddress || !selectedPlan || !calculatedArixAmount || calculatedArixAmount <= 0) {
      message.error('Connect wallet, select plan, and enter a valid ARIX amount.', 3); return;
    }
    if (!STAKING_CONTRACT_JETTON_WALLET_ADDRESS || STAKING_CONTRACT_JETTON_WALLET_ADDRESS.includes("PLACEHOLDER") || STAKING_CONTRACT_JETTON_WALLET_ADDRESS === "NOT_YET_DEPLOYED") {
      message.error("Staking contract's Jetton wallet address is not configured.", 5); return;
    }
    const minStakeArix = parseFloat(selectedPlan.minStakeArix || 0);
    if (calculatedArixAmount < minStakeArix) {
      message.error(`Minimum stake for this plan is ${minStakeArix.toFixed(ARIX_DECIMALS)} ARIX.`, 3); return;
    }
    if (calculatedArixAmount > arixBalance) {
      message.error(`Insufficient ARIX balance. You have ${arixBalance.toFixed(ARIX_DECIMALS)} ARIX.`, 3); return;
    }

    setStakeSubmitLoading(true);
    const loadingMessageKey = 'stakeAction';
    message.loading({ content: 'Preparing ARIX stake transaction...', key: loadingMessageKey, duration: 0 });
    
    const dbStakeUUID = uuidv4(); 
    const scStakeIdentifier = uuidToScStakeId(dbStakeUUID); 

    try {
      const userArixJettonWallet = await getJettonWalletAddress(rawAddress, ARIX_JETTON_MASTER_ADDRESS);
      if (!userArixJettonWallet) throw new Error("Your ARIX Jetton Wallet not found.");
      
      const amountInSmallestUnits = toArixSmallestUnits(calculatedArixAmount);
      const scPayloadParams = {
          queryId: BigInt(Date.now()), 
          stakeIdentifier: scStakeIdentifier,
          durationSeconds: parseInt(selectedPlan.duration || selectedPlan.duration_days, 10) * 24 * 60 * 60,
          arix_lock_apr_bps: parseInt(selectedPlan.arixLockAprBps || 0), 
          arix_lock_penalty_bps: parseInt(selectedPlan.arixEarlyUnstakePenaltyPercent * 100 || 0),
      };
      const forwardPayloadCell = createStakeForwardPayload(scPayloadParams);
      const jettonTransferBody = createJettonTransferMessage(
        amountInSmallestUnits, STAKING_CONTRACT_JETTON_WALLET_ADDRESS, rawAddress,    
        toArixSmallestUnits("0.1"), forwardPayloadCell      
      );
      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 360,
        messages: [{ address: userArixJettonWallet, amount: toArixSmallestUnits("0.15").toString(), payload: jettonTransferBody.toBoc().toString("base64") }],
      };
      
      message.loading({ content: 'Please confirm transaction in your wallet...', key: loadingMessageKey, duration: 0 });
      const result = await tonConnectUI.sendTransaction(transaction);
      
      message.loading({ content: 'Transaction sent, awaiting blockchain confirmation...', key: loadingMessageKey, duration: 0 });
      const externalMessageCell = Cell.fromBase64(result.boc);
      const txHash = await waitForTransactionConfirmation(rawAddress, externalMessageCell);

      if (!txHash) {
        throw new Error('Failed to confirm stake transaction on blockchain. Please check your wallet and try again or contact support if ARIX was deducted.');
      }
      
      message.loading({ content: 'Transaction confirmed! Recording ARIX stake with backend...', key: loadingMessageKey, duration: 0 });
      await recordUserStake({
        planKey: selectedPlan.key || selectedPlan.id.toString(), 
        arixAmount: calculatedArixAmount,
        userWalletAddress: rawAddress, 
        transactionBoc: result.boc, 
        transactionHash: txHash, 
        stakeUUID: dbStakeUUID, 
        referenceUsdtValue: inputUsdtAmount, 
        referrerWalletAddress: getReferrerAddress() 
      });
      message.success({ content: `ARIX Stake for ${calculatedArixAmount.toFixed(ARIX_DECIMALS)} ARIX submitted & recorded! Backend will verify.`, key: loadingMessageKey, duration: 6 });
      
      setIsModalVisible(false); setSelectedPlan(null); setInputUsdtAmount(null);
      setTimeout(() => { refreshAllData(false); }, 7000); 
      setTimeout(() => { refreshAllData(false); }, 35000);
    } catch (error) {
      message.error({ content: error?.response?.data?.message || error?.message || 'ARIX Staking failed.', key: loadingMessageKey, duration: 6 });
      console.error('[EarnPage] ARIX Staking tx/record error:', error);
    } finally {
      setStakeSubmitLoading(false);
    }
  };

  const handleUnstake = async (stakeToUnstake) => { 
    if (!rawAddress || !STAKING_CONTRACT_ADDRESS || STAKING_CONTRACT_ADDRESS.includes("PLACEHOLDER")) {
      message.error("Wallet not connected or Staking Contract Address not configured.", 3); return;
    }
    
    setActionLoading(true);
    const loadingMessageKey = 'unstakeAction';
    message.loading({ content: `Preparing ARIX unstake for stake ID ${stakeToUnstake.id?.substring(0,6)}...`, key: loadingMessageKey, duration: 0 });
    
    try {
      const prepResponse = await initiateArixUnstake({ userWalletAddress: rawAddress, stakeId: stakeToUnstake.id });
      setActionLoading(false);
      message.destroy(loadingMessageKey);

      Modal.confirm({
        title: <Text style={{color: '#00adee', fontWeight: 'bold'}}>Confirm ARIX Principal Unstake</Text>, className: "glass-pane", 
        content: ( 
           <div>
            <Paragraph>{prepResponse.data.message}</Paragraph>
            <Paragraph><Text strong style={{color: '#aaa'}}>ARIX Principal: </Text><Text style={{color: 'white'}}>{prepResponse.data.principalArix} ARIX</Text></Paragraph>
            {prepResponse.data.isEarly && <Paragraph><Text strong style={{color: '#aaa'}}>ARIX Early Penalty: </Text><Text style={{color: '#ff7875'}}>{prepResponse.data.arixPenaltyPercentApplied}% of principal</Text></Paragraph>}
            <Divider style={{borderColor: 'rgba(255,255,255,0.1)'}}/>
            <Paragraph style={{color: '#ccc', fontSize: '0.9em'}}>This action will call the ARIX Staking Smart Contract to withdraw your ARIX principal. USDT rewards are separate and managed by the backend.</Paragraph>
          </div>
        ),
        okText: 'Proceed with ARIX Unstake', cancelText: 'Cancel',
        confirmLoading: unstakeSubmitLoading, 
        onOk: async () => {
          setUnstakeSubmitLoading(true);
          message.loading({ content: 'Please confirm ARIX unstake in your wallet...', key: loadingMessageKey, duration: 0 });
          try {
            const scStakeIdentifierToWithdraw = uuidToScStakeId(stakeToUnstake.id); 

            const unstakePayloadBuilder = new Builder();
            unstakePayloadBuilder.storeUint(BigInt(Date.now()), 64); 
            unstakePayloadBuilder.storeUint(scStakeIdentifierToWithdraw, 64); 
            
            const unstakePayloadCell = unstakePayloadBuilder.asCell();
            const transaction = {
              validUntil: Math.floor(Date.now() / 1000) + 360, 
              messages: [{ address: STAKING_CONTRACT_ADDRESS, amount: toArixSmallestUnits("0.05").toString(), payload: unstakePayloadCell.toBoc().toString("base64") }],
            };
            const result = await tonConnectUI.sendTransaction(transaction);
            
            message.loading({ content: 'Unstake transaction sent, awaiting blockchain confirmation...', key: loadingMessageKey, duration: 0 });
            const externalMessageCell = Cell.fromBase64(result.boc);
            const txHash = await waitForTransactionConfirmation(rawAddress, externalMessageCell);

            if (!txHash) {
              throw new Error('Failed to confirm unstake transaction on blockchain. Please check your wallet.');
            }
            
            message.loading({ content: 'Transaction confirmed! Finalizing ARIX unstake with backend...', key: loadingMessageKey, duration: 0 });
            await confirmArixUnstake({ 
                userWalletAddress: rawAddress, 
                stakeId: stakeToUnstake.id, 
                unstakeTransactionBoc: result.boc,
                unstakeTransactionHash: txHash 
            });
            message.success({ content: "ARIX unstake request submitted! Backend will verify.", key: loadingMessageKey, duration: 7 });
            
            setTimeout(() => { refreshAllData(false); }, 7000);
            setTimeout(() => { refreshAllData(false); }, 35000);
            setUnstakeSubmitLoading(false);
            return Promise.resolve();
          } catch (txError) {
            message.error({ content: txError?.response?.data?.message || txError?.message || 'ARIX unstake failed.', key: loadingMessageKey, duration: 6 });
            console.error("[EarnPage] On-chain ARIX Unstake Tx Error:", txError);
            setUnstakeSubmitLoading(false);
            return Promise.reject();
          }
        },
        onCancel: () => { setUnstakeSubmitLoading(false); },
      });
    } catch (error) {
      message.error({ content: error?.response?.data?.message || 'ARIX unstake initiation failed.', key: loadingMessageKey, duration: 5 });
      console.error("[EarnPage] Initiate ARIX Unstake Error:", error);
      setActionLoading(false);
    }
  };
  
  const handleWithdrawUsdtRewards = async () => {
    if (totalClaimableUsdt < MIN_USDT_WITHDRAWAL) {
      message.warn(`Minimum USDT withdrawal is $${MIN_USDT_WITHDRAWAL.toFixed(2)}. Your balance: $${totalClaimableUsdt.toFixed(2)}.`); return;
    }
    setActionLoading(true); 
    const hideMsg = message.loading({content: "Processing USDT withdrawal...", duration: 0});
    try {
        const response = await requestUsdtWithdrawal({ userWalletAddress: rawAddress, amountUsdt: totalClaimableUsdt });
        message.success(response.data.message || "USDT withdrawal request submitted!", 6);
        refreshAllData(false); 
    } catch (error) {
        message.error(error?.response?.data?.message || "USDT withdrawal request failed.", 5);
        console.error("[EarnPage] USDT Withdrawal Error:", error);
    } finally { hideMsg(); setActionLoading(false); }
  };

  if (!userFriendlyAddress && !loading) {
    return ( 
        <div style={{ textAlign: 'center', marginTop: '50px', padding: 20 }} className="glass-pane">
            <Title level={3} style={{color: 'white'}}>Connect Your TON Wallet</Title>
            <Paragraph style={{color: '#ccc', marginBottom: 20}}>To access staking and manage earnings, please connect your TON wallet.</Paragraph>
            <Button type="primary" size="large" onClick={() => tonConnectUI?.openModal()}>Connect Wallet</Button>
        </div>
    );
  }

  if (loading && !stakingConfigData && !activeStakes.length) { 
       return ( 
            <div style={{ textAlign: 'center', marginTop: '50px', padding: 20, minHeight: 'calc(100vh - 128px)'}}>
                 <Spin spinning={true} tip="Loading ARIX Staking Hub..." size="large" />
                 <Paragraph style={{color: '#ccc', marginTop: 20}}>Fetching plans, balances, and stakes...</Paragraph>
            </div>
       );
  }

  return (
    <Spin spinning={loading && (!!stakingConfigData || activeStakes.length > 0)} tip="Refreshing data..." size="large"> 
      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        <Row justify="center" style={{ marginBottom: 30 }} gutter={[20,20]}>
          <Col xs={24} lg={14}>
            <div style={{padding: '20px', height: '100%'}} className="glass-pane"> 
              <Title level={3} style={{ color: 'white', fontWeight: 'bold', marginBottom: 12, textAlign: 'center' }}>Stake ARIX, Earn USDT Rewards</Title>
              {userFriendlyAddress ? <>
                <Paragraph style={{textAlign: 'center', marginBottom: 6}}>
                    <Text style={{ color: '#aaa' }}>Wallet: </Text>
                    <Text copyable={{ text: userFriendlyAddress }} style={{color: '#00adee'}}>{`${userFriendlyAddress?.slice(0,6)}...${userFriendlyAddress?.slice(-4)}`}</Text> 
                </Paragraph>
                <Paragraph style={{textAlign: 'center', marginBottom: 6}}>
                    <Text style={{ color: '#aaa' }}>ARIX Balance: </Text>
                    <Text strong style={{color: '#00adee', fontSize: '1.1em'}}>{arixBalance.toFixed(ARIX_DECIMALS)} ARIX</Text>
                </Paragraph>
                {currentArxPrice != null && (
                <Paragraph style={{textAlign: 'center', fontSize: '0.9em', marginBottom: 15}}>
                    <Text style={{ color: '#aaa' }}>ARIX Price: ~${currentArxPrice.toFixed(5)} / ARIX</Text>
                </Paragraph>
                )}
              </> : <Paragraph style={{textAlign: 'center', color: '#aaa'}}>Connect wallet to see balances.</Paragraph>}
            </div>
          </Col>
          <Col xs={24} lg={10}>
             <div style={{padding: '20px', height: '100%'}} className="glass-pane">
                <Title level={4} style={{ color: 'white', fontWeight: 'bold', marginBottom: 10, textAlign: 'center' }}>Your USDT Rewards</Title>
                {userFriendlyAddress ? <>
                    <AntdStatistic 
                        title={<Text style={{color: '#aaa', textAlign:'center', display:'block'}}>Total Claimable (Est.)</Text>} 
                        value={totalClaimableUsdt.toFixed(2)} 
                        valueStyle={{color: '#52c41a', fontWeight: 'bold', fontSize: '2em', textAlign: 'center', lineHeight: '1.2'}} 
                        suffix="USDT" 
                    />
                    <Paragraph style={{color: '#888', fontSize: '0.8em', textAlign: 'center', marginTop: 5, marginBottom: 15}}>
                        Min withdrawal ${MIN_USDT_WITHDRAWAL}.00 USDT. Calculated by backend.
                    </Paragraph>
                    <Button type="primary" icon={<DollarCircleOutlined />} onClick={handleWithdrawUsdtRewards} 
                            disabled={totalClaimableUsdt < MIN_USDT_WITHDRAWAL || actionLoading || !userFriendlyAddress} loading={actionLoading} block>
                        Withdraw Claimable USDT
                    </Button>
                </> : <Paragraph style={{textAlign: 'center', color: '#aaa'}}>Connect wallet to view/withdraw USDT rewards.</Paragraph>}
             </div>
          </Col>
        </Row>
        <div style={{textAlign: 'center', marginBottom: 30}}>
            <Button icon={<RedoOutlined/>} onClick={() => refreshAllData(true)} loading={loading && (!!stakingConfigData || activeStakes.length > 0)} size="middle" disabled={!userFriendlyAddress}>Refresh All Data</Button> 
        </div>

        <StakingPlans
          plans={stakingConfigData?.stakingPlans || []}
          onSelectPlan={handlePlanSelect}
          currentArxPrice={currentArxPrice}
        />

        {userFriendlyAddress && activeStakes.length > 0 && (
          <div style={{ marginTop: '50px' }}>
            <Title level={3} style={{ color: 'white', textAlign: 'center', marginBottom: '30px', fontWeight: 'bold'}}>
              Your Stakes & Earnings Overview
            </Title>
            <Row gutter={[24, 24]} justify="center"> 
              {activeStakes.map(stake => (
                <Col xs={24} sm={18} md={12} lg={8} key={stake.id}> 
                  <Card className="neumorphic-glass-card" title={<Text style={{color: '#00adee', fontWeight: 'bold'}}>{stake.planTitle} (ARIX Stake)</Text>} style={{height: '100%'}}>
                     <AntdStatistic title={<Text style={{color: '#aaa'}}>ARIX Staked</Text>} value={stake.arixAmountStaked} suffix=" ARIX" valueStyle={{color: 'white'}} />
                     <AntdStatistic title={<Text style={{color: '#aaa'}}>Value at Stake Time</Text>} value={`$${stake.referenceUsdtValueAtStakeTime || '0.00'}`} valueStyle={{color: '#ccc', fontSize: '0.9em'}}/>
                     <AntdStatistic title={<Text style={{color: '#aaa'}}>USDT Reward APR</Text>} value={`${stake.usdtApr || '0.00'}%`} valueStyle={{color: '#52c41a'}}/>
                     <AntdStatistic title={<Text style={{color: '#aaa'}}>Total Accrued USDT</Text>} value={`${stake.accruedUsdtRewardTotal || '0.00'}`} suffix=" USDT" valueStyle={{color: 'white', fontWeight: 'bold'}}/>
                     <AntdStatistic title={<Text style={{color: '#aaa'}}>ARIX Early Penalty</Text>} value={`${stake.arixEarlyUnstakePenaltyPercent || '0'}%`} valueStyle={{color: '#ff7875'}}/>
                     <AntdStatistic title={<Text style={{color: '#aaa'}}>Days Left (ARIX Lock)</Text>} value={stake.remainingDays} valueStyle={{color: 'white'}}/>
                     <AntdStatistic title={<Text style={{color: '#aaa'}}>ARIX Lock Status</Text>} value={stake.status?.replace(/_/g, ' ').toUpperCase()} valueStyle={{color: 'white'}}/> 
                    <div style={{marginTop: '20px', display: 'flex', justifyContent: 'center'}}>
                        {(stake.status === 'active') && (
                           <Button 
                             type="primary" 
                             onClick={() => handleUnstake(stake)} 
                             loading={actionLoading && selectedPlan?.id === stake.id} 
                             danger={new Date() < new Date(stake.unlockTimestamp)}
                           >
                               {new Date() < new Date(stake.unlockTimestamp) ? `Unstake ARIX Early` : `Unstake ARIX`}
                           </Button>
                        )}
                        {(stake.status !== 'active') && <Button type="default" disabled>{stake.status?.replace(/_/g, ' ').toUpperCase()}</Button>}
                    </div>
                     <Text style={{fontSize: '12px', color: '#888', display: 'block', marginTop: '10px', textAlign: 'center'}}>
                        {stake.status === 'active' && new Date() < new Date(stake.unlockTimestamp) ? `Unstaking ARIX principal early incurs a ${stake.arixEarlyUnstakePenaltyPercent}% penalty.` : `ARIX lock status: ${stake.status?.replace(/_/g, ' ')}. USDT rewards are managed separately.`}
                    </Text>
                  </Card>
                </Col>
              ))}
            </Row>
          </div>
        )}
         {userFriendlyAddress && activeStakes.length === 0 && !loading && stakingConfigData && (
             <div style={{textAlign: 'center', color: '#aaa', marginTop: 40, padding: 20}} className="glass-pane">You have no active ARIX stakes yet. Choose a plan above to start earning USDT rewards!</div>
         )}
         {!userFriendlyAddress && !loading && stakingConfigData && (
              <div style={{textAlign: 'center', color: '#aaa', marginTop: 40, padding: 20}} className="glass-pane">Connect your wallet to view and manage your stakes.</div>
         )}

        <Modal
          title={<Text style={{color: '#00adee', fontWeight: 'bold'}}>{`Stake ARIX in "${selectedPlan?.title || ''}"`}</Text>}
          open={isModalVisible}
          onCancel={() => {setIsModalVisible(false); setSelectedPlan(null); setInputUsdtAmount(null);}}
          className="glass-pane" destroyOnClose 
          footer={[ 
            <Button key="back" onClick={() => {setIsModalVisible(false); setSelectedPlan(null); setInputUsdtAmount(null);}} className="neumorphic-button">Cancel</Button>,
            <Button key="submit" type="primary" loading={stakeSubmitLoading} onClick={handleConfirmStake}
                     disabled={!calculatedArixAmount || calculatedArixAmount <= 0 || calculatedArixAmount > arixBalance || calculatedArixAmount < (parseFloat(selectedPlan?.minStakeArix) || 0) }>
              Stake {calculatedArixAmount > 0 ? calculatedArixAmount.toFixed(ARIX_DECIMALS) : ''} ARIX
            </Button>
          ]}
        >
          {selectedPlan && ( 
            <>
              <Paragraph><Text strong style={{color: '#aaa'}}>ARIX Lock Duration: </Text><Text style={{color: 'white'}}>{selectedPlan.duration || selectedPlan.duration_days} days</Text></Paragraph>
              <Paragraph><Text strong style={{color: '#aaa'}}>USDT Reward APR: </Text><span style={{color: '#52c41a', fontWeight: 'bold'}}>{selectedPlan.usdtApr}% USDT</span></Paragraph>
              <Paragraph><Text strong style={{color: '#aaa'}}>ARIX Early Unstake Penalty: </Text><span style={{color: '#ff7875', fontWeight: 'bold'}}>{selectedPlan.arixEarlyUnstakePenaltyPercent}% of staked ARIX</span></Paragraph>
              <Paragraph><Text strong style={{color: '#aaa'}}>Minimum ARIX Stake: </Text><Text style={{color: 'white'}}>{parseFloat(selectedPlan.minStakeArix).toFixed(ARIX_DECIMALS)} ARIX</Text></Paragraph>
              <Divider style={{borderColor: 'rgba(255,255,255,0.1)'}}/>
              <Paragraph><Text strong style={{color: '#aaa'}}>Your ARIX Balance: </Text><Text style={{color: '#00adee', fontWeight: 'bold'}}>{arixBalance.toFixed(ARIX_DECIMALS)} ARIX</Text></Paragraph> 
              <div style={{ margin: '20px 0' }}>
                <Text strong style={{color: '#aaa', display: 'block', marginBottom: 8}}>ARIX to Stake (Enter equivalent USDT value you want to stake):</Text>
                <InputNumber
                  style={{ width: '100%'}} addonBefore={<Text style={{color: '#aaa'}}>$</Text>}
                  value={inputUsdtAmount} onChange={handleUsdtAmountChange}
                  placeholder="e.g., 10 for $10 USDT worth of ARIX"
                  formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value ? value.toString().replace(/\$\s?|(,*)/g, '') : ''}
                  min={0.01} precision={2} step={1} 
                />
              </div>
              {currentArxPrice && inputUsdtAmount != null && inputUsdtAmount > 0 && ( 
                <Paragraph style={{
                    color: (calculatedArixAmount > arixBalance || calculatedArixAmount < (parseFloat(selectedPlan.minStakeArix) || 0)) ? '#ff7875' : '#52c41a',
                    fontWeight: 'bold', marginTop: 10, padding: '8px', background: 'rgba(0,0,0,0.1)', borderRadius: '8px'
                  }}
                >
                  This equals approx. {calculatedArixAmount.toFixed(ARIX_DECIMALS)} ARIX.
                  {calculatedArixAmount > arixBalance && " (Insufficient ARIX Balance)"}
                  {calculatedArixAmount < (parseFloat(selectedPlan.minStakeArix) || 0) && calculatedArixAmount > 0 && ` (Min ARIX stake: ${parseFloat(selectedPlan.minStakeArix).toFixed(ARIX_DECIMALS)})`}
                </Paragraph>
              )}
               {(inputUsdtAmount !== null && inputUsdtAmount <= 0 && selectedPlan) && (
                   <Paragraph style={{color: '#ff7875', marginTop: 10}}>Stake amount must correspond to a value greater than $0.00 USDT.</Paragraph>
               )}
            </>
          )}
        </Modal>
      </div>
    </Spin>
  );
};

export default EarnPage;
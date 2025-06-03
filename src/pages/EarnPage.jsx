// File: AR_FRONTEND/src/pages/EarnPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Row, Col, Card, InputNumber, Button, Typography, Spin, message, Modal, Alert, Divider, Statistic as AntdStatistic } from 'antd';
import { useTonConnectUI, useTonAddress } from '@tonconnect/ui-react';
import { CheckCircleOutlined, RedoOutlined, InfoCircleOutlined, DollarCircleOutlined, RocketOutlined } from '@ant-design/icons';
import { Cell, Builder } from '@ton/core';
import { v4 as uuidv4 } from 'uuid'; 

import StakingPlans from '../components/earn/StakingPlans';
import { 
    getStakingConfig, 
    recordUserStake, 
    getUserStakesAndRewards,
    initiateArixUnstake,
    confirmArixUnstake,
    requestArixRewardWithdrawal      
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
const MIN_ARIX_WITHDRAWAL_APPROX_USD_VALUE = 3; 

const getReferrerAddress = () => {
    // Implement actual referrer fetching if needed, e.g., from URL params or Telegram launch params
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
  const [totalClaimableArix, setTotalClaimableArix] = useState(0);

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
        // Fallback if not in config (though it should be)
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
    if (!rawAddress) { setActiveStakes([]); setTotalClaimableArix(0); return; }
    try {
      const response = await getUserStakesAndRewards(rawAddress);
      setActiveStakes(response.data?.stakes || []);
      setTotalClaimableArix(parseFloat(response.data?.totalClaimableArix || 0));
    } catch (error) {
      message.error('Failed to fetch your stakes & ARIX earnings.', 5);
      console.error("[EarnPage] Fetch user stakes/rewards error:", error);
      setActiveStakes([]); setTotalClaimableArix(0);
    }
  }, [rawAddress]);

   const refreshAllData = useCallback(async (showSuccessMessage = true) => {
      if (!userFriendlyAddress) return; // Only refresh if connected
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
        setLoading(false); setArixBalance(0); setActiveStakes([]); setTotalClaimableArix(0);
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
    // ... (ARIX Staking logic: wallet check, amount validation, payload creation, tx sending, backend recording)
    // This logic remains identical to your previous version, focusing on UI presentation.
    if (!rawAddress || !selectedPlan || !calculatedArixAmount || calculatedArixAmount <= 0) {
      message.error('Connect wallet, select plan, and enter a valid USD amount to stake.', 3); return;
    }
    if (!STAKING_CONTRACT_JETTON_WALLET_ADDRESS || STAKING_CONTRACT_JETTON_WALLET_ADDRESS.includes("PLACEHOLDER") || STAKING_CONTRACT_JETTON_WALLET_ADDRESS === "NOT_YET_DEPLOYED") {
      message.error("Staking contract's Jetton wallet address is not configured.", 5); return;
    }
    const minUsdForPlan = parseFloat(selectedPlan.minStakeUsd || 0);
    if (inputUsdtAmount < minUsdForPlan) {
      message.error(`Minimum stake for this plan is $${minUsdForPlan.toFixed(2)} USD.`, 3); return;
    }
    if (calculatedArixAmount <= 0) {
        message.error("Calculated ARIX amount is zero. Please enter a valid USD amount to stake.", 3); return;
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
          durationSeconds: parseInt(selectedPlan.duration, 10) * 24 * 60 * 60,
          arix_lock_apr_bps: 0, // On-chain ARIX reward for the lock is 0
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
        throw new Error('Failed to confirm stake transaction. Please check your wallet and try again or contact support if ARIX was deducted.');
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
      message.success({ content: `ARIX Stake for ${calculatedArixAmount.toFixed(ARIX_DECIMALS)} ARIX submitted & recorded!`, key: loadingMessageKey, duration: 6 });
      
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
    // ... (ARIX Unstaking logic: wallet check, SC address, initiateUnstake, confirmUnstake)
    // This logic also remains identical to your previous version.
    if (!rawAddress || !STAKING_CONTRACT_ADDRESS || STAKING_CONTRACT_ADDRESS.includes("PLACEHOLDER")) {
      message.error("Wallet not connected or Staking Contract Address not configured.", 3); return;
    }
    
    setActionLoading(true);
    const loadingMessageKey = 'unstakeAction';
    message.loading({ content: `Preparing ARIX unstake for stake ID ${stakeToUnstake.id?.substring(0,6)}...`, key: loadingMessageKey, duration: 0 });
    
    try {
      const prepResponse = await initiateArixUnstake({ userWalletAddress: rawAddress, stakeId: stakeToUnstake.id });
      setActionLoading(false); // Stop general action loading for this modal step
      message.destroy(loadingMessageKey); // Clear the initial loading message

      Modal.confirm({
        title: <Text style={{color: '#7e73ff', fontWeight: 'bold'}}>Confirm ARIX Principal Unstake</Text>, 
        className: "dark-theme-modal", // Using a more generic class if specific Modal theme is needed
        icon: <RocketOutlined style={{color: '#7e73ff'}}/>,
        content: ( 
           <div>
            <Paragraph>{prepResponse.data.message}</Paragraph>
            <Paragraph><Text strong style={{color: '#aaa'}}>ARIX Principal: </Text><Text style={{color: 'white'}}>{prepResponse.data.principalArix} ARIX</Text></Paragraph>
            {prepResponse.data.isEarly && <Paragraph><Text strong style={{color: '#aaa'}}>ARIX Early Penalty: </Text><Text style={{color: '#F44336'}}>{prepResponse.data.arixPenaltyPercentApplied}% of principal</Text></Paragraph>}
            <Divider style={{borderColor: '#38383a'}}/>
            <Paragraph style={{color: '#ccc', fontSize: '0.9em'}}>This action will call the ARIX Staking Smart Contract to withdraw your ARIX principal. ARIX rewards (calculated based on USD value) are separate and managed by the backend.</Paragraph>
          </div>
        ),
        okText: 'Proceed with ARIX Unstake', cancelText: 'Cancel',
        okButtonProps: {loading: unstakeSubmitLoading}, // Link loading to this specific state
        cancelButtonProps: {disabled: unstakeSubmitLoading},
        onOk: async () => {
          setUnstakeSubmitLoading(true); // Set loading for the OK button in the modal
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
            return Promise.resolve(); // To close modal
          } catch (txError) {
            message.error({ content: txError?.response?.data?.message || txError?.message || 'ARIX unstake failed.', key: loadingMessageKey, duration: 6 });
            console.error("[EarnPage] On-chain ARIX Unstake Tx Error:", txError);
            return Promise.reject(); // To keep modal open
          } finally {
             setUnstakeSubmitLoading(false);
          }
        },
        onCancel: () => { 
            setUnstakeSubmitLoading(false); /* ensure loading is off if cancelled */ 
        },
      });
    } catch (error) {
      message.error({ content: error?.response?.data?.message || 'ARIX unstake initiation failed.', key: loadingMessageKey, duration: 5 });
      console.error("[EarnPage] Initiate ARIX Unstake Error:", error);
      setActionLoading(false);
    }
  };
  
  const handleWithdrawArixRewards = async () => {
    if (!currentArxPrice || currentArxPrice <= 0) {
        message.warn("Cannot process withdrawal: ARIX price not available. Try refreshing.");
        return;
    }
    const minArixWithdrawalAmount = MIN_ARIX_WITHDRAWAL_APPROX_USD_VALUE / currentArxPrice;

    if (totalClaimableArix < minArixWithdrawalAmount) {
      message.warn(`Minimum ARIX withdrawal is approx. ${minArixWithdrawalAmount.toFixed(ARIX_DECIMALS)} ARIX (equivalent to $${MIN_ARIX_WITHDRAWAL_APPROX_USD_VALUE.toFixed(2)} USD). Your balance: ${totalClaimableArix.toFixed(ARIX_DECIMALS)} ARIX.`);
      return;
    }
    setActionLoading(true); 
    const hideMsg = message.loading({content: "Processing ARIX withdrawal...", duration: 0});
    try {
        const response = await requestArixRewardWithdrawal({ userWalletAddress: rawAddress, amountArix: totalClaimableArix });
        message.success({ content: response.data.message || "ARIX withdrawal request submitted!", duration: 6 });
        refreshAllData(false); 
    } catch (error) {
        message.error({ content: error?.response?.data?.message || "ARIX withdrawal request failed.", duration: 5 });
        console.error("[EarnPage] ARIX Withdrawal Error:", error);
    } finally { hideMsg(); setActionLoading(false); }
  };

  const renderFarmOverMessage = () => ( // Function to render the "Farming is over" message from screenshot
    <div className="centered-message">
      <div className="page-image-container">
          <img src="/img/earn-farming-over.png" alt="Farming phase over" style={{maxHeight: '200px'}} />
      </div>
      <Title level={3} style={{ color: 'white', marginBottom: 8}}>Farming is over.</Title>
      <Paragraph style={{ color: '#a0a0a5', fontSize: '1.1rem'}}>New phase SOON!</Paragraph>
    </div>
  );


  // Main Render Logic
  if (!userFriendlyAddress && !loading) { 
    return ( 
      // Wallet not connected message, styled according to new theme
        <Card className="dark-theme-card" style={{ textAlign: 'center', marginTop: '50px', padding: '30px' }}>
            <Title level={3} style={{color: 'white'}}>Connect Your Wallet</Title>
            <Paragraph style={{color: '#a0a0a5', marginBottom: 24, fontSize: '1rem'}}>To access ARIX staking and manage earnings, please connect your TON wallet.</Paragraph>
            <Button type="primary" size="large" onClick={() => tonConnectUI?.openModal()}>Connect Wallet</Button>
        </Card>
    );
  }

  if (loading && !stakingConfigData && (!activeStakes || activeStakes.length === 0)) { 
       return ( 
            <div style={{ textAlign: 'center', padding: '50px 0', minHeight: 'calc(100vh - 112px)'}}>
                 <Spin spinning={true} tip="Loading ARIX Staking Hub..." size="large" />
                 <Paragraph style={{color: '#a0a0a5', marginTop: 20}}>Fetching plans, balances, and your stakes...</Paragraph>
            </div>
       );
  }

  // Check if staking is available based on your config/logic
  const isStakingCurrentlyActive = stakingConfigData?.stakingPlans && stakingConfigData.stakingPlans.length > 0;
  
  return (
    <Spin spinning={loading && (!!stakingConfigData || activeStakes.length > 0)} tip="Refreshing data..." size="large"> 
      <Title level={2} className="page-title">ARIX Staking</Title>
      <div style={{ padding: '0', maxWidth: '900px', margin: '0 auto' }}>
        <Row justify="space-between" align="middle" style={{ marginBottom: 20, padding: '0 8px' }}>
             <Text style={{ color: '#a0a0a5' }}>
                {userFriendlyAddress ? `Wallet: ${userFriendlyAddress?.slice(0,6)}...${userFriendlyAddress?.slice(-4)}` : ''}
            </Text>
            <Button icon={<RedoOutlined/>} onClick={() => refreshAllData(true)} loading={loading && (!!stakingConfigData || activeStakes.length > 0)} size="middle" disabled={!userFriendlyAddress}>Refresh</Button> 
        </Row>
       
        <Card className="dark-theme-card" style={{marginBottom: 24}}>
            <Row gutter={[16, 16]} align="middle" justify="center">
                <Col xs={24} md={12} style={{textAlign: 'center'}}>
                     <AntdStatistic 
                        title="Your ARIX Balance"
                        value={arixBalance.toFixed(ARIX_DECIMALS)} 
                        suffix="ARIX" 
                     />
                    {currentArxPrice != null && (
                        <Text style={{ color: '#6a6a6e', fontSize: '0.8em', display: 'block', marginTop: 4 }}>
                            ~${(arixBalance * currentArxPrice).toFixed(2)} USD
                        </Text>
                    )}
                </Col>
                 <Col xs={24} md={12} style={{textAlign: 'center'}}>
                    <AntdStatistic 
                        title="Claimable ARIX Rewards" 
                        value={totalClaimableArix.toFixed(ARIX_DECIMALS)}
                        valueStyle={{color: '#4CAF50'}} 
                        suffix="ARIX" 
                    />
                    {currentArxPrice != null && (
                        <Text style={{ color: '#6a6a6e', fontSize: '0.8em', display: 'block', marginTop: 4 }}>
                           ~${(totalClaimableArix * currentArxPrice).toFixed(2)} USD
                        </Text>
                    )}
                     <Button 
                        type="primary" 
                        icon={<DollarCircleOutlined />} 
                        onClick={handleWithdrawArixRewards} 
                        disabled={!currentArxPrice || currentArxPrice <= 0 || totalClaimableArix < (MIN_ARIX_WITHDRAWAL_APPROX_USD_VALUE / currentArxPrice) || actionLoading || !userFriendlyAddress} 
                        loading={actionLoading} 
                        style={{marginTop: 12, width: '80%', maxWidth: '200px'}}
                        size="middle"
                    >
                        Withdraw Rewards
                    </Button>
                </Col>
            </Row>
        </Card>

        {isStakingCurrentlyActive ? (
            <StakingPlans
                plans={stakingConfigData?.stakingPlans || []}
                onSelectPlan={handlePlanSelect}
                currentArxPrice={currentArxPrice}
            />
        ) : (
            renderFarmOverMessage() // Display the "Farming is over" message
        )}
        

        {userFriendlyAddress && activeStakes.length > 0 && (
          <div style={{ marginTop: '40px' }}>
            <Title level={3} className="section-title" style={{textAlign: 'center'}}>
              Your Active Stakes
            </Title>
            <Row gutter={[16, 16]} justify="center"> 
              {activeStakes.map(stake => (
                <Col xs={24} sm={20} md={12} key={stake.id}> 
                  <Card className="dark-theme-card" title={<Text style={{color: '#7e73ff', fontWeight: 'bold'}}>{stake.planTitle}</Text>} style={{height: '100%'}}>
                     <AntdStatistic title="ARIX Staked" value={stake.arixAmountStaked} precision={ARIX_DECIMALS} suffix=" ARIX" />
                     <AntdStatistic title="Value at Stake Time" value={`$${parseFloat(stake.referenceUsdtValueAtStakeTime || 0).toFixed(2)}`} />
                     <AntdStatistic title="USD Value Reward APR" value={`${parseFloat(stake.usdValueRewardApr || 0).toFixed(2)}%`} valueStyle={{color: '#4CAF50'}}/>
                     <AntdStatistic title="Total Accrued ARIX Rewards" value={`${parseFloat(stake.accruedArixRewardTotal || 0).toFixed(ARIX_DECIMALS)}`} suffix=" ARIX" valueStyle={{color: '#fff', fontWeight: '500'}}/>
                     <AntdStatistic title="ARIX Early Unstake Penalty" value={`${parseFloat(stake.arixEarlyUnstakePenaltyPercent || 0)}%`} valueStyle={{color: '#F44336'}}/>
                     <AntdStatistic title="Days Left (ARIX Lock)" value={stake.remainingDays} />
                     <AntdStatistic title="ARIX Lock Status" value={stake.status?.replace(/_/g, ' ').toUpperCase()} /> 
                    <div style={{marginTop: '20px', display: 'flex', justifyContent: 'center'}}>
                        {(stake.status === 'active') && (
                           <Button 
                             type={new Date() < new Date(stake.unlockTimestamp) ? "default" : "primary"}
                             onClick={() => handleUnstake(stake)} 
                             loading={actionLoading && selectedPlan?.id === stake.id} 
                             danger={new Date() < new Date(stake.unlockTimestamp)}
                           >
                               {new Date() < new Date(stake.unlockTimestamp) ? `Unstake ARIX Early` : `Unstake ARIX`}
                           </Button>
                        )}
                        {(stake.status !== 'active') && <Button type="default" disabled>{stake.status?.replace(/_/g, ' ').toUpperCase()}</Button>}
                    </div>
                     <Text style={{fontSize: '11px', color: '#6a6a6e', display: 'block', marginTop: '10px', textAlign: 'center'}}>
                        {stake.status === 'active' && new Date() < new Date(stake.unlockTimestamp) ? `Unstaking ARIX principal early incurs a ${stake.arixEarlyUnstakePenaltyPercent}% penalty.` : `ARIX lock status: ${stake.status?.replace(/_/g, ' ')}.`} Rewards are off-chain.
                    </Text>
                  </Card>
                </Col>
              ))}
            </Row>
          </div>
        )}
         {userFriendlyAddress && activeStakes.length === 0 && !loading && stakingConfigData && isStakingCurrentlyActive && (
             <Card className="dark-theme-card" style={{textAlign: 'center', padding: 20}}>
                <Text style={{color: '#a0a0a5'}}>You have no active ARIX stakes yet. Choose a plan above to start earning!</Text>
            </Card>
         )}
         
        <Modal
          title={<Text style={{color: '#7e73ff', fontWeight: 'bold'}}>{`Stake ARIX in "${selectedPlan?.title || ''}"`}</Text>}
          open={isModalVisible}
          onCancel={() => {setIsModalVisible(false); setSelectedPlan(null); setInputUsdtAmount(null);}}
          className="dark-theme-modal" destroyOnClose 
          footer={[ 
            <Button key="back" onClick={() => {setIsModalVisible(false); setSelectedPlan(null); setInputUsdtAmount(null);}}>Cancel</Button>,
            <Button key="submit" type="primary" loading={stakeSubmitLoading} onClick={handleConfirmStake}
                     disabled={!calculatedArixAmount || calculatedArixAmount <= 0 || calculatedArixAmount > arixBalance || inputUsdtAmount < (parseFloat(selectedPlan?.minStakeUsd) || 0) }>
              Stake {calculatedArixAmount > 0 ? calculatedArixAmount.toFixed(ARIX_DECIMALS) : ''} ARIX
            </Button>
          ]}
        >
          {selectedPlan && ( 
            <>
              <Paragraph><Text strong style={{color: '#aaa'}}>ARIX Lock Duration: </Text><Text style={{color: 'white'}}>{selectedPlan.duration} days</Text></Paragraph>
              <Paragraph><Text strong style={{color: '#aaa'}}>USD Value Reward APR: </Text><span style={{color: '#4CAF50', fontWeight: 'bold'}}>{selectedPlan.usdRewardApr}% (Paid in ARIX)</span></Paragraph>
              <Paragraph><Text strong style={{color: '#aaa'}}>ARIX Early Unstake Penalty: </Text><span style={{color: '#F44336', fontWeight: 'bold'}}>{selectedPlan.arixEarlyUnstakePenaltyPercent}% of staked ARIX</span></Paragraph>
              <Paragraph><Text strong style={{color: '#aaa'}}>Minimum USD Stake: </Text><Text style={{color: 'white'}}>${parseFloat(selectedPlan.minStakeUsd).toFixed(2)} USD</Text></Paragraph>
              <Divider style={{borderColor: '#38383a'}}/>
              <Paragraph><Text strong style={{color: '#aaa'}}>Your ARIX Balance: </Text><Text style={{color: '#7e73ff', fontWeight: 'bold'}}>{arixBalance.toFixed(ARIX_DECIMALS)} ARIX</Text></Paragraph> 
              <div style={{ margin: '20px 0' }}>
                <Text strong style={{color: '#aaa', display: 'block', marginBottom: 8}}>USD Amount to Stake:</Text>
                <InputNumber
                  style={{ width: '100%'}} addonBefore={<Text style={{color: '#aaa'}}>$</Text>}
                  value={inputUsdtAmount} onChange={handleUsdtAmountChange}
                  placeholder={`e.g., 100 for $100 USD (Min: $${parseFloat(selectedPlan.minStakeUsd).toFixed(2)})`}
                  formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value ? value.toString().replace(/\$\s?|(,*)/g, '') : ''}
                  min={parseFloat(selectedPlan.minStakeUsd)} precision={2} step={10} 
                  className="themed-input-number"
                />
              </div>
              {currentArxPrice && inputUsdtAmount != null && inputUsdtAmount > 0 && ( 
                <Paragraph style={{
                    color: (calculatedArixAmount > arixBalance || inputUsdtAmount < (parseFloat(selectedPlan.minStakeUsd) || 0)) ? '#F44336' : '#4CAF50',
                    fontWeight: '500', marginTop: 10, padding: '8px', background: 'rgba(0,0,0,0.1)', borderRadius: '8px', fontSize: '0.9em'
                  }}
                >
                  This equals approx. {calculatedArixAmount.toFixed(ARIX_DECIMALS)} ARIX (at ~${currentArxPrice.toFixed(5)}/ARIX).
                  {calculatedArixAmount > arixBalance && " (Insufficient ARIX Balance)"}
                  {inputUsdtAmount < (parseFloat(selectedPlan.minStakeUsd) || 0) && inputUsdtAmount > 0 && ` (Minimum USD stake for this plan is $${parseFloat(selectedPlan.minStakeUsd).toFixed(2)})`}
                </Paragraph>
              )}
               {(inputUsdtAmount !== null && inputUsdtAmount <= 0 && selectedPlan) && (
                   <Paragraph style={{color: '#F44336', marginTop: 10}}>Stake amount must correspond to a value greater than $0.00 USD.</Paragraph> 
               )}
               <Alert type="info" style={{marginTop: 15}}
                  message="Note on ARIX Staking"
                  description="You are sending ARIX to the smart contract. The USD value is for reference and reward calculation. Rewards are accrued off-chain based on the USD value at the time of staking and paid in ARIX."
               />
            </>
          )}
        </Modal>
      </div>
    </Spin>
  );
};

export default EarnPage;
// File: AR_FRONTEND/src/pages/EarnPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Row, Col, Card, InputNumber, Button, Typography, Spin, message, Modal, Alert, Divider, Statistic as AntdStatistic } from 'antd';
import { useTonConnectUI, useTonAddress } from '@tonconnect/ui-react';
import { CheckCircleOutlined, RedoOutlined, InfoCircleOutlined, DollarCircleOutlined } from '@ant-design/icons';

import StakingPlans from '../components/earn/StakingPlans';
import { 
    getStakingConfig, 
    recordUserStake, 
    getUserStakes, 
    initiateUnstake, 
    confirmUnstake,
    // requestUsdtWithdrawal // Assuming you'll add this to your api.js
} from '../services/api'; 
import {
  getJettonWalletAddress,
  getJettonBalance,
  createJettonTransferMessage,
  createStakeForwardPayload,
  toArixSmallestUnits,
  fromArixSmallestUnits,
  ARIX_DECIMALS
} from '../utils/tonUtils';
import { getArxUsdtPriceFromBackend } from '../services/priceServiceFrontend';

const { Title, Text, Paragraph } = Typography;

// These will be populated from environment variables by Vite or updated from backend
const ARIX_JETTON_MASTER_ADDRESS = import.meta.env.VITE_ARIX_TOKEN_MASTER_ADDRESS;
let STAKING_CONTRACT_ADDRESS = import.meta.env.VITE_STAKING_CONTRACT_ADDRESS; 
let STAKING_CONTRACT_JETTON_WALLET_ADDRESS = import.meta.env.VITE_STAKING_CONTRACT_JETTON_WALLET_ADDRESS;

// Placeholder for getting referrer - implement your actual logic
const getReferrerAddress = () => {
    // Example: Read from localStorage or URL query param
    // const urlParams = new URLSearchParams(window.location.search);
    // return urlParams.get('ref') || localStorage.getItem('referrerAddress');
    return null; // Placeholder
};

const EarnPage = () => {
  const [stakingConfigData, setStakingConfigData] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [inputUsdtAmount, setInputUsdtAmount] = useState(null);
  const [calculatedArixAmount, setCalculatedArixAmount] = useState(0);
  
  const [currentArxPrice, setCurrentArxPrice] = useState(null);
  const [arixBalance, setArixBalance] = useState(0);
  const [totalAccruedUsdtRewards, setTotalAccruedUsdtRewards] = useState(0); // For displaying total claimable USDT

  const [loading, setLoading] = useState(true); // Start with loading true
  const [actionLoading, setActionLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [activeStakes, setActiveStakes] = useState([]);

  const userFriendlyAddress = useTonAddress();
  const rawAddress = useTonAddress(false);
  const [tonConnectUI, setTonConnectUI] = useTonConnectUI(); // Ensure setTonConnectUI is available if needed for manual control

  const fetchStakingConfig = useCallback(async () => {
    try {
      const response = await getStakingConfig();
      setStakingConfigData(response.data);
      if (response.data?.stakingContractAddress && response.data.stakingContractAddress !== "PLACEHOLDER_STAKING_CONTRACT_ADDRESS") {
        STAKING_CONTRACT_ADDRESS = response.data.stakingContractAddress;
      }
      if (response.data?.stakingContractJettonWalletAddress && response.data.stakingContractJettonWalletAddress !== "PLACEHOLDER_SC_JETTON_WALLET") {
        STAKING_CONTRACT_JETTON_WALLET_ADDRESS = response.data.stakingContractJettonWalletAddress;
      }
      if (response.data?.currentArxUsdtPrice) {
        setCurrentArxPrice(response.data.currentArxUsdtPrice);
      } else {
        console.warn("ARIX price not in config, fetching directly...");
        const price = await getArxUsdtPriceFromBackend();
        setCurrentArxPrice(price);
      }
    } catch (error) {
      message.error("Failed to fetch staking configuration.", 5);
      console.error("Fetch staking config error:", error);
    }
  }, []);

  const fetchArixBalance = useCallback(async () => {
    if (!rawAddress || !ARIX_JETTON_MASTER_ADDRESS) {
      setArixBalance(0); return;
    }
    try {
      const userArixJettonWallet = await getJettonWalletAddress(rawAddress, ARIX_JETTON_MASTER_ADDRESS);
      if (userArixJettonWallet) {
        const balanceSmallestUnits = await getJettonBalance(userArixJettonWallet);
        setArixBalance(fromArixSmallestUnits(balanceSmallestUnits));
      } else {
        setArixBalance(0);
      }
    } catch (error) {
      console.error("Failed to fetch ARIX balance:", error);
      setArixBalance(0);
    }
  }, [rawAddress]);

  const fetchUserStakesData = useCallback(async () => {
    if (!rawAddress) {
      setActiveStakes([]); 
      setTotalAccruedUsdtRewards(0);
      return;
    }
    try {
      const response = await getUserStakes(rawAddress); // This API call should fetch all stakes for the user
      const stakes = response.data || [];
      setActiveStakes(stakes);
      // Calculate total claimable USDT rewards from stakes that are eligible
      let totalUsdt = 0;
      stakes.forEach(stake => {
        // Define your condition for "claimable" USDT. Example:
        if (stake.accruedUsdtReward && stake.status !== 'pending_withdrawal') { // Or based on a specific flag
             totalUsdt += parseFloat(stake.accruedUsdtReward);
        }
      });
      setTotalAccruedUsdtRewards(totalUsdt);

    } catch (error) {
      message.error('Failed to fetch your stakes & USDT earnings.', 5);
      console.error("Fetch user stakes error:", error);
      setActiveStakes([]);
      setTotalAccruedUsdtRewards(0);
    }
  }, [rawAddress]);

   const refreshAllData = useCallback(async () => {
      if (!userFriendlyAddress) return; // Don't refresh if wallet not connected
      setLoading(true);
      try {
        await Promise.all([
            fetchStakingConfig(), // Fetches config including price
            fetchArixBalance(),
            fetchUserStakesData()
        ]);
        message.success("Data refreshed successfully!", 2);
      } catch (error) {
        message.error("Failed to refresh all data.", 3);
        console.error("Error refreshing all data:", error);
      } finally {
        setLoading(false);
      }
   }, [userFriendlyAddress, fetchStakingConfig, fetchArixBalance, fetchUserStakesData]);

  useEffect(() => { // Initial data load
    setLoading(true);
    fetchStakingConfig().finally(() => {
        if (userFriendlyAddress) { // Only fetch user data if wallet is connected
            Promise.all([fetchArixBalance(), fetchUserStakesData()]).finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    });
  }, [fetchStakingConfig, userFriendlyAddress, fetchArixBalance, fetchUserStakesData]); // Dependencies for initial load logic

 useEffect(() => { // Subsequent refreshes when rawAddress changes (wallet connection)
    if (rawAddress && stakingConfigData) { // Ensure config is loaded before fetching user-specific data
        setLoading(true);
        Promise.all([fetchArixBalance(), fetchUserStakesData()]).finally(() => setLoading(false));
    } else if (!rawAddress) {
        setArixBalance(0);
        setActiveStakes([]);
        setTotalAccruedUsdtRewards(0);
    }
  }, [rawAddress, stakingConfigData, fetchArixBalance, fetchUserStakesData]);


  useEffect(() => {
    if (inputUsdtAmount && currentArxPrice && currentArxPrice > 0) {
      const calculated = parseFloat((inputUsdtAmount / currentArxPrice).toFixed(ARIX_DECIMALS));
      setCalculatedArixAmount(calculated);
    } else {
      setCalculatedArixAmount(0);
    }
  }, [inputUsdtAmount, currentArxPrice]);

  const handlePlanSelect = (plan) => {
    if (!currentArxPrice || currentArxPrice <= 0 || !stakingConfigData) {
        message.error("ARIX price or staking configuration not available. Please try refreshing.", 3);
        refreshAllData(); 
        return;
    }
    const fullPlanDetails = stakingConfigData?.stakingPlans?.find(p => (p.key === plan.key) || (p.id === plan.id.toString()));
    if (!fullPlanDetails) {
      message.error("Could not find details for the selected plan. Try refreshing.", 3);
      refreshAllData();
      return;
    }
    setSelectedPlan(fullPlanDetails);
    setInputUsdtAmount(null); 
    setCalculatedArixAmount(0);
    setIsModalVisible(true);
  };

  const handleUsdtAmountChange = (value) => {
     const numericValue = value === null ? null : parseFloat(value);
    setInputUsdtAmount(numericValue);
  };

  const handleConfirmStake = async () => {
    if (!rawAddress || !selectedPlan || !calculatedArixAmount || calculatedArixAmount <= 0) {
      message.error('Please connect wallet, select a plan, and enter a valid ARIX amount.', 3); return;
    }
    if (!STAKING_CONTRACT_JETTON_WALLET_ADDRESS || STAKING_CONTRACT_JETTON_WALLET_ADDRESS.includes("PLACEHOLDER")) {
        message.error("Staking contract jetton wallet address is not configured. Staking ARIX is currently unavailable.", 5); return;
    }
    const minStakeArix = parseFloat(selectedPlan.minStakeArix || 0);
    if (calculatedArixAmount < minStakeArix) {
      message.error(`Minimum stake for this plan is ${minStakeArix.toFixed(ARIX_DECIMALS)} ARIX.`, 3); return;
    }
    if (calculatedArixAmount > arixBalance) {
      message.error(`Insufficient ARIX balance. You have ${arixBalance.toFixed(ARIX_DECIMALS)} ARIX.`, 3); return;
    }

    setActionLoading(true); 
    const hideLoadingMsg = message.loading('Preparing ARIX stake transaction...', 0);

    try {
      const userArixJettonWallet = await getJettonWalletAddress(rawAddress, ARIX_JETTON_MASTER_ADDRESS);
      if (!userArixJettonWallet) {
        message.error("Your ARIX wallet address could not be found. Ensure you hold ARIX tokens.", 5);
        setActionLoading(false); hideLoadingMsg(); return;
      }

      const amountInSmallestUnits = toArixSmallestUnits(calculatedArixAmount);
      
      // Parameters for the ARIX locking smart contract
      // The APR/Penalty here are for the ARIX lock itself, if the SC manages such terms.
      // If USDT rewards are purely backend, these SC params might be minimal or zero.
      const scPayloadParams = {
          queryId: BigInt(Date.now()), 
          durationSeconds: parseInt(selectedPlan.duration, 10) * 24 * 60 * 60,
          // These depend on your SC design. If SC only locks ARIX and backend handles USDT rewards,
          // these might be 0 or related to ARIX-specific lock conditions.
          aprBps: 0, // Placeholder: e.g., Math.round((selectedPlan.arixLockApr || 0) * 100)
          penaltyBps: 0, // Placeholder: e.g., Math.round((selectedPlan.arixLockPenalty || 0) * 100)
      };
      const forwardPayloadCell = createStakeForwardPayload(scPayloadParams);

      const jettonTransferBody = createJettonTransferMessage(
        amountInSmallestUnits,
        STAKING_CONTRACT_JETTON_WALLET_ADDRESS, // User sends ARIX to SC's Jetton Wallet
        rawAddress,    
        toArixSmallestUnits("0.1"), // Min forward TON for Jetton Wallet to notify main SC
        forwardPayloadCell      
      );

      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 360, // 6 minutes validity
        messages: [{
          address: userArixJettonWallet, 
          amount: toArixSmallestUnits("0.15").toString(), // Gas for user's jetton wallet + forward_ton_amount
          payload: jettonTransferBody.toBoc().toString("base64") 
        }],
      };

      hideLoadingMsg(); 
      const hideWalletMsg = message.loading('Please confirm transaction in your wallet...', 0);

      const result = await tonConnectUI.sendTransaction(transaction);
      
      hideWalletMsg(); 
      const hideBackendMsg = message.loading("Transaction sent. Recording ARIX stake with backend...", 0);
      
      const referrerAddress = getReferrerAddress(); // Get referrer if any

      await recordUserStake({
        planKey: selectedPlan.key || selectedPlan.id.toString(), 
        arixAmount: calculatedArixAmount,
        userWalletAddress: rawAddress,
        transactionBoc: result.boc, // This BOC is sent to backend for verification
        referenceUsdtValue: inputUsdtAmount,
        referrerWalletAddress: referrerAddress 
      });

      hideBackendMsg();
      message.success(`ARIX Stake for ${calculatedArixAmount.toFixed(ARIX_DECIMALS)} recorded! Awaiting on-chain confirmation.`, 5);

      setIsModalVisible(false); setSelectedPlan(null); setInputUsdtAmount(null); setCalculatedArixAmount(0);
      setTimeout(() => { refreshAllData(); }, 20000); // Longer delay for potential block confirmation

    } catch (error) {
      hideLoadingMsg(); // Ensure all loading messages are cleared
      const errorMsg = error?.response?.data?.message || error?.message || 'ARIX Staking failed.';
      if (errorMsg.toLowerCase().includes('user declined') || errorMsg.toLowerCase().includes('rejected by user')) {
        message.warn('Transaction was declined in wallet.', 3);
      } else {
        message.error(`ARIX Staking failed: ${errorMsg}`, 5);
      }
      console.error('ARIX Staking error:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnstake = async (stake) => { // For unstaking ARIX principal from the SC
    if (!rawAddress || !STAKING_CONTRACT_ADDRESS || STAKING_CONTRACT_ADDRESS.includes("PLACEHOLDER")) {
      message.error("Wallet not connected or Staking Contract not configured.", 3); return;
    }
    setActionLoading(true);
    const hideLoadingMsg = message.loading(`Preparing to unstake ARIX for stake ID: ${stake.id.substring(0,6)}...`, 0);

    try {
      const prepResponse = await initiateUnstake({ userWalletAddress: rawAddress, stakeId: stake.id });
      hideLoadingMsg();
      
      Modal.confirm({
        title: <Text style={{color: '#00adee', fontWeight: 'bold'}}>Confirm ARIX Unstake</Text>,
        className: "glass-pane", 
        content: (
          <div>
            <Paragraph>{prepResponse.data.message}</Paragraph> {/* Message from backend about ARIX penalty */}
            <Paragraph><Text strong style={{color: '#aaa'}}>ARIX Principal: </Text><Text style={{color: 'white'}}>{prepResponse.data.principalArix} ARIX</Text></Paragraph>
            {prepResponse.data.isEarly && <Paragraph style={{color: '#ff7875'}}><Text strong style={{color: '#aaa'}}>ARIX Penalty: </Text>{prepResponse.data.arixPenaltyPercentApplied}% of principal</Paragraph>}
            <Divider style={{borderColor: 'rgba(255,255,255,0.1)'}}/>
            <Paragraph style={{color: '#ccc'}}>To complete ARIX unstaking, you must send a transaction to the ARIX Staking Contract.</Paragraph>
            <Alert message="This next step involves an on-chain transaction in your wallet to call the ARIX Staking Contract." type="info" showIcon style={{marginBottom: 10}} className="glass-pane"/>
          </div>
        ),
        okText: 'Proceed to Wallet', cancelText: 'Cancel',
        onOk: async () => {
          const hideWalletMsg = message.loading('Preparing ARIX unstake transaction... Please confirm in wallet.', 0);
          try {
            // This payload needs to match the `UserUnstakeMessage` struct in your Tact contract
            // It typically includes the specific stake ID internal to the smart contract.
            // Assuming `stake.id` from DB is the same as `stake_id_to_withdraw` in SC.
            const unstakePayloadBuilder = new Builder();
            unstakePayloadBuilder.storeUint(BigInt(Date.now()), 64); // query_id for the message to SC
            unstakePayloadBuilder.storeUint(BigInt(stake.id), 64); // stake_id_to_withdraw (ensure this ID matches what SC expects)
            const unstakePayloadCell = unstakePayloadBuilder.asCell();

            const transaction = {
              validUntil: Math.floor(Date.now() / 1000) + 360, 
              messages: [{
                address: STAKING_CONTRACT_ADDRESS, // Main ARIX Staking Contract address
                amount: toArixSmallestUnits("0.05").toString(), 
                payload: unstakePayloadCell.toBoc().toString("base64") 
              }],
            };
            const result = await tonConnectUI.sendTransaction(transaction);
            hideWalletMsg();
            const hideBackendMsg = message.loading("ARIX unstake transaction sent. Confirming with backend...", 0);

            await confirmUnstake({ // Backend confirms/records this attempt
              userWalletAddress: rawAddress,
              stakeId: stake.id,
              unstakeTransactionBoc: result.boc,
            });
            hideBackendMsg();
            message.success("ARIX unstake request processed by backend! ARIX balance will update after on-chain settlement and verification.", 6);
            setTimeout(() => { refreshAllData(); }, 20000);
          } catch (txError) {
            hideWalletMsg();
            const errorMsg = txError?.response?.data?.message || txError?.message || 'ARIX unstake transaction failed.';
            if (errorMsg.toLowerCase().includes('user declined')) { message.warn('ARIX unstake transaction declined in wallet.', 3); } 
            else { message.error(`ARIX unstake failed: ${errorMsg}`, 5); }
            console.error("On-chain ARIX Unstake Tx Error:", txError);
          } finally { setActionLoading(false); }
        },
        onCancel: () => { setActionLoading(false); hideLoadingMsg(); },
      });
    } catch (error) {
      hideLoadingMsg();
      message.error(error?.response?.data?.message || 'ARIX unstake initiation error.', 5);
      console.error("Initiate ARIX Unstake Error:", error);
      setActionLoading(false);
    }
  };

  const handleWithdrawUsdtRewards = async () => {
    // This function would allow users to withdraw their accrued and "claimable" USDT rewards.
    // It needs a backend endpoint to handle the request, check balance, and initiate USDT transfer.
    setActionLoading(true);
    const hideLoadingMsg = message.loading("Preparing USDT reward withdrawal...", 0);
    try {
        // const amountToWithdraw = totalAccruedUsdtRewards; // Or allow partial withdrawal via an input
        // if (amountToWithdraw < 3) { // Example: min withdrawal check from client image
        //     message.warn("Minimum USDT withdrawal is $3.", 3);
        //     hideLoadingMsg(); setActionLoading(false); return;
        // }
        // const response = await requestUsdtWithdrawal({ userWalletAddress: rawAddress, amount: amountToWithdraw });
        // message.success(response.data.message || "USDT withdrawal request submitted!", 5);
        // refreshAllData(); // To update displayed balances
        message.info("USDT Withdrawal functionality is under development.", 3); // Placeholder
        hideLoadingMsg();
    } catch (error) {
        hideLoadingMsg();
        message.error(error?.response?.data?.message || "USDT withdrawal failed.", 5);
        console.error("USDT Withdrawal Error:", error);
    } finally {
        setActionLoading(false);
    }
  };


  if (!userFriendlyAddress) {
    return (
      <div style={{ textAlign: 'center', marginTop: '50px', padding: 20 }} className="glass-pane">
        <Title level={3} style={{color: 'white'}}>Connect Your TON Wallet</Title>
        <Paragraph style={{color: '#ccc', marginBottom: 20}}>To access staking features and manage your ARIX & USDT earnings, please connect your TON wallet.</Paragraph>
        <Button type="primary" size="large" onClick={() => tonConnectUI?.openModal()}>Connect Wallet</Button>
      </div>
    );
  }

  if (loading && !stakingConfigData) { // Initial loading state
       return (
            <div style={{ textAlign: 'center', marginTop: '50px', padding: 20 }}>
                 <Spin spinning={true} tip="Loading ARIX Staking Hub..." size="large" />
                 <Paragraph style={{color: '#ccc', marginTop: 20}}>Fetching staking plans, your balances, and active stakes...</Paragraph>
            </div>
       );
  }

  return (
    <Spin spinning={loading && stakingConfigData != null} tip="Refreshing data..." size="large"> 
      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        <Row justify="center" style={{ marginBottom: 20 }} gutter={[16,16]}>
          <Col xs={24} md={14}>
            <div style={{padding: '15px 20px', height: '100%'}} className="glass-pane"> 
              <Title level={3} style={{ color: 'white', fontWeight: 'bold', marginBottom: 8, textAlign: 'center' }}>Stake ARIX, Earn USDT</Title>
              <Paragraph style={{textAlign: 'center', marginBottom: 4}}>
                <Text style={{ color: '#aaa' }}>Wallet: </Text>
                <Text copyable={{ text: userFriendlyAddress }} style={{color: '#00adee'}}>{`${userFriendlyAddress?.slice(0,6)}...${userFriendlyAddress?.slice(-4)}`}</Text> 
              </Paragraph>
              <Paragraph style={{textAlign: 'center', marginBottom: 4}}>
                <Text style={{ color: '#aaa' }}>ARIX Balance: </Text>
                <Text strong style={{color: '#00adee'}}>{arixBalance.toFixed(ARIX_DECIMALS)} ARIX</Text>
              </Paragraph>
              {currentArxPrice && (
              <Paragraph style={{textAlign: 'center', fontSize: '0.9em', marginBottom: 15}}>
                <Text style={{ color: '#aaa' }}>ARIX Price: ~${currentArxPrice.toFixed(5)} / ARIX</Text>
              </Paragraph>
              )}
              <div style={{textAlign: 'center'}}>
                <Button icon={<RedoOutlined/>} onClick={refreshAllData} loading={loading} size="small">Refresh Data</Button> 
              </div>
            </div>
          </Col>
          <Col xs={24} md={10}>
             <div style={{padding: '15px 20px', height: '100%'}} className="glass-pane">
                <Title level={4} style={{ color: 'white', fontWeight: 'bold', marginBottom: 8, textAlign: 'center' }}>Your USDT Rewards</Title>
                <AntdStatistic 
                    title={<Text style={{color: '#aaa'}}>Total Claimable USDT (Est.)</Text>} 
                    value={totalAccruedUsdtRewards.toFixed(2)} // Assuming 2 decimals for USDT display
                    valueStyle={{color: '#52c41a', fontWeight: 'bold', fontSize: '1.8em', textAlign: 'center'}} 
                    suffix="USDT" 
                />
                <Paragraph style={{color: '#888', fontSize: '0.8em', textAlign: 'center', marginTop: 5}}>
                    Rewards are calculated by the backend based on your active ARIX stakes.
                </Paragraph>
                <div style={{textAlign: 'center', marginTop: 15}}>
                    <Button 
                        type="primary" 
                        icon={<DollarCircleOutlined />} 
                        onClick={handleWithdrawUsdtRewards} 
                        disabled={totalAccruedUsdtRewards < 3 || actionLoading} // Min $3 withdrawal
                        loading={actionLoading}
                    >
                        Withdraw USDT Rewards
                    </Button>
                </div>
             </div>
          </Col>
        </Row>

        <StakingPlans
          plans={stakingConfigData?.stakingPlans || []}
          onSelectPlan={handlePlanSelect}
          currentArxPrice={currentArxPrice}
        />

        {activeStakes.length > 0 && (
          <div style={{ marginTop: '40px' }}>
            <Title level={3} style={{ color: 'white', textAlign: 'center', marginBottom: '20px', fontWeight: 'bold'}}>
              Your Stakes & Earnings Overview
            </Title>
            <Row gutter={[16, 16]} justify="center"> 
              {activeStakes.map(stake => (
                <Col xs={24} sm={12} md={8} key={stake.id}> 
                  <Card
                    className="neumorphic-glass-card"
                    title={<Text style={{color: '#00adee', fontWeight: 'bold'}}>{stake.planTitle} (ARIX Stake)</Text>}
                    style={{height: '100%'}} 
                  >
                     <AntdStatistic title={<Text style={{color: '#aaa'}}>ARIX Staked</Text>} value={stake.arixAmountStaked} suffix="ARIX" valueStyle={{color: 'white'}} />
                     <AntdStatistic title={<Text style={{color: '#aaa'}}>Value at Stake Time</Text>} value={`$${stake.referenceUsdtValueAtStakeTime || '0.00'}`} valueStyle={{color: '#ccc', fontSize: '0.9em'}}/>
                     <AntdStatistic title={<Text style={{color: '#aaa'}}>USDT Reward APR</Text>} value={`${stake.usdtApr || '0.00'}%`} valueStyle={{color: '#52c41a'}}/>
                     <AntdStatistic title={<Text style={{color: '#aaa'}}>Accrued USDT (Est.)</Text>} value={`${stake.accruedUsdtReward || '0.00'}`} suffix="USDT" valueStyle={{color: 'white', fontWeight: 'bold'}}/>
                     <AntdStatistic title={<Text style={{color: '#aaa'}}>ARIX Early Penalty</Text>} value={`${stake.arixEarlyUnstakePenaltyPercent || '0'}%`} valueStyle={{color: '#ff7875'}}/>
                     <AntdStatistic title={<Text style={{color: '#aaa'}}>Days Left (ARIX Lock)</Text>} value={stake.remainingDays} valueStyle={{color: 'white'}}/>
                     <AntdStatistic title={<Text style={{color: '#aaa'}}>ARIX Lock Status</Text>} value={stake.status} valueStyle={{color: stake.status === 'active' ? '#52c41a' : (stake.status && stake.status.includes('pending') ? '#faad14' : '#ccc')}}/> 
                    <div style={{marginTop: '20px', display: 'flex', justifyContent: 'center'}}>
                        {(stake.status === 'active') && ( // Only allow unstake for 'active' ARIX stakes
                           <Button type="primary" onClick={() => handleUnstake(stake)} loading={actionLoading && selectedPlan?.id === stake.id} danger={new Date() < new Date(stake.unlockTimestamp)}>
                               {new Date() < new Date(stake.unlockTimestamp) ? `Unstake ARIX Early` : `Unstake ARIX`}
                           </Button>
                        )}
                         {(stake.status !== 'active') && <Button type="default" disabled>{stake.status.replace('_', ' ').toUpperCase()}</Button>}
                    </div>
                     <Text style={{fontSize: '12px', color: '#888', display: 'block', marginTop: '10px', textAlign: 'center'}}>
                        {stake.status === 'active' && new Date() < new Date(stake.unlockTimestamp) ? `Unstaking ARIX early incurs a ${stake.arixEarlyUnstakePenaltyPercent}% penalty on ARIX principal.` : `ARIX lock status: ${stake.status}. USDT rewards are handled separately.`}
                    </Text>
                  </Card>
                </Col>
              ))}
            </Row>
          </div>
        )}
         {activeStakes.length === 0 && !loading && stakingConfigData && (
             <div style={{textAlign: 'center', color: '#aaa', marginTop: 40, padding: 20}} className="glass-pane">You have no active ARIX stakes yet. Choose a plan above to start earning USDT rewards!</div>
         )}

        <Modal
          title={<Text style={{color: '#00adee', fontWeight: 'bold'}}>{`Stake ARIX in "${selectedPlan?.title || ''}"`}</Text>}
          open={isModalVisible}
          onOk={handleConfirmStake}
          onCancel={() => {setIsModalVisible(false); setSelectedPlan(null); setInputUsdtAmount(null);}}
          confirmLoading={actionLoading}
          okText="Confirm & Stake ARIX"
          cancelText="Cancel"
          className="glass-pane" 
          destroyOnClose 
          footer={[
            <Button key="back" onClick={() => {setIsModalVisible(false); setSelectedPlan(null); setInputUsdtAmount(null);}} className="neumorphic-button">
              Cancel
            </Button>,
            <Button key="submit" type="primary" loading={actionLoading} onClick={handleConfirmStake}
                     disabled={!calculatedArixAmount || calculatedArixAmount <= 0 || calculatedArixAmount > arixBalance || calculatedArixAmount < (parseFloat(selectedPlan?.minStakeArix) || 0) }>
              Stake {calculatedArixAmount > 0 ? calculatedArixAmount.toFixed(ARIX_DECIMALS) : ''} ARIX
            </Button>,
          ]}
        >
          {selectedPlan && (
            <>
              <Paragraph><Text strong style={{color: '#aaa'}}>ARIX Lock Duration: </Text><Text style={{color: 'white'}}>{selectedPlan.duration} days</Text></Paragraph>
              <Paragraph><Text strong style={{color: '#aaa'}}>USDT Reward APR: </Text><span style={{color: '#52c41a', fontWeight: 'bold'}}>{selectedPlan.apr}% USDT</span></Paragraph>
              <Paragraph><Text strong style={{color: '#aaa'}}>ARIX Early Unstake Penalty: </Text><span style={{color: '#ff7875', fontWeight: 'bold'}}>{selectedPlan.earlyUnstakePenaltyPercent}% of staked ARIX</span></Paragraph>
              <Paragraph><Text strong style={{color: '#aaa'}}>Minimum ARIX Stake: </Text><Text style={{color: 'white'}}>{parseFloat(selectedPlan.minStakeArix).toFixed(ARIX_DECIMALS)} ARIX</Text></Paragraph>
              <Divider style={{borderColor: 'rgba(255,255,255,0.1)'}}/>
              <Paragraph><Text strong style={{color: '#aaa'}}>Your ARIX Balance: </Text><Text style={{color: '#00adee', fontWeight: 'bold'}}>{arixBalance.toFixed(ARIX_DECIMALS)} ARIX</Text></Paragraph> 
              <div style={{ margin: '20px 0' }}>
                <Text strong style={{color: '#aaa', display: 'block', marginBottom: 8}}>Amount to Stake (Approx. USDT Value you want to correspond to ARIX):</Text>
                <InputNumber
                  style={{ width: '100%'}} 
                  addonBefore={<Text style={{color: '#aaa'}}>$</Text>}
                  value={inputUsdtAmount}
                  onChange={handleUsdtAmountChange}
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
               {(inputUsdtAmount !== null && inputUsdtAmount <= 0 && selectedPlan) && ( // Only show if plan is selected
                   <Paragraph style={{color: '#ff7875', marginTop: 10}}>Stake amount must be greater than 0.</Paragraph>
               )}
            </>
          )}
        </Modal>
      </div>
    </Spin>
  );
};

export default EarnPage;
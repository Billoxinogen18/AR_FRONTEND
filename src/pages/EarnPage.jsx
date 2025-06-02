// File: AR_Proj/AR_FRONTEND/src/pages/EarnPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Row, Col, Card, InputNumber, Button, Typography, Spin, message, Modal, Alert, Divider } from 'antd';
import { useTonConnectUI, useTonWallet, useTonAddress } from '@tonconnect/ui-react';
import { CheckCircleOutlined } from '@ant-design/icons'; // Added icon

import StakingPlans from '../components/earn/StakingPlans';
// Correctly importing recordUserStake:
import { getStakingConfig, recordUserStake, getUserStakes, initiateUnstake, confirmUnstake } from '../services/api'; // Updated import name
import {
  getJettonWalletAddress,
  getJettonBalance,
  createJettonTransferMessage,
  toArixSmallestUnits,
  fromArixSmallestUnits,
  ARIX_DECIMALS
} from '../utils/tonUtils';
import { getArxUsdtPriceFromBackend } from '../services/priceServiceFrontend.js'; // For fallback

const { Title, Text, Paragraph } = Typography;

// These will be populated from environment variables by Vite
const ARIX_JETTON_MASTER_ADDRESS = import.meta.env.VITE_ARIX_TOKEN_MASTER_ADDRESS;
let STAKING_CONTRACT_ADDRESS = import.meta.env.VITE_STAKING_CONTRACT_ADDRESS; // Can be updated by config

const EarnPage = () => {
  const [stakingConfigData, setStakingConfigData] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [inputUsdtAmount, setInputUsdtAmount] = useState(null);
  const [calculatedArixAmount, setCalculatedArixAmount] = useState(0);
  const [currentArxPrice, setCurrentArxPrice] = useState(null);
  const [arixBalance, setArixBalance] = useState(0);
  const [loading, setLoading] = useState(false); // General loading for initial data
  const [actionLoading, setActionLoading] = useState(false); // For stake/unstake actions
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [activeStakes, setActiveStakes] = useState([]);

  const wallet = useTonWallet(); // Raw wallet object, if needed
  const userFriendlyAddress = useTonAddress(); // User-friendly address
  const rawAddress = useTonAddress(false); // Raw address
  const [tonConnectUI] = useTonConnectUI();

  // --- Data Fetching Functions ---

   const fetchStakingConfig = useCallback(async () => {
      console.log("Fetching staking config...");
      try {
        const response = await getStakingConfig();
        setStakingConfigData(response.data);
        console.log("Staking config:", response.data);

        // Update staking contract address from backend config if provided
        if (response.data?.stakingContractAddress && response.data.stakingContractAddress !== "PLACEHOLDER_STAKING_CONTRACT_ADDRESS") {
          STAKING_CONTRACT_ADDRESS = response.data.stakingContractAddress;
           console.log("Updated STAKING_CONTRACT_ADDRESS from backend config:", STAKING_CONTRACT_ADDRESS);
        } else {
           console.warn("Staking contract address from backend is placeholder or missing. Using VITE_STAKING_CONTRACT_ADDRESS:", STAKING_CONTRACT_ADDRESS);
        }

        // Use price from backend config first, fallback to direct fetch if needed
        if (response.data?.currentArxUsdtPrice) {
          setCurrentArxPrice(response.data.currentArxUsdtPrice);
           console.log("ARIX Price from backend config:", response.data.currentArxUsdtPrice);
        } else {
          console.warn("ARIX price not in config, fetching directly from backend price endpoint...");
          const price = await getArxUsdtPriceFromBackend(); // Fallback
          setCurrentArxPrice(price);
           console.log("ARIX Price fetched directly:", price);
        }

      } catch (error) {
        message.error("Failed to fetch staking configuration from backend.", 5);
        console.error("Fetch staking config error:", error);
      }
    }, []);


  const fetchArixBalance = useCallback(async () => {
    if (!rawAddress || !ARIX_JETTON_MASTER_ADDRESS) {
      setArixBalance(0);
      return;
    }
    console.log("Fetching ARIX balance for", rawAddress);
    try {
      const userArixJettonWallet = await getJettonWalletAddress(rawAddress, ARIX_JETTON_MASTER_ADDRESS);
      if (userArixJettonWallet) {
        const balanceSmallestUnits = await getJettonBalance(userArixJettonWallet);
        setArixBalance(fromArixSmallestUnits(balanceSmallestUnits));
        console.log("ARIX balance fetched:", fromArixSmallestUnits(balanceSmallestUnits));
      } else {
        setArixBalance(0);
        console.info("User ARIX jetton wallet not found. Balance set to 0.");
      }
    } catch (error) {
      console.error("Failed to fetch ARIX balance:", error);
      setArixBalance(0);
      // message.error("Failed to fetch ARIX balance."); // Too frequent?
    }
  }, [rawAddress]);

  const fetchUserActiveStakesData = useCallback(async () => {
    if (!rawAddress) {
      setActiveStakes([]);
      return;
    }
    console.log("Fetching active stakes for", rawAddress);
    try {
      const response = await getUserStakes(rawAddress);
      setActiveStakes(response.data || []);
      console.log("Active stakes fetched:", response.data);
    } catch (error) {
      message.error('Failed to fetch your active stakes from backend.', 5);
      console.error("Fetch active stakes error:", error);
      setActiveStakes([]);
    }
  }, [rawAddress]);

   const refreshAllData = useCallback(async () => {
      if (!rawAddress) return;
      setLoading(true);
      console.log("Refreshing all data for", rawAddress);
      // Fetch config first as it might contain price and contract address
      await fetchStakingConfig();
      // Balance and stakes depend on rawAddress and potentially price/contract address from config,
      // so they will be triggered by the useEffects below once dependencies update.
      // Manually trigger them here as well for immediate refresh UX
      await fetchArixBalance();
      await fetchUserActiveStakesData();
      setLoading(false);
      message.success("Data refreshed.", 2);
   }, [rawAddress, fetchStakingConfig, fetchArixBalance, fetchUserActiveStakesData]);


  // --- Effects ---

  // Initial fetch of config
  useEffect(() => {
    if (!ARIX_JETTON_MASTER_ADDRESS) {
        message.error("ARIX Token Master Address is not configured in the frontend. Staking features may be affected.", 5);
        console.error("VITE_ARIX_TOKEN_MASTER_ADDRESS is missing.");
    }
     fetchStakingConfig();
  }, [fetchStakingConfig]);

  // Fetch balance and stakes when wallet is connected AND price/config is available
  useEffect(() => {
    // Check for rawAddress and ensure config data (including price) is loaded before fetching balance/stakes
    if (rawAddress && stakingConfigData !== null) {
      fetchArixBalance();
      fetchUserActiveStakesData();
    } else if (!rawAddress) {
      setArixBalance(0);
      setActiveStakes([]);
    }
  }, [rawAddress, stakingConfigData, fetchArixBalance, fetchUserActiveStakesData]); // Depend on stakingConfigData

  // Calculate ARIX amount when USDT input or price changes
  useEffect(() => {
    if (inputUsdtAmount && currentArxPrice && currentArxPrice > 0) {
      // Calculate ARIX amount based on USDT value and price
      const calculated = parseFloat((inputUsdtAmount / currentArxPrice).toFixed(ARIX_DECIMALS));
      setCalculatedArixAmount(calculated);
    } else {
      setCalculatedArixAmount(0);
    }
  }, [inputUsdtAmount, currentArxPrice]);


  // --- Handlers ---

  const handlePlanSelect = (plan) => {
    if (!currentArxPrice || currentArxPrice <= 0 || !stakingConfigData) {
        message.error("ARIX price or staking configuration not available. Please try refreshing.", 3);
        refreshAllData(); // Attempt to re-fetch everything
        return;
    }
    // Find the full plan details from the fetched config
    const fullPlanDetails = stakingConfigData?.stakingPlans?.find(p => (p.key === plan.key) || (p.id === plan.id));
    if (!fullPlanDetails) {
      message.error("Could not find details for the selected plan. Try refreshing.", 3);
      refreshAllData();
      return;
    }
    setSelectedPlan(fullPlanDetails);
    setInputUsdtAmount(null); // Reset input when new plan is selected
    setCalculatedArixAmount(0);
    setIsModalVisible(true);
  };

  const handleUsdtAmountChange = (value) => {
     // Ensure value is a number or null
     const numericValue = value === null ? null : parseFloat(value);
    setInputUsdtAmount(numericValue);
  };

  const handleConfirmStake = async () => {
    if (!rawAddress || !selectedPlan || !calculatedArixAmount || calculatedArixAmount <= 0) {
      message.error('Please connect wallet, select a plan, and enter a valid ARIX amount.', 3);
      return;
    }
    const minStakeArix = parseFloat(selectedPlan.minStakeArix || 0);
    if (calculatedArixAmount < minStakeArix) {
      message.error(`Minimum stake for this plan is ${minStakeArix.toFixed(ARIX_DECIMALS)} ARIX.`, 3);
      return;
    }
    if (calculatedArixAmount > arixBalance) {
      message.error(`Insufficient ARIX balance. You have ${arixBalance.toFixed(ARIX_DECIMALS)} ARIX.`, 3);
      return;
    }
     if (!STAKING_CONTRACT_ADDRESS || STAKING_CONTRACT_ADDRESS === "PLACEHOLDER_STAKING_CONTRACT_ADDRESS" || STAKING_CONTRACT_ADDRESS === "NOT_YET_DEPLOYED_STAKING_CONTRACT_ADDRESS") {
        message.error("Staking contract address is not configured. Staking is currently unavailable. Please contact support.", 5);
        return;
     }


    setActionLoading(true);
    message.loading('Preparing stake transaction...', 0); // Indefinite loading

    try {
      // Step 1: Get the user's specific ARIX Jetton Wallet Address
      const userArixJettonWalletAddress = await getJettonWalletAddress(rawAddress, ARIX_JETTON_MASTER_ADDRESS);
      if (!userArixJettonWalletAddress) {
        message.destroy();
        message.error("Your ARIX wallet address could not be found. Ensure you hold ARIX tokens and have performed at least one inbound transfer.", 5);
        setActionLoading(false);
        return;
      }

      // Step 2: Create the Jetton Transfer message
      const amountInSmallestUnits = toArixSmallestUnits(calculatedArixAmount);
      const forwardTonAmount = toArixSmallestUnits(0.05); 
      let forwardPayload = null; // Replace with actual smart contract payload logic if needed

      const jettonTransferBody = createJettonTransferMessage(
        amountInSmallestUnits,
        STAKING_CONTRACT_ADDRESS, 
        rawAddress,    
        forwardTonAmount,  
        forwardPayload      
      );

      // Step 3: Prepare the transaction object for TonConnect UI
      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 360, // 6 minutes validity
        messages: [{
          address: userArixJettonWalletAddress, 
          amount: toArixSmallestUnits(0.1).toString(), 
          payload: jettonTransferBody.toBoc().toString("base64") 
        }],
      };

      message.destroy(); 
      message.loading('Please confirm transaction in your wallet...', 0);

      // Step 4: Send the transaction via TonConnect UI
      const result = await tonConnectUI.sendTransaction(transaction);

      message.destroy(); 
      message.loading("Transaction sent. Recording stake with backend...", 0);
      
      // Using recordUserStake which should be correctly imported
      await recordUserStake({
        planKey: selectedPlan.key || selectedPlan.id.toString(), 
        arixAmount: calculatedArixAmount,
        userWalletAddress: rawAddress,
        transactionBoc: result.boc, 
        referenceUsdtValue: inputUsdtAmount 
      });

      message.destroy();
      message.success(`Stake for ${calculatedArixAmount.toFixed(ARIX_DECIMALS)} ARIX recorded! It will reflect after on-chain confirmation.`, 5);

      // Step 6: Close modal and reset state
      setIsModalVisible(false);
      setSelectedPlan(null);
      setInputUsdtAmount(null);
      setCalculatedArixAmount(0);

      // Step 7: Refresh data after a delay
      setTimeout(() => { refreshAllData(); }, 15000); 

    } catch (error) {
      message.destroy();
      const errorMsg = error.response?.data?.message || error.message || 'Staking failed. Please try again.';
      if (errorMsg.toLowerCase().includes('user declined transaction')) {
        message.warn('Transaction was declined in wallet.', 3);
      } else {
        message.error(`Staking failed: ${errorMsg}`, 5);
      }
      console.error('Staking error:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnstake = async (stake) => {
    if (!rawAddress) {
      message.error("Please connect your wallet.", 3);
      return;
    }
     if (!STAKING_CONTRACT_ADDRESS || STAKING_CONTRACT_ADDRESS === "PLACEHOLDER_STAKING_CONTRACT_ADDRESS" || STAKING_CONTRACT_ADDRESS === "NOT_YET_DEPLOYED_STAKING_CONTRACT_ADDRESS") {
        message.error("Staking contract address is not configured. Unstaking is currently unavailable. Please contact support.", 5);
        return;
     }


    setActionLoading(true);
    message.loading(`Preparing unstake for stake ID: ${stake.id.substring(0,6)}...`, 0);

    try {
      // Step 1: Initiate unstake request to backend
      const prepResponse = await initiateUnstake({ userWalletAddress: rawAddress, stakeId: stake.id });
      message.destroy();

      // Step 2: Show confirmation modal
      Modal.confirm({
        title: <Text style={{color: '#00adee', fontWeight: 'bold'}}>Confirm Unstake</Text>,
        className: "glass-pane", 
        content: (
          <div>
            <Paragraph>{prepResponse.data.message}</Paragraph>
            <Paragraph><Text strong style={{color: '#aaa'}}>Principal ARIX: </Text><Text style={{color: 'white'}}>{parseFloat(prepResponse.data.principalArix).toFixed(ARIX_DECIMALS)} ARIX</Text></Paragraph>
            {prepResponse.data.isEarly && <Paragraph style={{color: '#ff7875'}}><Text strong style={{color: '#aaa'}}>Penalty: </Text>{prepResponse.data.penaltyPercent}% of principal</Paragraph>}
            <Paragraph><Text strong style={{color: '#aaa'}}>Estimated Reward (if full term): </Text><Text style={{color: 'white'}}>{parseFloat(prepResponse.data.estimatedRewardArix).toFixed(ARIX_DECIMALS)} ARIX</Text></Paragraph>
            <Divider style={{borderColor: 'rgba(255,255,255,0.1)'}}/>
            <Paragraph style={{color: '#ccc'}}>To complete unstaking, you must send a transaction to the staking contract.</Paragraph>
            <Alert message="This next step involves an on-chain transaction in your wallet." type="info" showIcon style={{marginBottom: 10}} className="glass-pane"/>
          </div>
        ),
        okText: 'Proceed to Wallet',
        cancelText: 'Cancel',
        onOk: async () => {
          message.loading('Preparing unstake transaction... Please confirm in your wallet.', 0);

          // Placeholder for smart contract unstake payload. REPLACE WITH YOUR ACTUAL PAYLOAD.
          const unstakePayload = new Cell();
          unstakePayload.bits.writeUint(0xAAAAAAAA, 32); // Example: YOUR_UNSTAKE_OP_CODE
          unstakePayload.bits.writeUint(0, 64); // query_id

          const transaction = {
            validUntil: Math.floor(Date.now() / 1000) + 360, 
            messages: [{
              address: STAKING_CONTRACT_ADDRESS, 
              amount: toArixSmallestUnits(0.05).toString(), 
              payload: unstakePayload.toBoc().toString("base64") 
            }],
          };

          try {
            // Step 3: Send the unstake transaction
            const result = await tonConnectUI.sendTransaction(transaction);

            message.destroy();
            message.loading("Unstake transaction sent. Confirming with backend...", 0);

            // Step 4: Confirm unstake with backend
            await confirmUnstake({
              userWalletAddress: rawAddress,
              stakeId: stake.id,
              unstakeTransactionBoc: result.boc,
            });

            message.destroy();
            message.success("Unstake request processed! Your stake status and balance will update after on-chain settlement.", 5);

            // Step 5: Refresh data
            setTimeout(() => { refreshAllData(); }, 15000);

          } catch (txError) {
            message.destroy();
            const errorMsg = txError.response?.data?.message || txError.message || 'Unstake transaction failed.';
            if (errorMsg.toLowerCase().includes('user declined')) {
                   message.warn('Unstake transaction was declined in wallet.', 3);
            } else {
                message.error(`Unstake failed: ${errorMsg}`, 5);
            }
            console.error("On-chain Unstake Tx Error:", txError);
          } finally {
            setActionLoading(false);
          }
        },
        onCancel: () => {
          setActionLoading(false); 
          message.destroy(); 
        },
      });
    } catch (error) {
      message.destroy();
      const errorMsg = error.response?.data?.message || error.message || 'Unstake initiation error.';
      message.error(errorMsg, 5);
      console.error("Initiate Unstake Error:", error);
      setActionLoading(false);
    }
  };


  // --- Render ---

  if (!userFriendlyAddress) {
    return (
      <div style={{ textAlign: 'center', marginTop: '50px', padding: 20 }} className="glass-pane">
        <Title level={3} style={{color: 'white'}}>Connect Your TON Wallet</Title>
        <Paragraph style={{color: '#ccc', marginBottom: 20}}>To access staking features, please connect your TON wallet using the button in the header.</Paragraph>
        <Button type="primary" size="large" onClick={() => tonConnectUI?.openModal()}>Connect Wallet</Button>
      </div>
    );
  }

  if (loading && activeStakes.length === 0 && !stakingConfigData) {
       return (
            <div style={{ textAlign: 'center', marginTop: '50px', padding: 20 }}>
                 <Spin spinning={true} tip="Loading ARIX Data..." size="large" />
                 <Paragraph style={{color: '#ccc', marginTop: 20}}>Fetching staking plans, balance, and active stakes...</Paragraph>
            </div>
       );
  }


  return (
    <Spin spinning={loading && activeStakes.length > 0} tip="Refreshing data..." size="large"> 
      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        <Row gutter={[16, 24]} justify="center" style={{ marginBottom: 30 }}>
          <Col span={24}> 
            <div style={{padding: '20px'}} className="glass-pane"> 
              <Title level={2} style={{ color: 'white', fontWeight: 'bold', marginBottom: 8 }}>Stake ARIX, Earn ARIX</Title>
              <Text style={{ color: '#aaa', fontSize: '1.1em' }}>
              Your Wallet: <Text copyable={{ text: userFriendlyAddress }} style={{color: '#00adee'}}>{userFriendlyAddress.slice(0,6)}...{userFriendlyAddress.slice(-4)}</Text> 
              </Text>
              <br/>
              <Text style={{ color: '#aaa', fontSize: '1.1em' }}>
              ARIX Balance: <span style={{color: '#00adee', fontWeight: 'bold'}}>{arixBalance.toFixed(ARIX_DECIMALS)} ARIX</span>
              </Text>
              {currentArxPrice && (
              <Text style={{ color: '#aaa', display: 'block', fontSize: '0.9em' }}>
                Current ARIX Price: ~$${currentArxPrice.toFixed(5)} / ARIX
              </Text>
              )}
              <Button onClick={refreshAllData} style={{marginTop: 15}} size="small">Refresh Data</Button> 
            </div>
          </Col>
        </Row>

        <StakingPlans
          plans={stakingConfigData?.stakingPlans || []}
          onSelectPlan={handlePlanSelect}
          currentArxPrice={currentArxPrice}
        />

        {activeStakes.length > 0 && (
          <div style={{ marginTop: '50px' }}>
            <Title level={3} style={{ color: 'white', textAlign: 'center', marginBottom: '30px', fontWeight: 'bold'}}>
              Your Active Stakes
            </Title>
            <Row gutter={[24, 24]} justify="center"> 
              {activeStakes.map(stake => (
                <Col xs={24} sm={18} md={12} lg={8} key={stake.id}> 
                  <Card
                    className="neumorphic-glass-card"
                    title={<Text style={{color: '#00adee', fontWeight: 'bold'}}>{stake.planTitle}</Text>}
                  >
                     <Statistic title={<Text style={{color: '#aaa'}}>ARIX Staked</Text>} value={parseFloat(stake.arixAmountStaked).toFixed(ARIX_DECIMALS)} suffix=" ARIX" valueStyle={{color: 'white'}} />
                     <Statistic title={<Text style={{color: '#aaa'}}>Ref. Value (Stake Time)</Text>} value={`$${parseFloat(stake.referenceUsdtValueAtStakeTime || 0).toFixed(2)}`} valueStyle={{color: '#ccc', fontSize: '0.9em'}}/>
                     <Statistic title={<Text style={{color: '#aaa'}}>Current Value (Est.)</Text>} value={stake.currentUsdtValueRef !== 'N/A' ? `$${stake.currentUsdtValueRef}` : 'N/A'} valueStyle={{color: '#ccc', fontSize: '0.9em'}}/>
                     <Statistic title={<Text style={{color: '#aaa'}}>Fixed APR</Text>} value={`${stake.apr}% ARIX`} valueStyle={{color: '#52c41a'}}/>
                     <Statistic title={<Text style={{color: '#aaa'}}>Accrued Reward</Text>} value={`${parseFloat(stake.accruedArixReward || 0).toFixed(ARIX_DECIMALS)} ARIX`} valueStyle={{color: 'white'}}/>
                     <Statistic title={<Text style={{color: '#aaa'}}>Early Penalty</Text>} value={`${stake.earlyUnstakePenaltyPercent}%`} valueStyle={{color: '#ff7875'}}/>
                     <Statistic title={<Text style={{color: '#aaa'}}>Days Remaining</Text>} value={stake.remainingDays} valueStyle={{color: 'white'}}/>
                     <Statistic title={<Text style={{color: '#aaa'}}>Status</Text>} value={stake.status} valueStyle={{color: stake.status === 'active' ? '#52c41a' : (stake.status === 'pending_verification' ? '#faad14' : (stake.status === 'completed' ? '#ccc' : '#ff4d4f'))}}/> 


                    <div style={{marginTop: '20px', display: 'flex', justifyContent: 'center'}}>
                        {stake.status === 'active' && (
                           <Button
                               type="primary"
                               onClick={() => handleUnstake(stake)}
                               disabled={actionLoading}
                               danger={stake.remainingDays <= 0} 
                               loading={actionLoading && selectedPlan?.id === stake.id} 
                           >
                               {stake.remainingDays > 0 ? `Unstake Early` : `Unstake ARIX`}
                           </Button>
                        )}
                        {stake.status === 'pending_verification' && (
                             <Button type="default" disabled>Pending Verification</Button>
                        )}
                         {stake.status === 'pending_unstake' && (
                             <Button type="default" disabled>Unstaking...</Button> 
                        )}
                         {stake.status === 'completed' && (
                             <Button type="default" disabled>Completed</Button>
                        )}
                         {stake.status === 'early_unstaked' && (
                             <Button type="default" disabled>Early Unstaked</Button>
                        )}
                         {stake.status === 'failed' && (
                             <Button type="default" danger disabled>Failed</Button>
                        )}
                    </div>
                     <Text style={{fontSize: '12px', color: '#888', display: 'block', marginTop: '10px', textAlign: 'center'}}>
                        {stake.status === 'active' && stake.remainingDays > 0 ? `Unstaking early incurs a ${stake.earlyUnstakePenaltyPercent}% penalty on principal and forfeits accrued rewards.` : (stake.status === 'active' ? `Ready to unstake.` : `Status: ${stake.status}`)}
                    </Text>
                  </Card>
                </Col>
              ))}
            </Row>
             {activeStakes.length > 0 && activeStakes.every(s => s.status !== 'active' && s.status !== 'pending_verification') && (
                 <div style={{ textAlign: 'center', color: '#aaa', marginTop: 30}}>All your stakes are completed or were unstaked.</div>
             )}
          </div>
        )}
         {activeStakes.length === 0 && !loading && stakingConfigData && (
             <div style={{textAlign: 'center', color: '#aaa', marginTop: 40, padding: 20}} className="glass-pane">You have no active stakes yet. Choose a plan above to start earning!</div>
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
              <Paragraph><Text strong style={{color: '#aaa'}}>Plan Duration: </Text><Text style={{color: 'white'}}>{selectedPlan.duration || selectedPlan.duration_days} days</Text></Paragraph>
              <Paragraph><Text strong style={{color: '#aaa'}}>Fixed Reward APR: </Text><span style={{color: '#52c41a', fontWeight: 'bold'}}>{selectedPlan.apr}% ARIX</span></Paragraph>
              <Paragraph><Text strong style={{color: '#aaa'}}>Early Unstake Penalty: </Text><span style={{color: '#ff7875', fontWeight: 'bold'}}>{selectedPlan.earlyUnstakePenaltyPercent}% of staked ARIX</span></Paragraph>
              <Paragraph><Text strong style={{color: '#aaa'}}>Minimum Stake: </Text><Text style={{color: 'white'}}>{parseFloat(selectedPlan.minStakeArix).toFixed(ARIX_DECIMALS)} ARIX</Text></Paragraph>
              <Divider style={{borderColor: 'rgba(255,255,255,0.1)'}}/>
              <Paragraph><Text strong style={{color: '#aaa'}}>Your ARIX Balance: </Text><Text style={{color: '#00adee', fontWeight: 'bold'}}>{arixBalance.toFixed(ARIX_DECIMALS)} ARIX</Text></Paragraph> 
              <div style={{ margin: '20px 0' }}>
                <Text strong style={{color: '#aaa', display: 'block', marginBottom: 8}}>Amount to Stake (Approx. USDT Value):</Text>
                <InputNumber
                  min={0.01} 
                  style={{ width: '100%'}} 
                  addonBefore={<Text style={{color: '#aaa'}}>$</Text>}
                  value={inputUsdtAmount}
                  onChange={handleUsdtAmountChange}
                  placeholder="e.g., 10 for $10 USDT"
                  formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value ? value.toString().replace(/\$\s?|(,*)/g, '') : ''}
                  step={1} 
                  precision={2} 
                />
              </div>
              {currentArxPrice && inputUsdtAmount !== null && inputUsdtAmount > 0 && ( 
                <Paragraph style={{
                    color: (calculatedArixAmount > arixBalance || calculatedArixAmount < (parseFloat(selectedPlan.minStakeArix) || 0)) ? '#ff7875' : '#52c41a',
                    fontWeight: 'bold',
                    marginTop: 10,
                    padding: '8px',
                    background: 'rgba(0,0,0,0.1)',
                    borderRadius: '8px'
                  }}
                >
                  This equals approx. {calculatedArixAmount.toFixed(ARIX_DECIMALS)} ARIX.
                  {calculatedArixAmount > arixBalance && " (Insufficient Balance)"}
                  {calculatedArixAmount < (parseFloat(selectedPlan.minStakeArix) || 0) && calculatedArixAmount > 0 && ` (Min stake: ${parseFloat(selectedPlan.minStakeArix).toFixed(ARIX_DECIMALS)} ARIX)`}
                </Paragraph>
              )}
               {inputUsdtAmount !== null && inputUsdtAmount <= 0 && (
                   <Paragraph style={{color: '#ff7875', marginTop: 10}}>Amount must be greater than 0.</Paragraph>
               )}
            </>
          )}
        </Modal>
      </div>
    </Spin>
  );
};

export default EarnPage;
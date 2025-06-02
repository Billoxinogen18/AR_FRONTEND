// File: ar_terminal/tma_frontend/src/pages/EarnPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Row, Col, Card, InputNumber, Button, Typography, Spin, message, Modal } from 'antd';
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';
import StakingPlans from '../components/earn/StakingPlans'; // This now has fixed APRs
import { stakeArix, getUserStakes } from '../services/api'; 
import { 
  getJettonWalletAddress, 
  getJettonBalance, 
  createJettonTransferMessage,
  toArixSmallestUnits,
  fromArixSmallestUnits,
  ARIX_DECIMALS
} from '../utils/tonUtils'; 
import { getArxUsdtPriceFromApi } from '../services/priceServiceFrontend';

const { Title, Text, Paragraph } = Typography;

const ARIX_JETTON_MASTER_ADDRESS = "EQCLU6KIPjZJbhyYlRfENc3nQck2DWulsUq2gJPyWEK9wfDd"; 
const STAKING_CONTRACT_ADDRESS = "PLACEHOLDER_STAKING_CONTRACT_ADDRESS"; // Still a placeholder unless you have one



const EarnPage = () => {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [inputUsdtAmount, setInputUsdtAmount] = useState(null);
  const [calculatedArixAmount, setCalculatedArixAmount] = useState(0);
  const [currentArxPrice, setCurrentArxPrice] = useState(null);
  const [arixBalance, setArixBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [activeStakes, setActiveStakes] = useState([]);
  
  const wallet = useTonWallet();
  const [tonConnectUI] = useTonConnectUI();

  const fetchPriceAndBalance = useCallback(async () => {
    setLoading(true);
    try {
      const price = await getArxUsdtPriceFromApi();
      setCurrentArxPrice(price);

      if (wallet?.account?.address) {
        const userArixJettonWallet = await getJettonWalletAddress(wallet.account.address, ARIX_JETTON_MASTER_ADDRESS);
        if (userArixJettonWallet) {
          const balanceSmallestUnits = await getJettonBalance(userArixJettonWallet);
          setArixBalance(fromArixSmallestUnits(balanceSmallestUnits));
        } else {
          setArixBalance(0);
        }
      } else {
        setArixBalance(0);
      }
    } catch (error) {
      console.error("Failed to fetch price or balance:", error);
      message.error("Could not fetch latest ARIX price or balance.");
    } finally {
      setLoading(false);
    }
  }, [wallet]);

  const fetchUserActiveStakes = useCallback(async () => {
    if (wallet?.account?.address) {
      try {
        setLoading(true);
        const response = await getUserStakes(wallet.account.address);
        const stakesData = response.data || [];
        
        const formattedStakes = stakesData.map(stake => {
            const arixStaked = parseFloat(stake.arixAmountStaked || stake.arix_amount_staked || 0);
            const planApr = parseFloat(stake.apr || stake.fixed_apr_percent || 0); // Use single APR field
            const planDuration = parseInt(stake.planDurationDays || stake.plan_duration_days || 0);
            let accruedReward = 0;
            if (stake.status === 'active' || stake.status === 'pending_confirmation') {
                const timeElapsedMs = new Date() - new Date(stake.stakeTimestamp || stake.stake_timestamp);
                const daysElapsed = timeElapsedMs / (1000 * 60 * 60 * 24);
                const effectiveDaysForAccrual = Math.min(daysElapsed, planDuration);
                accruedReward = (arixStaked * (planApr / 100) * effectiveDaysForAccrual) / 365;
            }

            return {
                id: stake.id || stake.stake_id,
                planTitle: stake.planTitle || stake.plan_title,
                arixAmountStaked: arixStaked,
                currentUsdtValueRef: currentArxPrice && arixStaked ? (arixStaked * currentArxPrice).toFixed(2) : 'N/A',
                referenceUsdtValueAtStakeTime: parseFloat(stake.referenceUsdtValueAtStakeTime || stake.reference_usdt_value_at_stake_time || 0).toFixed(2),
                apr: planApr, // Single APR
                earlyUnstakePenaltyPercent: parseFloat(stake.earlyUnstakePenaltyPercent || stake.early_unstake_penalty_percent || 0),
                accruedArixReward: parseFloat(accruedReward.toFixed(ARIX_DECIMALS)),
                remainingDays: stake.remainingDays > 0 ? parseInt(stake.remainingDays) : 0,
                status: stake.status,
                stakeTimestamp: stake.stakeTimestamp || stake.stake_timestamp,
                unlockTimestamp: stake.unlockTimestamp || stake.unlock_timestamp
            };
        });
        setActiveStakes(formattedStakes);
      } catch (error) {
        message.error('Failed to fetch your active stakes.');
        console.error("Fetch active stakes error:", error);
        setActiveStakes([]);
      } finally {
        setLoading(false);
      }
    } else {
      setActiveStakes([]);
    }
  }, [wallet, currentArxPrice]);

  useEffect(() => {
    fetchPriceAndBalance();
  }, [wallet, fetchPriceAndBalance]);

  useEffect(() => {
    if(wallet?.account?.address) {
        fetchUserActiveStakes();
    }
  }, [wallet, fetchUserActiveStakes]);

  useEffect(() => {
    if (inputUsdtAmount && currentArxPrice && currentArxPrice > 0) {
      setCalculatedArixAmount(parseFloat((inputUsdtAmount / currentArxPrice).toFixed(ARIX_DECIMALS)));
    } else {
      setCalculatedArixAmount(0);
    }
  }, [inputUsdtAmount, currentArxPrice]);

  const handlePlanSelect = (plan) => {
    if (!currentArxPrice || currentArxPrice <= 0) {
        message.error("ARIX price not available. Cannot initiate stake. Please try again shortly.");
        fetchPriceAndBalance();
        return;
    }
    setSelectedPlan(plan);
    setInputUsdtAmount(null); 
    setCalculatedArixAmount(0);
    setIsModalVisible(true);
  };

  const handleUsdtAmountChange = (value) => {
    setInputUsdtAmount(value);
  };

  const handleConfirmStake = async () => {
    if (!wallet || !selectedPlan || !calculatedArixAmount || calculatedArixAmount <= 0) {
      message.error('Please connect wallet, select a plan, ensure valid USDT amount is entered, and ARIX amount is calculated.');
      return;
    }
    if (calculatedArixAmount > arixBalance) {
        message.error(`Insufficient ARIX balance. Need ${calculatedArixAmount.toFixed(ARIX_DECIMALS)} ARIX, have ${arixBalance.toFixed(ARIX_DECIMALS)} ARIX.`);
        return;
    }
    if (!STAKING_CONTRACT_ADDRESS || STAKING_CONTRACT_ADDRESS === "PLACEHOLDER_STAKING_CONTRACT_ADDRESS") {
        message.error("Staking contract address is not configured. Please contact support.");
        return;
    }

    setActionLoading(true);
    try {
      const userArixJettonWalletAddress = await getJettonWalletAddress(wallet.account.address, ARIX_JETTON_MASTER_ADDRESS);
      if (!userArixJettonWalletAddress) {
        message.error("Could not find your ARIX wallet. Ensure you have ARIX tokens.");
        setActionLoading(false);
        return;
      }

      const amountInSmallestUnits = toArixSmallestUnits(calculatedArixAmount);
      
      const jettonTransferBody = createJettonTransferMessage(
        amountInSmallestUnits,
        STAKING_CONTRACT_ADDRESS, 
        wallet.account.address,
        toArixSmallestUnits(0.1), 
        null 
      );

      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 360,
        messages: [
          {
            address: userArixJettonWalletAddress,
            amount: toArixSmallestUnits(0.2).toString(),
            payload: jettonTransferBody.toBoc().toString("base64") 
          },
        ],
      };
      
      const result = await tonConnectUI.sendTransaction(transaction);
      message.info("Stake transaction sent. Waiting for on-chain confirmation and backend processing...");
      
      await new Promise(resolve => setTimeout(resolve, 8000)); 

      await stakeArix({ 
        planKey: selectedPlan.key, 
        arixAmount: calculatedArixAmount,
        userWalletAddress: wallet.account.address,
        transactionBoc: result.boc,
        referenceUsdtValue: inputUsdtAmount 
      });

      message.success(`Successfully staked ${calculatedArixAmount.toFixed(ARIX_DECIMALS)} ARIX (approx. $${inputUsdtAmount || 0}) in ${selectedPlan.title}! Stake details will update shortly.`);
      setIsModalVisible(false);
      setSelectedPlan(null);
      setInputUsdtAmount(null);
      setCalculatedArixAmount(0);
      
      setTimeout(() => {
        fetchPriceAndBalance(); 
        fetchUserActiveStakes();
      }, 5000);

    } catch (error) {
      message.error(`Staking failed: ${error.message || 'Please try again.'}`);
      console.error('Staking error:', error);
    } finally {
      setActionLoading(false);
    }
  };
  
  const handleUnstake = async (stake) => {
    setActionLoading(true);
    message.info(`Initiating unstake for ${stake.arixAmountStaked.toFixed(ARIX_DECIMALS)} ARIX. Please confirm transaction.`);
    console.log("Attempting to unstake:", stake);
    await new Promise(resolve => setTimeout(resolve, 2000));
    message.warn(`Unstake feature for stake ID: ${stake.id} is conceptual. Full implementation required.`);
    setActionLoading(false);
  };

  if (!wallet?.account?.address) {
    return (
      <div style={{ textAlign: 'center', marginTop: '50px' }}>
        <Title level={3} style={{color: 'white'}}>Connect Your Wallet</Title>
        <Paragraph style={{color: '#ccc'}}>Please connect your TON wallet to access staking features.</Paragraph>
      </div>
    );
  }

  return (
    <Spin spinning={loading || actionLoading}>
      <div style={{ padding: '20px' }}>
        <Row gutter={[16, 24]} justify="center">
          <Col span={24} style={{ textAlign: 'center' }}>
            <Title level={2} style={{ color: 'white' }}>Stake ARIX (Earn ARIX)</Title>
            <Text style={{ color: '#ccc' }}>Your ARIX Balance: {arixBalance.toFixed(ARIX_DECIMALS)} ARIX</Text>
            {currentArxPrice && <Text style={{ color: '#ccc', display: 'block' }}>Current ARIX Price: ~$${currentArxPrice.toFixed(6)} / ARIX</Text>}
          </Col>
        </Row>

        <StakingPlans onSelectPlan={handlePlanSelect} />

        {activeStakes.length > 0 && (
          <div style={{ marginTop: '40px' }}>
            <Title level={3} style={{ color: 'white', textAlign: 'center' }}>Your Active ARIX Stakes</Title>
            <Row gutter={[16, 16]}>
              {activeStakes.map(stake => (
                <Col xs={24} md={12} lg={8} key={stake.id}>
                  <Card 
                    title={`${stake.planTitle || 'Stake'} (ID: ${stake.id.toString().substring(0,6)}...)`} 
                    style={{ background: '#1f1f1f', color: 'white', borderColor: '#303030', borderRadius: '8px' }} 
                    headStyle={{color: 'white', borderColor: '#303030'}}
                  >
                    <p><Text strong style={{color: '#aaa'}}>ARIX Staked: </Text><Text style={{color: 'white'}}>{stake.arixAmountStaked.toFixed(ARIX_DECIMALS)} ARIX</Text></p>
                    <p><Text strong style={{color: '#aaa'}}>Ref. USDT Value (at stake): </Text><Text style={{color: 'white'}}>${stake.referenceUsdtValueAtStakeTime}</Text></p>
                    <p><Text strong style={{color: '#aaa'}}>Approx. Current Value: </Text><Text style={{color: 'white'}}>${stake.currentUsdtValueRef}</Text></p>
                    <p><Text strong style={{color: '#aaa'}}>Fixed Reward APR: </Text><Text style={{color: '#52c41a'}}>{stake.apr}% ARIX</Text></p>
                    <p><Text strong style={{color: '#aaa'}}>Accrued Reward (Est.): </Text><Text style={{color: 'white'}}>{stake.accruedArixReward.toFixed(ARIX_DECIMALS)} ARIX</Text></p>
                    <p><Text strong style={{color: '#aaa'}}>Early Penalty: </Text><Text style={{color: 'red'}}>{stake.earlyUnstakePenaltyPercent}% of staked ARIX</Text></p>
                    <p><Text strong style={{color: '#aaa'}}>Days Remaining: </Text><Text style={{color: 'white'}}>{stake.remainingDays}</Text></p>
                    <div style={{marginTop: '15px', display: 'flex', justifyContent: 'center'}}>
                        <Button 
                            onClick={() => handleUnstake(stake)} 
                            disabled={stake.status !== 'active' || stake.remainingDays > 0}
                            type="primary" 
                            danger={stake.status === 'active' && stake.remainingDays <= 0 }
                        >
                            {stake.status === 'active' && stake.remainingDays > 0 ? `Unstake (Incurs Penalty)` : `Unstake ARIX`}
                        </Button>
                    </div>
                     <Text style={{fontSize: '12px', color: '#888', display: 'block', marginTop: '10px', textAlign: 'center'}}>
                        {stake.status === 'active' && stake.remainingDays > 0 ? `Unstaking early incurs a ${stake.earlyUnstakePenaltyPercent}% penalty.` : (stake.status === 'active' ? `Ready to unstake.` : `Status: ${stake.status}`)}
                    </Text>
                  </Card>
                </Col>
              ))}
            </Row>
          </div>
        )}

        <Modal
          title={`Stake ARIX in "${selectedPlan?.title}"`}
          visible={isModalVisible}
          onOk={handleConfirmStake}
          onCancel={() => {setIsModalVisible(false); setInputUsdtAmount(null);}}
          confirmLoading={actionLoading}
          okText="Confirm Stake ARIX"
          cancelText="Cancel"
          bodyStyle={{background: '#1f1f1f', color: 'white'}}
          headStyle={{background: '#1f1f1f', color: 'white', borderBottom: '1px solid #303030'}}
          footer={[
            <Button key="back" onClick={() => {setIsModalVisible(false); setInputUsdtAmount(null);}} style={{borderColor: '#555', color: '#ccc'}}>
              Cancel
            </Button>,
            <Button key="submit" type="primary" loading={actionLoading} onClick={handleConfirmStake} disabled={!calculatedArixAmount || calculatedArixAmount <= 0 || calculatedArixAmount > arixBalance}>
              Stake {calculatedArixAmount > 0 ? calculatedArixAmount.toFixed(ARIX_DECIMALS) : ''} ARIX
            </Button>,
          ]}
        >
          {selectedPlan && (
            <>
              <p><Text strong style={{color: '#aaa'}}>Plan: </Text><Text style={{color: 'white'}}>{selectedPlan.title}</Text></p>
              <p><Text strong style={{color: '#aaa'}}>Duration: </Text><Text style={{color: 'white'}}>{selectedPlan.duration} days</Text></p>
              <p><Text strong style={{color: '#aaa'}}>Fixed Reward APR (ARIX): </Text><Text style={{color: 'white'}}>{selectedPlan.apr}% on staked ARIX</Text></p>
              <p><Text strong style={{color: '#aaa'}}>Early Unstake Penalty: </Text><Text style={{color: 'red'}}>{selectedPlan.earlyUnstakePenaltyPercent}% of staked ARIX</Text></p>
              <p><Text strong style={{color: '#aaa'}}>Your ARIX Balance: </Text><Text style={{color: 'white'}}>{arixBalance.toFixed(ARIX_DECIMALS)} ARIX</Text></p>
              <div style={{ marginTop: '15px', marginBottom: '10px' }}>
                <Text strong style={{color: '#aaa'}}>Amount to Stake (Approx. USDT Value):</Text>
                <InputNumber
                  min={1} 
                  style={{ width: '100%', marginTop: '5px', background: '#2a2a2a', color: 'white', borderColor: '#444' }}
                  value={inputUsdtAmount}
                  onChange={handleUsdtAmountChange}
                  placeholder="Enter Approx. USDT Value to Stake"
                  formatter={value => `\$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value ? value.toString().replace(/\$\s?|(,*)/g, '') : ''}
                />
              </div>
              {currentArxPrice && inputUsdtAmount && inputUsdtAmount > 0 && (
                <Paragraph style={{color: calculatedArixAmount > arixBalance ? 'red' : '#52c41a', fontWeight: 'bold'}}>
                  This equals approx. {calculatedArixAmount.toFixed(ARIX_DECIMALS)} ARIX.
                  {calculatedArixAmount > arixBalance && " (Insufficient Balance)"}
                </Paragraph>
              )}
            </>
          )}
        </Modal>
      </div>
    </Spin>
  );
};

export default EarnPage;

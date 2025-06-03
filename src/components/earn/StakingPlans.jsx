// File: AR_FRONTEND/src/components/earn/StakingPlans.jsx
import React from 'react';
import { Card, Row, Col, Button, Statistic, Tooltip, Typography } from 'antd';
import { InfoCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { ARIX_DECIMALS } from '../../utils/tonUtils';

const { Title: AntTitle, Text } = Typography;

const StakingPlans = ({ plans, onSelectPlan, currentArxPrice }) => {
  if (!plans || plans.length === 0) {
    // If no plans, we don't show this component at all based on EarnPage logic.
    // However, if it were to be shown directly, this would be the message.
    // return <Card className="dark-theme-card" style={{textAlign: 'center', padding: 30}}><Text style={{color: '#a0a0a5'}}>No staking plans available at the moment.</Text></Card>;
    return null; 
  }
  return (
    <div>
      <AntTitle level={3} className="section-title" style={{ textAlign: 'center', marginBottom: '24px'}}>
        Choose Your Staking Plan
      </AntTitle>
      <Row gutter={[16, 16]} justify="center"> {/* Reduced gutter for tighter look */}
        {plans.map((plan) => {
          const minStakeUsdNum = parseFloat(plan.minStakeUsd || 0);
          const minStakeArixApprox = currentArxPrice && minStakeUsdNum > 0 ? (minStakeUsdNum / currentArxPrice).toFixed(ARIX_DECIMALS) : null;
          const displayUsdApr = parseFloat(plan.usdRewardApr || 0).toFixed(2);
          const displayArixPenalty = parseFloat(plan.arixEarlyUnstakePenaltyPercent || 0).toFixed(2);

          return (
            <Col xs={24} sm={18} md={12} lg={8} key={plan.key || plan.id}>
              <Card
                className="dark-theme-card" // Using the new base card style
                hoverable
                actions={[
                  <Button
                    type="primary"
                    key={`select-${plan.key || plan.id}`}
                    onClick={() => onSelectPlan(plan)}
                    style={{ margin: '0 auto', display: 'block', width: 'calc(100% - 32px)'}} // Adjusted width
                    icon={<CheckCircleOutlined />}
                  >
                    Select Plan
                  </Button>,
                ]}
              >
                <div style={{ textAlign: 'center', marginBottom: 16 }}>
                    <Text style={{ color: '#7e73ff', fontWeight: 'bold', fontSize: '1.3em' }}>{plan.title}</Text>
                </div>
                <Statistic // Duration
                  title={<Text style={{color: '#8e8e93'}}>ARIX Lock Duration</Text>}
                  value={`${plan.duration} Days`}
                  valueStyle={{ color: '#ffffff', fontWeight: '500', fontSize: '1.5em' }}
                />
                <Statistic // USD Reward APR
                  title={<Text style={{color: '#8e8e93'}}>USD Value Reward APR</Text>} 
                  value={`${displayUsdApr}%`}
                  suffix={<Text style={{color: '#4CAF50', fontSize: '0.75em', marginLeft: 4}}>(Paid in ARIX)</Text>}
                  valueStyle={{ color: '#4CAF50', fontWeight: '500', fontSize: '1.5em' }}
                  style={{marginTop: 10}}
                />
                <Statistic // Min USD Stake
                  title={<Text style={{color: '#8e8e93'}}>Min. USD Stake Value</Text>} 
                  value={`$${minStakeUsdNum.toFixed(2)} USD`}
                  valueStyle={{ color: '#e0e0e5', fontSize: '1rem' }}
                  suffix={minStakeArixApprox ? <Text style={{color: '#6a6a6e', fontSize: '0.75em', marginLeft: 4}}>(~{minStakeArixApprox} ARIX)</Text> : ""}
                  style={{marginTop: 10}}
                />
                <Statistic // ARIX Penalty
                  title={
                    <Text style={{color: '#8e8e93'}}>
                        ARIX Early Unstake Penalty{" "}
                        <Tooltip title={`Penalty on ARIX principal if unstaked before ${plan.duration} days. Off-chain rewards are separate.`}>
                            <InfoCircleOutlined style={{marginLeft: '4px', color: '#6a6a6e', cursor: 'help'}}/>
                        </Tooltip>
                    </Text>
                  } 
                  value={`${displayArixPenalty}%`}
                  valueStyle={{ color: '#F44336', fontSize: '1rem' }}
                  style={{marginTop: 10}}
                />
              </Card>
            </Col>
          );
        })}
      </Row>
    </div>
  );
};

export default StakingPlans;
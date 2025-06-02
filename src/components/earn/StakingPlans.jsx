// File: AR_FRONTEND/src/components/earn/StakingPlans.jsx
import React from 'react';
import { Card, Row, Col, Button, Statistic, Tooltip, Typography } from 'antd';
import { InfoCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { ARIX_DECIMALS } from '../../utils/tonUtils';

const { Title: AntTitle, Text } = Typography;

const StakingPlans = ({ plans, onSelectPlan, currentArxPrice }) => {
  if (!plans || plans.length === 0) {
    return <div style={{textAlign: 'center', color: '#aaa', marginTop: 40, padding: 20}} className="glass-pane">No staking plans available at the moment. Please check back later or ensure the backend is providing them.</div>;
  }
  return (
    <div>
      <AntTitle level={2} style={{ textAlign: 'center', marginBottom: '30px', color: 'white', fontWeight: 'bold' }}>
        Choose Your Staking Plan
      </AntTitle>
      <Row gutter={[24, 24]} justify="center">
        {plans.map((plan) => {
          // Ensure plan properties are accessed correctly from backend mapping
          // Backend in earnController maps:
          // fixed_usdt_apr_percent -> usdtApr
          // arix_early_unstake_penalty_percent -> arixEarlyUnstakePenaltyPercent
          // duration_days -> duration
          // min_stake_arix -> minStakeArix
          const minStakeArixNum = parseFloat(plan.minStakeArix || 0);
          const minStakeUsdtApprox = currentArxPrice && minStakeArixNum > 0 ? (minStakeArixNum * currentArxPrice).toFixed(2) : null;
          const displayUsdtApr = parseFloat(plan.usdtApr || 0).toFixed(2);
          const displayArixPenalty = parseFloat(plan.arixEarlyUnstakePenaltyPercent || 0).toFixed(2);


          return (
            <Col xs={24} sm={18} md={12} lg={8} key={plan.key || plan.id}>
              <Card
                className="neumorphic-glass-card"
                hoverable
                actions={[
                  <Button
                    type="primary"
                    key={`select-${plan.key || plan.id}`}
                    onClick={() => onSelectPlan(plan)} // plan object passed to EarnPage
                    style={{ margin: '0 auto', display: 'block', width: 'calc(100% - 48px)'}}
                    icon={<CheckCircleOutlined />}
                  >
                    Select Plan
                  </Button>,
                ]}
              >
                <div style={{ textAlign: 'center', marginBottom: 16 }}>
                    <Text style={{ color: '#00adee', fontWeight: 'bold', fontSize: '1.4em' }}>{plan.title}</Text>
                </div>
                <Statistic
                  title={<Text style={{color: '#aaa'}}>ARIX Lock Duration</Text>}
                  value={`${plan.duration} Days`}
                  valueStyle={{ color: '#00adee', fontWeight: 'bold', fontSize: '1.8em' }}
                />
                <Statistic
                  title={<Text style={{color: '#aaa'}}>USDT Reward APR</Text>}
                  value={`${displayUsdtApr}%`} 
                  suffix={<Text style={{color: '#52c41a', fontSize: '0.8em', marginLeft: 4}}> USDT</Text>}
                  valueStyle={{ color: '#52c41a', fontWeight: 'bold', fontSize: '1.8em' }}
                />
                <Statistic
                  title={<Text style={{color: '#aaa'}}>Min. ARIX Stake</Text>}
                  value={`${minStakeArixNum.toFixed(ARIX_DECIMALS)} ARIX`}
                  valueStyle={{ color: '#e0e0e0', fontWeight: 'normal', fontSize: '1.1em' }}
                  suffix={minStakeUsdtApprox ? <Text style={{color: '#888', fontSize: '0.8em', marginLeft: 4}}>(~${minStakeUsdtApprox} USDT)</Text> : ""}
                />
                <Statistic
                  title={<Text style={{color: '#aaa'}}>ARIX Early Unstake Penalty <Tooltip title={`Penalty on ARIX principal if unstaked before ${plan.duration} days. USDT rewards are separate.`}><InfoCircleOutlined style={{marginLeft: '4px', color: '#aaa'}}/></Tooltip></Text>}
                  value={`${displayArixPenalty}%`}
                  valueStyle={{ color: '#ff7875', fontWeight: '500', fontSize: '1.1em' }}
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

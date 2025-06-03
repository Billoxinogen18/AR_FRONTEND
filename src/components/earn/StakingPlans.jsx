import React from 'react';
import { Card, Row, Col, Button, Statistic, Tooltip, Typography } from 'antd';
import { InfoCircleOutlined, CheckCircleOutlined, DollarCircleOutlined } from '@ant-design/icons';
import { ARIX_DECIMALS } from '../../utils/tonUtils';

const { Title: AntTitle, Text } = Typography;

const StakingPlans = ({ plans, onSelectPlan, currentArxPrice }) => {
  if (!plans || plans.length === 0) {
    return <div style={{textAlign: 'center', color: '#8A8A8A', marginTop: 30, padding: 20}} className="dark-card">No staking plans available at the moment. Please check back later.</div>;
  }
  return (
    <div>
      <AntTitle level={3} style={{ textAlign: 'center', marginBottom: '20px', color: 'white', fontWeight: 'bold' }}>
        Choose Your Staking Plan
      </AntTitle>
      <Row gutter={[16, 16]} justify="center">
        {plans.map((plan) => {
          const minStakeUsdNum = parseFloat(plan.minStakeUsd || 0);
          const minStakeArixApprox = currentArxPrice && minStakeUsdNum > 0 ? (minStakeUsdNum / currentArxPrice).toFixed(ARIX_DECIMALS) : null;
          const displayUsdApr = parseFloat(plan.usdRewardApr || 0).toFixed(2);
          const displayArixPenalty = parseFloat(plan.arixEarlyUnstakePenaltyPercent || 0).toFixed(2);

          return (
            <Col xs={24} sm={12} md={8} key={plan.key || plan.id}>
              <Card
                className="dark-card"
                hoverable
                actions={[
                  <Button
                    type="primary"
                    key={`select-${plan.key || plan.id}`}
                    onClick={() => onSelectPlan(plan)}
                    style={{ margin: '0 auto', display: 'block', width: 'calc(100% - 32px)'}}
                    icon={<CheckCircleOutlined />}
                  >
                    Select Plan
                  </Button>,
                ]}
              >
                <div style={{ textAlign: 'center', marginBottom: 12 }}>
                    <Text style={{ color: '#00BFFF', fontWeight: 'bold', fontSize: '1.2em' }}>{plan.title}</Text>
                </div>
                <Statistic
                  title={<Text style={{color: '#8A8A8A'}}>ARIX Lock Duration</Text>}
                  value={`${plan.duration} Days`}
                  valueStyle={{ color: '#00BFFF', fontWeight: 'bold', fontSize: '1.6em' }}
                />
                <Statistic
                  title={<Text style={{color: '#8A8A8A'}}>USD Reward APR</Text>}
                  value={`${displayUsdApr}%`}
                  suffix={<Text style={{color: '#4CAF50', fontSize: '0.8em', marginLeft: 4}}> USD (Paid in ARIX)</Text>}
                  valueStyle={{ color: '#4CAF50', fontWeight: 'bold', fontSize: '1.6em' }}
                />
                <Statistic
                  title={<Text style={{color: '#8A8A8A'}}>Min. USD Stake</Text>}
                  value={`$${minStakeUsdNum.toFixed(2)} USD`}
                  valueStyle={{ color: '#E0E0E5', fontWeight: 'normal', fontSize: '1em' }}
                  suffix={minStakeArixApprox ? <Text style={{color: '#777', fontSize: '0.8em', marginLeft: 4}}>(~${minStakeArixApprox} ARIX)</Text> : ""}
                />
                <Statistic
                  title={<Text style={{color: '#8A8A8A'}}>ARIX Early Unstake Penalty <Tooltip title={`Penalty on ARIX principal if unstaked before ${plan.duration} days. ARIX rewards are separate.`}><InfoCircleOutlined style={{marginLeft: '4px', color: '#8A8A8A'}}/></Tooltip></Text>}
                  value={`${displayArixPenalty}%`}
                  valueStyle={{ color: '#F44336', fontWeight: '500', fontSize: '1em' }}
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
// File: ar_terminal/tma_frontend/src/components/earn/StakingPlans.jsx
import React from 'react';
import { Card, Row, Col, Button, Statistic, Tooltip } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';

// Updated plan data with a single 'apr' field representing the total fixed ARIX APR
const stakingPlansData = [
  {
    key: 'PLAN_30D',
    title: '30 Day Stake',
    duration: 30,
    apr: 1, // Total Fixed ARIX APR for this plan
    earlyUnstakePenaltyPercent: 7,
    description: 'Short-term stake.',
  },
  {
    key: 'PLAN_60D',
    title: '60 Day Stake',
    duration: 60,
    apr: 2, // Total Fixed ARIX APR for this plan
    earlyUnstakePenaltyPercent: 8,
    description: 'Medium-term stake.',
  },
  {
    key: 'PLAN_120D',
    title: '120 Day Stake',
    duration: 120,
    apr: 3, // Total Fixed ARIX APR for this plan
    earlyUnstakePenaltyPercent: 9,
    description: 'Longer stake for better rewards.',
  },
  {
    key: 'PLAN_240D',
    title: '240 Day Stake',
    duration: 240,
    apr: 4, // Total Fixed ARIX APR for this plan
    earlyUnstakePenaltyPercent: 10,
    description: 'Maximize ARIX returns with the longest commitment.',
  },
];

const StakingPlans = ({ onSelectPlan }) => {
  return (
    <div>
      <h2 style={{ textAlign: 'center', marginBottom: '24px', color: 'white' }}>Choose Your Staking Plan</h2>
      <Row gutter={[16, 16]}>
        {stakingPlansData.map((plan) => (
          <Col xs={24} sm={12} md={12} lg={6} key={plan.key}>
            <Card
              title={plan.title}
              hoverable
              style={{ background: '#1f1f1f', color: 'white', borderColor: '#303030', borderRadius: '8px', height: '100%' }}
              headStyle={{ color: 'white', borderColor: '#303030', borderTopLeftRadius: '8px', borderTopRightRadius: '8px' }}
              bodyStyle={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: 'calc(100% - 57px)' }}
              actions={[
                <Button type="primary" key={`select-${plan.key}`} onClick={() => onSelectPlan(plan)} style={{ borderRadius: '6px' }}>
                  Select Plan
                </Button>,
              ]}
            >
              <div>
                <Statistic title={<span style={{color: '#aaa'}}>Duration</span>} value={`${plan.duration} Days`} valueStyle={{ color: '#00adee', fontWeight: 'bold' }} />
                <Statistic 
                  title={<span style={{color: '#aaa'}}>Fixed Reward APR (ARIX)</span>} 
                  value={`${plan.apr}%`} 
                  valueStyle={{ color: '#52c41a', fontWeight: 'bold' }} 
                />
                <Statistic 
                  title={<span style={{color: '#aaa'}}>Early Unstake Penalty <Tooltip title={`If unstaked before ${plan.duration} days.`}><InfoCircleOutlined style={{marginLeft: '4px'}}/></Tooltip></span>} 
                  value={`${plan.earlyUnstakePenaltyPercent}%`} 
                  valueStyle={{ color: 'red', fontWeight: 'bold' }} 
                  suffix="of staked ARIX"
                />
                <p style={{ marginTop: '16px', color: '#ccc', fontSize: '14px', flexGrow: 1 }}>{plan.description}</p>
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default StakingPlans;

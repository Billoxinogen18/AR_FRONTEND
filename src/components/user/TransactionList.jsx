// File: AR_Proj/AR_FRONTEND/src/components/user/TransactionList.jsx
import React from 'react';
import { List, Card, Typography, Empty, Spin, Tag } from 'antd';
import { ARIX_DECIMALS } from '../../utils/tonUtils.js'; // Ensure this path is correct

const { Text, Paragraph } = Typography;

const TransactionList = ({ items, isLoading, renderItemDetails, listTitle, itemType }) => {
  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px 0' }}>
        <Spin size="large" tip={`Loading ${itemType || 'history'}...`} />
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <Card className="neumorphic-glass-card" style={{marginTop: 20}}>
        <Empty description={`No ${itemType || 'history'} found.`} image={Empty.PRESENTED_IMAGE_SIMPLE} />
      </Card>
    );
  }

  return (
    <Card className="neumorphic-glass-card" title={listTitle || `${itemType || 'Items'} History`} style={{marginTop: 20}}>
      <List
        itemLayout="vertical"
        dataSource={items}
        renderItem={(item, index) => (
          <List.Item 
            key={item.id || item.game_id || item.stake_id || index} // Use a unique key
            style={{ borderBottomColor: 'rgba(255, 255, 255, 0.1)' }}
          >
            {renderItemDetails(item)}
          </List.Item>
        )}
        pagination={{
          pageSize: 5, 
          align: 'center',
          hideOnSinglePage: true,
          showSizeChanger: false,
        }}
      />
    </Card>
  );
};

// Helper to render Stake History Item Details
export const renderStakeHistoryItem = (stake) => (
  <>
    <Paragraph style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
      <Text strong style={{color: '#00adee', fontSize: '1.05em'}}>{stake.planTitle || `Stake ID: ${stake.id?.substring(0,8)}...`}</Text>
      <Tag color={getStakeStatusColor(stake.status)} style={{fontWeight: 'bold', fontSize: '0.9em'}}>{stake.status?.replace('_', ' ').toUpperCase()}</Tag>
    </Paragraph>
    <Paragraph style={{color: '#ccc', fontSize: '0.9em', marginBottom: '4px'}}>
      Staked on: {new Date(stake.stakeTimestamp || stake.stake_timestamp).toLocaleString()}
    </Paragraph>
    {stake.unlockTimestamp && (
         <Paragraph style={{color: '#ccc', fontSize: '0.9em', marginBottom: '4px'}}>
            Unlock{new Date(stake.unlockTimestamp) < new Date() ? 'ed' : 's'} on: {new Date(stake.unlockTimestamp).toLocaleString()}
         </Paragraph>
    )}
    <Paragraph>
      <Text style={{color: '#aaa'}}>Amount Staked: </Text>
      <Text strong style={{color: 'white'}}>{parseFloat(stake.arixAmountStaked || stake.arix_amount_staked).toFixed(ARIX_DECIMALS)} ARIX</Text>
    </Paragraph>
    {(stake.status === 'completed' || stake.status === 'early_unstaked') && (
      <>
        <Paragraph>
          <Text style={{color: '#aaa'}}>Reward Calculated: </Text>
          <Text strong style={{color: '#52c41a'}}>{parseFloat(stake.arixRewardCalculated || stake.arix_reward_calculated || 0).toFixed(ARIX_DECIMALS)} ARIX</Text>
        </Paragraph>
        {parseFloat(stake.arixPenaltyApplied || stake.arix_penalty_applied || 0) > 0 && (
          <Paragraph>
            <Text style={{color: '#aaa'}}>Penalty Applied: </Text>
            <Text strong style={{color: '#ff4d4f'}}>{parseFloat(stake.arixPenaltyApplied || stake.arix_penalty_applied).toFixed(ARIX_DECIMALS)} ARIX</Text>
          </Paragraph>
        )}
      </>
    )}
     {(stake.status === 'active' || stake.status === 'pending_verification') && stake.accruedArixReward !== undefined && (
         <Paragraph>
             <Text style={{color: '#aaa'}}>Accrued Reward (Est.): </Text>
             <Text strong style={{color: '#52c41a'}}>{parseFloat(stake.accruedArixReward).toFixed(ARIX_DECIMALS)} ARIX</Text>
         </Paragraph>
     )}
     {stake.onchainStakeTxHash && (
        <Paragraph style={{fontSize: '0.85em', color: '#888'}}>
            Stake Tx: {stake.onchainStakeTxHash.substring(0,10)}...
        </Paragraph>
     )}
    {stake.onchainUnstakeTxHash && (
        <Paragraph style={{fontSize: '0.85em', color: '#888'}}>
            Unstake Tx: {stake.onchainUnstakeTxHash.substring(0,10)}...
        </Paragraph>
     )}
  </>
);

// Helper to render Coinflip History Item Details
export const renderCoinflipHistoryItem = (game) => (
  <>
    <Paragraph style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
      <Text strong style={{color: game.outcome === 'win' ? '#52c41a' : '#ff4d4f', textTransform: 'capitalize', fontSize: '1.05em'}}>
        {game.outcome}
      </Text>
      <Text style={{color: '#ccc', fontSize: '0.9em'}}>
        {game.choice?.toUpperCase()} vs Coin: {game.server_coin_side?.toUpperCase()}
      </Text>
    </Paragraph>
    <Paragraph style={{color: '#ccc', fontSize: '0.9em', marginBottom: '4px'}}>
      Played on: {new Date(game.played_at).toLocaleString()}
    </Paragraph>
    <Paragraph>
      <Text style={{color: '#aaa'}}>Bet Amount: </Text>
      <Text strong style={{color: 'white'}}>{parseFloat(game.bet_amount_arix).toFixed(ARIX_DECIMALS)} ARIX</Text>
    </Paragraph>
    <Paragraph>
      <Text style={{color: '#aaa'}}>Result: </Text>
      <Text strong style={{color: game.amount_delta_arix > 0 ? '#52c41a' : (game.amount_delta_arix < 0 ? '#ff4d4f' : 'white')}}>
        {game.amount_delta_arix > 0 ? '+' : ''}{parseFloat(game.amount_delta_arix).toFixed(ARIX_DECIMALS)} ARIX
      </Text>
    </Paragraph>
     {game.game_id && (
        <Paragraph style={{fontSize: '0.85em', color: '#888'}}>
            Game ID: {game.game_id.substring(0,8)}...
        </Paragraph>
     )}
  </>
);

// Helper function for stake status colors
const getStakeStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'active': return 'green';
    case 'pending_verification':
    case 'pending_unstake': return 'gold';
    case 'completed': return 'blue';
    case 'early_unstaked': return 'orange';
    case 'failed': return 'red';
    default: return 'default';
  }
};

export default TransactionList;
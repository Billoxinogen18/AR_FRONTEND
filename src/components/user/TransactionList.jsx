// File: AR_FRONTEND/src/components/user/TransactionList.jsx
import React from 'react';
import { List, Card, Typography, Empty, Spin, Tag, Row, Col, Grid, Tooltip } from 'antd';
import { InfoCircleOutlined, DollarCircleOutlined } from '@ant-design/icons';
import { ARIX_DECIMALS } from '../../utils/tonUtils.js'; 
const USD_DECIMALS = 2; 

const { Text, Paragraph, Title } = Typography;
const { useBreakpoint } = Grid;

const getStakeStatusColor = (status) => {
  const s = status?.toLowerCase() || 'unknown';
  if (s === 'active') return 'green'; // AntD green for success-like
  if (s.includes('pending_confirmation')) return 'gold'; // AntD gold for processing
  if (s.includes('pending_arix_unstake_confirmation')) return 'orange'; // AntD orange
  if (s.includes('completed')) return 'blue'; // AntD blue for info
  if (s.includes('early_arix_unstaked') || s.includes('early_unstaked')) return 'volcano'; // AntD volcano for warning/attention
  if (s.includes('failed')) return 'red'; // AntD red for error
  return 'default'; // AntD default grey
};

export const renderStakeHistoryItem = (stake, isMobile) => {
  return (
    <div className="stake-history-item" style={{ padding: isMobile ? '8px 0' : '12px 0' }}>
      <Row justify="space-between" align="top" gutter={8} style={{ marginBottom: 6 }}>
        <Col flex="auto">
          <Title level={5} style={{color: '#e0e0e5', marginBottom: 2, wordBreak: 'break-word', fontSize: isMobile ? '1rem' : '1.05rem', fontWeight: 500}}>
              {stake.planTitle || `Stake ID: ${stake.id?.substring(0,8)}...`}
          </Title>
          <Text style={{color: '#8e8e93', fontSize: '0.8rem'}}>
            Duration: {stake.planDurationDays} Days
            {stake.status === 'active' && stake.remainingDays > 0 &&
              ` (${stake.remainingDays} days left)`
            }
          </Text>
        </Col>
        <Col style={{textAlign: 'right'}}>
          <Tag color={getStakeStatusColor(stake.status)} style={{fontWeight:'500'}}>
              {stake.status?.replace(/_/g, ' ').toUpperCase()}
          </Tag>
        </Col>
      </Row>

      <Row gutter={isMobile ? [8, 8] : [16, 8]} style={{marginTop: 8}}>
        <Col xs={24} sm={12} md={8}>
            <Paragraph className="history-text-item">
                <Text strong style={{color: '#a0a0a5'}}>Initial Value Staked:</Text><br/> 
                <Text style={{color: 'white', fontSize: '1em'}}>${parseFloat(stake.referenceUsdtValueAtStakeTime || 0).toFixed(USD_DECIMALS)} USD</Text>
                <br/><Text style={{color: '#6a6a6e', fontSize: '0.8rem'}}>({parseFloat(stake.arixAmountStaked).toFixed(ARIX_DECIMALS)} ARIX Principal)</Text>
            </Paragraph>
        </Col>
        <Col xs={24} sm={12} md={8}>
            <Paragraph className="history-text-item">
                <Text strong style={{color: '#a0a0a5'}}>USD Value Reward APR:</Text><br/> 
                <Text style={{color: '#4CAF50', fontSize: '1em', fontWeight: 500}}>{parseFloat(stake.usdValueRewardApr || 0).toFixed(2)}%</Text>
                 <br/><Text style={{color: '#6a6a6e', fontSize: '0.8rem'}}>Accrued: {parseFloat(stake.accruedArixRewardTotal || 0).toFixed(ARIX_DECIMALS)} ARIX</Text>
            </Paragraph>
        </Col>
         <Col xs={24} sm={12} md={8}>
             {parseFloat(stake.arixEarlyUnstakePenaltyPercent || 0) > 0 && (
                <Paragraph className="history-text-item">
                    <Text strong style={{color: '#a0a0a5'}}>ARIX Early Unstake Penalty:</Text><br/>
                    <Text style={{color: '#F44336', fontSize: '1em'}}>{parseFloat(stake.arixEarlyUnstakePenaltyPercent).toFixed(2)}%</Text>
                </Paragraph>
            )}
        </Col>
      </Row>
      <Paragraph className="history-text-item small-text">
        Staked On: {new Date(stake.stakeTimestamp).toLocaleString()}
      </Paragraph>
      {stake.unlockTimestamp && (
           <Paragraph className="history-text-item small-text">
              ARIX Lock Unlocks: {new Date(stake.unlockTimestamp).toLocaleString()}
           </Paragraph>
      )}
       {stake.onchainStakeTxHash && (
          <Paragraph className="history-text-item small-text tx-hash">
              Stake Tx: <Text copyable={{text: stake.onchainStakeTxHash}} style={{color:"#8e8e93"}}>{stake.onchainStakeTxHash.substring(0,isMobile ? 8:16)}...</Text>
          </Paragraph>
       )}
      {stake.onchainUnstakeTxHash && (
          <Paragraph className="history-text-item small-text tx-hash">
              ARIX Unstake Tx: <Text copyable={{text: stake.onchainUnstakeTxHash}} style={{color:"#8e8e93"}}>{stake.onchainUnstakeTxHash.substring(0,isMobile ? 8:16)}...</Text>
          </Paragraph>
       )}
    </div>
  );
};

export const renderCoinflipHistoryItem = (game, isMobile) => {
  return (
  <div className="game-history-item" style={{ padding: isMobile ? '8px 0' : '12px 0' }}>
    <Row justify="space-between" align="middle" gutter={8} style={{marginBottom: 6}}>
        <Col>
            <Text strong className={game.outcome === 'win' ? 'game-win' : 'game-loss'} style={{textTransform: 'capitalize', fontSize: isMobile ? '1.05rem' :'1.1rem'}}>
              {game.outcome}
            </Text>
        </Col>
        <Col>
            <Text style={{color: '#a0a0a5', fontSize: isMobile ? '0.8rem' : '0.85rem'}}>
              You Chose: {game.choice?.toUpperCase()} (Coin Was: {game.server_coin_side?.toUpperCase()})
            </Text>
        </Col>
    </Row>
    <Paragraph className="history-text-item" style={{marginBottom:3}}>
      <Text strong style={{color: '#a0a0a5'}}>Bet Amount: </Text><Text style={{color: 'white'}}>{parseFloat(game.bet_amount_arix).toFixed(ARIX_DECIMALS)} ARIX</Text>
    </Paragraph>
    <Paragraph className="history-text-item">
      <Text strong style={{color: '#a0a0a5'}}>Result (Delta): </Text><Text strong className={parseFloat(game.amount_delta_arix) > 0 ? 'game-win' : (parseFloat(game.amount_delta_arix) < 0 ? 'game-loss' : '')}>
        {parseFloat(game.amount_delta_arix) > 0 ? '+' : ''}{parseFloat(game.amount_delta_arix).toFixed(ARIX_DECIMALS)} ARIX
      </Text>
    </Paragraph>
    <Paragraph className="history-text-item small-text" style={{marginTop: 6}}>
      Played At: {new Date(game.played_at).toLocaleString()}
    </Paragraph>
     {game.game_id && (
        <Paragraph className="history-text-item small-text tx-hash">
            Game ID: <Text copyable={{text: game.game_id}} style={{color:"#8e8e93"}}>{game.game_id.substring(0,isMobile ? 8:12)}...</Text>
        </Paragraph>
     )}
  </div>
  );
};

const TransactionList = ({ items, isLoading, renderItemDetails, listTitle, itemType, listStyle }) => {
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px 0' }}>
        <Spin size="large" tip={`Loading ${itemType || 'history'}...`} />
      </div>
    );
  }

  if (!items || items.length === 0) {
    return ( // Consistent styling for empty state
      <Card className="dark-theme-card" style={{marginTop: 20, textAlign:'center', padding: '20px', ...listStyle}}>
        <Empty description={<Text style={{color: '#a0a0a5'}}>{`No ${itemType || 'history'} found.`}</Text>} image={Empty.PRESENTED_IMAGE_SIMPLE} />
      </Card>
    );
  }

  return (
    <Card className="dark-theme-card transaction-list-card" title={listTitle || `${itemType || 'Items'} History`} style={{marginTop: 20, ...listStyle}}>
      <List
        itemLayout="vertical"
        dataSource={items}
        renderItem={(item, index) => (
          <List.Item 
            key={item.id || item.game_id || item.stake_id || index}
            className="transaction-list-item" // Uses CSS for border
          >
            {renderItemDetails(item, isMobile)}
          </List.Item>
        )}
        pagination={{ 
            pageSize: isMobile ? 4 : 5, 
            align: 'center', 
            hideOnSinglePage: true, 
            showSizeChanger: false, 
            simple: isMobile,
            itemRender: (current, type, originalElement) => { // Custom pagination style for dark theme
                if (type === 'prev' || type === 'next') {
                    return <Button type="text" style={{color:'#8e8e93'}}>{originalElement}</Button>;
                }
                if (type === 'page') {
                     return <Button type="text" style={{color: '#8e8e93', minWidth: 'auto', padding:'0 8px'}}>{current}</Button>
                }
                return originalElement;
            }
        }}
      />
    </Card>
  );
};

TransactionList.defaultProps = {
  items: [],
  isLoading: false,
  listTitle: 'History',
  itemType: 'items',
  listStyle: {}
};

export default TransactionList;
import React from 'react';
import { List, Card, Typography, Empty, Spin, Tag, Row, Col, Grid, Tooltip } from 'antd';
import { InfoCircleOutlined, DollarCircleOutlined } from '@ant-design/icons';
import { ARIX_DECIMALS } from '../../utils/tonUtils.js';
const USD_DECIMALS = 2;

const { Text, Paragraph, Title } = Typography;
const { useBreakpoint } = Grid;

const getStakeStatusColor = (status) => {
  const s = status?.toLowerCase() || 'unknown';
  if (s === 'active') return 'green';
  if (s.includes('pending_confirmation')) return 'gold';
  if (s.includes('pending_arix_unstake_confirmation')) return 'orange';
  if (s.includes('completed')) return 'blue';
  if (s.includes('early_arix_unstaked') || s.includes('early_unstaked')) return 'volcano';
  if (s.includes('failed')) return 'red';
  return 'default';
};

export const renderStakeHistoryItem = (stake, isMobile) => {
  return (
    <div className="stake-history-item">
      <Row justify="space-between" align="top" gutter={8} style={{ marginBottom: 6 }}>
        <Col flex="auto">
          <Title level={5} style={{color: '#00BFFF', marginBottom: 2, wordBreak: 'break-word', fontSize: isMobile ? '1em' : '1.05em'}}>
              {stake.planTitle || `Stake ID: ${stake.id?.substring(0,8)}...`}
          </Title>
          <Text style={{color: '#8A8A8A', fontSize: '0.8em'}}>
            ARIX Lock Duration: {stake.planDurationDays} Days
          </Text>
        </Col>
        <Col style={{textAlign: 'right'}}>
          <Tag color={getStakeStatusColor(stake.status)} className="status-tag" style={{fontSize: '0.75em'}}>
              {stake.status?.replace(/_/g, ' ').toUpperCase()}
          </Tag>
          {stake.status === 'active' && stake.remainingDays > 0 &&
            <Text style={{fontSize: '0.75em', color: '#777', display: 'block', marginTop: 2}}>{stake.remainingDays} days left</Text>
          }
        </Col>
      </Row>

      <Row gutter={isMobile ? [8, 6] : [16, 6]}>
        <Col xs={24} sm={12}>
            <Paragraph className="history-text-item">
                <InfoCircleOutlined style={{marginRight: 4, color: '#777'}}/> Initial USD Staked:<br/>
                <Text strong style={{color: 'white', fontSize: '1em'}}>${parseFloat(stake.referenceUsdtValueAtStakeTime || 0).toFixed(USD_DECIMALS)} USD</Text>
                <br/><Text style={{color: '#8A8A8A', fontSize: '0.75em'}}>({parseFloat(stake.arixAmountStaked).toFixed(ARIX_DECIMALS)} ARIX principal)</Text>
            </Paragraph>
        </Col>
        <Col xs={24} sm={12}>
            <Paragraph className="history-text-item">
                <DollarCircleOutlined style={{marginRight: 4, color: '#777'}}/> USD Value Reward APR:<br/>
                <Text strong style={{color: '#4CAF50', fontSize: '1em'}}>{parseFloat(stake.usdValueRewardApr || 0).toFixed(2)}%</Text>
                 <br/><Text style={{color: '#8A8A8A', fontSize: '0.75em'}}>Accrued: {parseFloat(stake.accruedArixRewardTotal || 0).toFixed(ARIX_DECIMALS)} ARIX</Text>
            </Paragraph>
        </Col>
      </Row>
       {parseFloat(stake.arixEarlyUnstakePenaltyPercent || 0) > 0 && (
         <Paragraph className="history-text-item">
            ARIX Early Unstake Penalty: <Text style={{color: '#F44336'}}>{parseFloat(stake.arixEarlyUnstakePenaltyPercent).toFixed(2)}%</Text>
        </Paragraph>
      )}
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
              Stake Tx: <Text copyable={{text: stake.onchainStakeTxHash}} style={{color:"#777"}}>{stake.onchainStakeTxHash.substring(0,isMobile ? 6:12)}...</Text>
          </Paragraph>
       )}
      {stake.onchainUnstakeTxHash && (
          <Paragraph className="history-text-item small-text tx-hash">
              ARIX Unstake Tx: <Text copyable={{text: stake.onchainUnstakeTxHash}} style={{color:"#777"}}>{stake.onchainUnstakeTxHash.substring(0,isMobile ? 6:12)}...</Text>
          </Paragraph>
       )}
    </div>
  );
};

export const renderCoinflipHistoryItem = (game, isMobile) => {
  return (
  <div className="game-history-item">
    <Row justify="space-between" align="middle" gutter={8} style={{marginBottom: 4}}>
        <Col>
            <Text strong className={game.outcome === 'win' ? 'game-win' : 'game-loss'} style={{textTransform: 'capitalize', fontSize: isMobile ? '1em' :'1.1em'}}>
              {game.outcome}
            </Text>
        </Col>
        <Col>
            <Text style={{color: '#B0B0B0', fontSize: isMobile ? '0.8em' : '0.85em'}}>
              Choice: {game.choice?.toUpperCase()} (Coin: {game.server_coin_side?.toUpperCase()})
            </Text>
        </Col>
    </Row>
    <Paragraph className="history-text-item">
      Bet Amount: <Text strong style={{color: 'white'}}>{parseFloat(game.bet_amount_arix).toFixed(ARIX_DECIMALS)} ARIX</Text>
    </Paragraph>
    <Paragraph className="history-text-item">
      Result (Delta): <Text strong className={parseFloat(game.amount_delta_arix) > 0 ? 'game-win' : (parseFloat(game.amount_delta_arix) < 0 ? 'game-loss' : '')}>
        {parseFloat(game.amount_delta_arix) > 0 ? '+' : ''}{parseFloat(game.amount_delta_arix).toFixed(ARIX_DECIMALS)} ARIX
      </Text>
    </Paragraph>
    <Paragraph className="history-text-item small-text">
      Played At: {new Date(game.played_at).toLocaleString()}
    </Paragraph>
     {game.game_id && (
        <Paragraph className="history-text-item small-text tx-hash">
            Game ID: <Text copyable={{text: game.game_id}} style={{color:"#777"}}>{game.game_id.substring(0,isMobile ? 6:10)}...</Text>
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
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <Spin size="large" tip={`Loading ${itemType || 'history'}...`} />
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <Card className="dark-card transaction-list-card" style={{marginTop: 15, ...listStyle}}>
        <Empty description={`No ${itemType || 'history'} found.`} image={Empty.PRESENTED_IMAGE_SIMPLE} />
      </Card>
    );
  }

  return (
    <Card className="dark-card transaction-list-card" title={listTitle || `${itemType || 'Items'} History`} style={{marginTop: 15, ...listStyle}}>
      <List
        itemLayout="vertical"
        dataSource={items}
        renderItem={(item, index) => (
          <List.Item
            key={item.id || item.game_id || item.stake_id || index}
            className="transaction-list-item"
            style={{ padding: isMobile ? '10px 0' : '12px 0' }}
          >
            {renderItemDetails(item, isMobile)}
          </List.Item>
        )}
        pagination={{
            pageSize: isMobile ? 3 : 5,
            align: 'center',
            hideOnSinglePage: true,
            showSizeChanger: false,
            simple: isMobile
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
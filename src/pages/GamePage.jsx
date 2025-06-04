
import React, { useState } from 'react';
import { Typography, Card, Grid, Row, Col, Button, Alert } from 'antd';
import {
    ExperimentOutlined, 
    RightCircleOutlined, 
    RiseOutlined, 
    CrownOutlined, 
    BlockOutlined 
} from '@ant-design/icons';
import CoinflipGame from '../components/game/CoinFlipGame'; 
import './GamePage.css'; 

const { Title, Text, Paragraph } = Typography;
const { useBreakpoint } = Grid;

const GamePage = () => {
    const screens = useBreakpoint();
    const isMobile = !screens.md;
    const [showCoinflipGameComponent, setShowCoinflipGameComponent] = useState(false);

    const handlePlayCoinflip = () => {
        setShowCoinflipGameComponent(true);
    };

    const handleBackToGamesList = () => {
        setShowCoinflipGameComponent(false);
    };

    if (showCoinflipGameComponent) {
        
        return <CoinflipGame onBack={handleBackToGamesList} />;
    }

    return (
        <div className="game-page-container">
            <Title level={2} className="page-title">
                <ExperimentOutlined style={{ marginRight: 12 }} />
                Games Center
            </Title>

            <Alert
                message={<Text strong className="banner-message-text">x2 or maybe x256?</Text>}
                description={<Text className="banner-description-text">Play Coinflip and try your luck! Big ARIX rewards await.</Text>}
                type="info"
                showIcon
                icon={<RiseOutlined className="banner-icon"/>}
                className="game-page-banner dark-theme-alert"
                action={
                    <Button
                        type="primary"
                        size="small"
                        onClick={handlePlayCoinflip}
                        className="banner-play-button"
                    >
                        Play Coinflip <RightCircleOutlined />
                    </Button>
                }
            />

            <Paragraph className="game-page-intro-text">
                Exciting games and generous ARIX rewards are waiting for you!
                Take the first step toward victory!
            </Paragraph>

            <Row justify="center" style={{ marginTop: isMobile ? 20 : 30 }}>
                <Col xs={24} sm={20} md={18} lg={14} xl={12}>
                    <Card className="dark-theme-card game-selection-card coinflip-promo-card" hoverable onClick={handlePlayCoinflip}>
                        <Row gutter={isMobile ? 16 : 24} align="middle">
                            <Col xs={24} sm={8} md={7} className="game-promo-image-col">
                                <img
                                    src="/img/coinflip-card-mascot.png"
                                    alt="Coinflip Game Mascot"
                                    className="game-promo-image"
                                    onError={(e) => { e.currentTarget.src = '/img/coin-default-cf.png'; }}
                                />
                            </Col>
                            <Col xs={24} sm={16} md={17} className="game-promo-content-col">
                                <Title level={3} className="game-promo-title">COINFLIP</Title>
                                <Paragraph className="game-promo-description">
                                    Heads or Tails? Make a choice and increase your balance up to x2! Take a risk and win ARIX!
                                </Paragraph>
                                <Button
                                    type="primary"
                                    className="game-promo-button"
                                    size="large"
                                    icon={<RightCircleOutlined />}
                                >
                                    Test Your Luck
                                </Button>
                            </Col>
                        </Row>
                    </Card>
                </Col>
            </Row>


        </div>
    );
};

export default GamePage;

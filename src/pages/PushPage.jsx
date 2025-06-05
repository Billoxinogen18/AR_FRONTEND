import React, { useState, useEffect, useCallback } from 'react';
import { Typography, Button, Modal, Alert, Spin, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import {
    ArrowDownOutlined,
    ArrowUpOutlined,
    RightCircleOutlined,
    CloseOutlined,
    CopyOutlined,
    InfoCircleOutlined,
    DollarCircleOutlined
} from '@ant-design/icons';
import { useTonAddress } from '@tonconnect/ui-react';
import { getUserProfile } from '../services/api';

import './PushPage.css';

const { Title, Text, Paragraph } = Typography;

const ArixPushIcon = () => (
    <img src="/img/arix-diamond.png" alt="ARIX" className="push-page-arix-icon" onError={(e) => { e.currentTarget.src = '/img/fallback-icon.png'; }} />
);

const PROJECT_ARIX_DEPOSIT_ADDRESS = "EQCLU6KIPjZJbhyYlRfENc3nQck2DWulsUq2gJPyWEK9wfDd";

const PushPage = () => {
    const navigate = useNavigate();
    const rawAddress = useTonAddress(false);

    const [wheelState, setWheelState] = useState('IDLE_LIT');
    const [showMainBottomSheet, setShowMainBottomSheet] = useState(false);
    const [animatingWheelCenter, setAnimatingWheelCenter] = useState(false);

    const [showTopUpModal, setShowTopUpModal] = useState(false);
    const [showCashoutModal, setShowCashoutModal] = useState(false);

    const [claimableArix, setClaimableArix] = useState('0');
    const [loadingBalance, setLoadingBalance] = useState(false);

    const numberOfLines = 72;
    const transitionAnimationDuration = 1200;

    const fetchUserArixBalance = useCallback(async () => {
        if (rawAddress) {
            setLoadingBalance(true);
            try {
                const profileRes = await getUserProfile(rawAddress);
                setClaimableArix(Math.floor(parseFloat(profileRes.data?.claimableArixRewards || 0)).toString());
            } catch (error) {
                console.error("Error fetching ARIX balance for Push Page:", error);
                setClaimableArix('0');
            } finally {
                setLoadingBalance(false);
            }
        } else {
            setClaimableArix('0');
        }
    }, [rawAddress]);

    useEffect(() => {
        fetchUserArixBalance();
    }, [fetchUserArixBalance]);

    const handleWheelPress = () => {
        if (wheelState === 'IDLE_LIT') {
            setWheelState('UNFILLING');
            setAnimatingWheelCenter(true);

            setTimeout(() => {
                setWheelState('IDLE_DIM');
                setAnimatingWheelCenter(false);
                setShowMainBottomSheet(true);
            }, transitionAnimationDuration);
        }
    };

    const handleCloseMainBottomSheet = (playCoinflip = false) => {
        setShowMainBottomSheet(false);
        if (wheelState === 'IDLE_DIM') {
            setWheelState('REFILLING');
            setAnimatingWheelCenter(true);

            setTimeout(() => {
                setWheelState('IDLE_LIT');
                setAnimatingWheelCenter(false);
                if (playCoinflip) {
                    navigate('/game');
                }
            }, transitionAnimationDuration);
        } else if (playCoinflip) {
             navigate('/game');
        }
    };

    const copyToClipboard = (textToCopy) => {
        if (!textToCopy || textToCopy === "YOUR_PROJECT_ARIX_DEPOSIT_WALLET_ADDRESS_HERE") {
            message.error('Deposit address not configured.');
            return;
        }
        navigator.clipboard.writeText(textToCopy)
            .then(() => message.success('Address copied to clipboard!'))
            .catch(err => {
                console.error('Failed to copy: ', err);
                message.error('Failed to copy address.');
            });
    };

    let wheelContainerClasses = "push-wheel-container";
    if (animatingWheelCenter) wheelContainerClasses += " animating-center-pulse";
    
    wheelContainerClasses += ` state-${wheelState.toLowerCase()}`;


    return (
        <div className="push-page-container" style={{
            '--number-of-lines': numberOfLines,
            '--transition-animation-duration': `${transitionAnimationDuration}ms`
         }}>
            <div className="push-balance-section">
                <div className="balance-info-box">
                    <div className="balance-amount-line">
                        <div className="balance-icon-wrapper">
                            <span className="balance-icon-representation">♢</span>
                        </div>
                        <Text className="push-balance-amount">
                            {loadingBalance ? <Spin size="small" wrapperClassName="balance-spin" /> : claimableArix}
                        </Text>
                    </div>
                    <Text className="push-balance-currency">ARIX</Text>
                </div>
            </div>

            <div className="push-top-buttons">
                <Button className="push-top-button top-up" onClick={() => setShowTopUpModal(true)}>
                    <ArrowDownOutlined /> Top up
                </Button>
                <Button className="push-top-button cashout" onClick={() => setShowCashoutModal(true)}>
                    <ArrowUpOutlined /> Cashout
                </Button>
            </div>

            <div className="push-banner-container">
                <div className="push-banner-content">
                    <div className="banner-text">
                        <Text className="banner-title">X2 or maybe x256? Play Coinflip and try your luck! →</Text>
                    </div>
                </div>
            </div>

            <div className="push-wheel-area">
                <div
                    className={wheelContainerClasses}
                    onClick={handleWheelPress}
                    role="button"
                    aria-label="Activate Push Wheel"
                    tabIndex={0}
                    onKeyPress={(e) => { if (e.key === 'Enter' || e.key === ' ') handleWheelPress(); }}
                >
                    <div className="push-wheel-outer-ring">
                        {Array.from({ length: numberOfLines }).map((_, index) => (
                            <div
                                key={index}
                                className="wheel-tick"
                                style={{
                                    transform: `rotate(${index * (360 / numberOfLines)}deg)`,
                                    '--tick-index': index,
                                }}
                            />
                        ))}
                    </div>
                    <div className="push-wheel-center">
                        <div className="wheel-center-icon">
                            <div className="pixel-icon">
                                <div className="pixel-row">
                                    <div className="pixel empty"></div><div className="pixel filled"></div><div className="pixel filled"></div><div className="pixel empty"></div>
                                </div>
                                <div className="pixel-row">
                                    <div className="pixel filled"></div><div className="pixel empty"></div><div className="pixel empty"></div><div className="pixel filled"></div>
                                </div>
                                <div className="pixel-row">
                                    <div className="pixel filled"></div><div className="pixel empty"></div><div className="pixel empty"></div><div className="pixel filled"></div>
                                </div>
                                <div className="pixel-row">
                                    <div className="pixel empty"></div><div className="pixel filled"></div><div className="pixel filled"></div><div className="pixel empty"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <Modal
                open={showMainBottomSheet}
                onCancel={() => handleCloseMainBottomSheet(false)}
                footer={null}
                className="push-bottom-sheet-modal"
                closable={false}
                maskClosable={true}
                destroyOnClose
                wrapClassName="push-bottom-sheet-modal-wrapper"
                maskTransitionName=""
                transitionName=""
            >
                <div className="push-bottom-sheet-content">
                    <Button
                        shape="circle"
                        icon={<CloseOutlined />}
                        className="close-bottom-sheet-button"
                        onClick={() => handleCloseMainBottomSheet(false)}
                        aria-label="Close"
                    />
                    <Title level={3} className="bottom-sheet-title">Pushing season is over!</Title>
                    <Paragraph className="bottom-sheet-text">
                        Terminal Station continues to follow its roadmap.
                    </Paragraph>
                    <div className="bottom-sheet-next-steps">
                        <Text strong className="next-steps-title"><RightCircleOutlined style={{ marginRight: 8, color: '#FFD700' }} />Next steps</Text>
                        <ol className="next-steps-list">
                            <li>New phase</li>
                            <li>Developing existing games and adding new ones to the Game Center</li>
                            <li>Expanding into new markets</li>
                        </ol>
                    </div>
                    <Paragraph className="bottom-sheet-text coinflip-prompt">
                        In the meantime, try your luck in Coinflip! Can you turn your ARIX bet into x256?
                    </Paragraph>
                    <Button type="primary" size="large" block className="play-coinflip-button-sheet" onClick={() => handleCloseMainBottomSheet(true)}>
                        Play Coinflip!
                    </Button>
                </div>
            </Modal>

            <Modal
                open={showTopUpModal}
                onCancel={() => setShowTopUpModal(false)}
                footer={null}
                className="push-topup-modal"
                closable={false}
                maskClosable={true}
                centered
                destroyOnClose
                wrapClassName="push-topup-modal-wrapper"
                width={400}
            >
                <div className="push-topup-content">
                    <Button
                        shape="circle"
                        icon={<CloseOutlined />}
                        className="close-topup-button"
                        onClick={() => setShowTopUpModal(false)}
                        aria-label="Close Top up"
                    />
                    <div className="topup-modal-header">
                        <ArixPushIcon />
                        <Title level={4} className="topup-modal-title">Balance</Title>
                    </div>
                    <div className="topup-modal-actions">
                        <Button className="push-top-button top-up active">
                            <ArrowDownOutlined /> Top up
                        </Button>
                        <Button className="push-top-button cashout" onClick={() => { setShowTopUpModal(false); setShowCashoutModal(true); }}>
                            <ArrowUpOutlined /> Cashout
                        </Button>
                    </div>
                    <Alert
                        message="Send only ARIX assets to this address"
                        description="Other assets will be irrevocably lost."
                        type="warning"
                        showIcon
                        icon={<InfoCircleOutlined />}
                        className="topup-warning-alert"
                    />
                    <div className="topup-instructions">
                        <Text className="instruction-link" onClick={() => message.info("How it works: Coming soon!")}>How it works <RightCircleOutlined /></Text>
                        <Text className="instruction-link" onClick={() => message.info("Instructions: Coming soon!")}>Instruction</Text>
                    </div>
                    <Paragraph className="address-label">ADDRESS</Paragraph>
                    <div className="address-display-box">
                        <Text className="deposit-address-text" copyable={{ text: PROJECT_ARIX_DEPOSIT_ADDRESS, tooltips: ['Copy', 'Copied!'] }}>
                            {PROJECT_ARIX_DEPOSIT_ADDRESS}
                        </Text>
                    </div>
                    <Paragraph className="fee-info-text">
                        A fee of <Text strong>0.05 ARIX</Text> is applied to all deposits. <Text strong>MEMO is not required</Text>
                    </Paragraph>
                    <Paragraph className="min-deposit-info">
                        <InfoCircleOutlined /> Deposit minimum <Text strong>1 ARIX</Text>
                    </Paragraph>
                    <Button
                        type="primary"
                        block
                        icon={<CopyOutlined />}
                        className="copy-address-button"
                        onClick={() => copyToClipboard(PROJECT_ARIX_DEPOSIT_ADDRESS)}
                    >
                        Copy address
                    </Button>
                </div>
            </Modal>

            <Modal
                open={showCashoutModal}
                onCancel={() => setShowCashoutModal(false)}
                footer={null}
                className="push-cashout-modal"
                closable={false}
                maskClosable={true}
                centered
                destroyOnClose
                wrapClassName="push-cashout-modal-wrapper"
                width={400}
            >
                <div className="push-cashout-content">
                    <Button
                        shape="circle"
                        icon={<CloseOutlined />}
                        className="close-cashout-button"
                        onClick={() => setShowCashoutModal(false)}
                        aria-label="Close Cashout"
                    />
                    <div className="cashout-modal-header">
                        <ArixPushIcon />
                        <Title level={4} className="cashout-modal-title">Balance</Title>
                    </div>
                    <div className="cashout-modal-actions">
                        <Button className="push-top-button top-up" onClick={() => { setShowCashoutModal(false); setShowTopUpModal(true); }}>
                            <ArrowDownOutlined /> Top up
                        </Button>
                        <Button className="push-top-button cashout active">
                            <ArrowUpOutlined /> Cashout
                        </Button>
                    </div>
                    <Alert
                        message="ARIX withdrawal is only possible after playing at least one Coinflip game."
                        type="error"
                        showIcon
                        icon={<DollarCircleOutlined />}
                        className="cashout-condition-alert"
                        action={
                            <Button type="primary" size="small" className="cashout-play-button" onClick={() => { setShowCashoutModal(false); navigate('/game'); }}>
                                Play
                            </Button>
                        }
                    />
                </div>
            </Modal>
        </div>
    );
};

export default PushPage;
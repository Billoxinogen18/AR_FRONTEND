// File: AR_FRONTEND/src/pages/UserPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Typography, Tabs, message, Spin, Button, Grid, Card, Modal, Alert, Empty, Select, Divider } from 'antd';
import { useTonAddress, useTonConnectUI } from '@tonconnect/ui-react';
import { useNavigate } from 'react-router-dom';
import {
    UserOutlined,
    WalletOutlined,
    LinkOutlined,
    HistoryOutlined,
    ExperimentOutlined,
    // DollarCircleOutlined, // Used in UserProfileCard
    // RocketOutlined, // Not directly used here, maybe in modal
    // InfoCircleOutlined, // Used in UserProfileCard
    InteractionOutlined // For unstake action
} from '@ant-design/icons';

import UserProfileCard from '../components/user/UserProfileCard';
import TransactionList, { renderStakeHistoryItem, renderCoinflipHistoryItem } from '../components/user/TransactionList';
import {
    getUserProfile,
    getUserStakesAndRewards,
    getCoinflipHistoryForUser,
    getUserReferralData,
    initiateArixUnstake,
    confirmArixUnstake
} from '../services/api';
import { getArxUsdtPriceFromBackend } from '../services/priceServiceFrontend';
// ARIX_DECIMALS, USDT_DECIMALS are used in child components or can be imported if needed here
import { toNano, Cell } from '@ton/core';
import { waitForTransactionConfirmation } from '../utils/tonUtils';

import './UserPage.css';

const { Title, Text, Paragraph } = Typography;
// const { TabPane } = Tabs; // items prop is preferred now
const { Option } = Select;
const { useBreakpoint } = Grid;

const UserPage = () => {
    const userFriendlyAddress = useTonAddress();
    const rawAddress = useTonAddress(false);
    const [tonConnectUI] = useTonConnectUI();
    const navigate = useNavigate();

    const [userProfile, setUserProfile] = useState(null);
    const [referralDashboardData, setReferralDashboardData] = useState(null);
    const [stakesAndRewards, setStakesAndRewards] = useState({ stakes: [], totalClaimableUsdt: '0.00', totalClaimableArix: '0.00' });
    const [coinflipHistory, setCoinflipHistory] = useState([]);

    const [loadingProfile, setLoadingProfile] = useState(true);
    const [loadingReferral, setLoadingReferral] = useState(true);
    const [loadingStakes, setLoadingStakes] = useState(true);
    const [loadingGames, setLoadingGames] = useState(true);

    const [activeTabKey, setActiveTabKey] = useState('stakes');
    const [currentArxPrice, setCurrentArxPrice] = useState(null);

    const [isUnstakeModalVisible, setIsUnstakeModalVisible] = useState(false);
    const [selectedStakeForUnstake, setSelectedStakeForUnstake] = useState(null);
    const [unstakePrepDetails, setUnstakePrepDetails] = useState(null);
    const [isUnstakeActionLoading, setIsUnstakeActionLoading] = useState(false);
    const [stakeToSelectForUnstakeId, setStakeToSelectForUnstakeId] = useState(undefined);


    const screens = useBreakpoint();
    const isMobile = !screens.md;

    const fetchAllUserData = useCallback(async (showMessages = false) => {
        if (!rawAddress) {
            setUserProfile(null);
            setReferralDashboardData(null);
            setStakesAndRewards({ stakes: [], totalClaimableUsdt: '0.00', totalClaimableArix: '0.00' });
            setCoinflipHistory([]);
            setCurrentArxPrice(null);
            setLoadingProfile(false); setLoadingReferral(false); setLoadingStakes(false); setLoadingGames(false);
            return;
        }

        setLoadingProfile(true); setLoadingReferral(true); setLoadingStakes(true); setLoadingGames(true);
        const loadingKey = 'fetchAllUserDataUserPage';
        if (showMessages) message.loading({ content: 'Refreshing dashboard data...', key: loadingKey, duration: 0 });

        try {
            const tgLaunchParams = new URLSearchParams(window.location.search);
            const refCodeFromUrl = tgLaunchParams.get('ref') || localStorage.getItem('arixReferralCode');

            const profilePromise = getUserProfile(rawAddress, {
                telegram_id: window.Telegram?.WebApp?.initDataUnsafe?.user?.id,
                username: window.Telegram?.WebApp?.initDataUnsafe?.user?.username,
                referrer: refCodeFromUrl
            });
            const referralPromise = getUserReferralData(rawAddress);
            const stakesPromise = getUserStakesAndRewards(rawAddress);
            const gamesPromise = getCoinflipHistoryForUser(rawAddress);
            const pricePromise = getArxUsdtPriceFromBackend();

            const [profileRes, referralRes, stakesRes, gamesRes, priceRes] = await Promise.all([
                profilePromise, referralPromise, stakesPromise, gamesPromise, pricePromise
            ]);

            setUserProfile(profileRes.data);
            setReferralDashboardData(referralRes.data);
            setStakesAndRewards({
                stakes: stakesRes.data?.stakes || [],
                totalClaimableUsdt: stakesRes.data?.totalClaimableUsdt || '0.00',
                totalClaimableArix: stakesRes.data?.totalClaimableArix || '0.00'
            });
            setCoinflipHistory(gamesRes.data || []);
            setCurrentArxPrice(priceRes);

            if (showMessages) message.success({ content: "Dashboard data refreshed!", key: loadingKey, duration: 2 });
            else message.destroy(loadingKey);

        } catch (error) {
            console.error("Error fetching user dashboard data:", error);
            if (showMessages) message.error({ content: error?.response?.data?.message || "Failed to refresh some dashboard data.", key: loadingKey, duration: 3 });
            else message.destroy(loadingKey);
            if (!userProfile) setUserProfile(null);
            if (!referralDashboardData) setReferralDashboardData(null);
            if (!stakesAndRewards.stakes.length) setStakesAndRewards({ stakes: [], totalClaimableUsdt: '0.00', totalClaimableArix: '0.00' });
            if (!coinflipHistory.length) setCoinflipHistory([]);
            if (!currentArxPrice) setCurrentArxPrice(null);
        } finally {
            setLoadingProfile(false); setLoadingReferral(false); setLoadingStakes(false); setLoadingGames(false);
        }
    }, [rawAddress]);

    useEffect(() => {
        fetchAllUserData();
    }, [fetchAllUserData]);

    const handleTabChange = (key) => {
        setActiveTabKey(key);
    };

    const activeUserStakes = stakesAndRewards.stakes.filter(s => s.status === 'active');

    const initiateUnstakeProcessFromCardOrList = (stakeToUnstake = null) => {
        if (activeUserStakes.length === 0) {
            message.info("You have no active stakes to unstake.");
            return;
        }
        if (stakeToUnstake) {
            prepareForUnstakeModal(stakeToUnstake);
        } else {
            if (activeUserStakes.length === 1) {
                prepareForUnstakeModal(activeUserStakes[0]);
            } else {
                setSelectedStakeForUnstake(null);
                setStakeToSelectForUnstakeId(undefined);
                setUnstakePrepDetails(null);
                setIsUnstakeModalVisible(true);
            }
        }
    };

    const prepareForUnstakeModal = async (stake) => {
        if (!rawAddress || !stake) {
            message.error("User or stake information is missing for unstake preparation.");
            return;
        }
        setSelectedStakeForUnstake(stake);
        setIsUnstakeActionLoading(true);
        const prepKey = 'unstakePrepUserPage';
        message.loading({ content: 'Preparing unstake information...', key: prepKey, duration: 0 });
        try {
            const response = await initiateArixUnstake({ userWalletAddress: rawAddress, stakeId: stake.id });
            setUnstakePrepDetails(response.data);
            setIsUnstakeModalVisible(true);
            message.destroy(prepKey);
        } catch (error) {
            message.error({ content: error?.response?.data?.message || "Failed to prepare unstake.", key: prepKey, duration: 3 });
            console.error("Prepare unstake error:", error);
            setSelectedStakeForUnstake(null);
        } finally {
            setIsUnstakeActionLoading(false);
        }
    };

    const handleModalUnstakeSelectionChange = (stakeId) => {
        const stake = activeUserStakes.find(s => s.id === stakeId);
        if (stake) {
            setStakeToSelectForUnstakeId(stakeId);
            prepareForUnstakeModal(stake);
        }
    };

    const handleConfirmUnstakeInModal = async () => {
        if (!rawAddress || !selectedStakeForUnstake || !unstakePrepDetails || !tonConnectUI) {
            message.error("Missing critical information for unstake operation. Please select a stake if prompted.");
            return;
        }
        setIsUnstakeActionLoading(true);
        const loadingMessageKey = 'unstakeConfirmActionUserPage';
        message.loading({ content: 'Please confirm ARIX unstake in your wallet...', key: loadingMessageKey, duration: 0 });

        try {
            const scStakeIdentifierToWithdraw = selectedStakeForUnstake.id
                .replace(/-/g, '').substring(0, 16);

            const unstakePayloadBuilder = new Cell().asBuilder();
            unstakePayloadBuilder.storeUint(BigInt(Date.now()), 64);
            unstakePayloadBuilder.storeUint(BigInt('0x' + scStakeIdentifierToWithdraw), 64);

            const transaction = {
                validUntil: Math.floor(Date.now() / 1000) + 360,
                messages: [{
                    address: import.meta.env.VITE_STAKING_CONTRACT_ADDRESS,
                    amount: toNano("0.05").toString(),
                    payload: unstakePayloadBuilder.asCell().toBoc().toString("base64")
                }],
            };

            const result = await tonConnectUI.sendTransaction(transaction);

            message.loading({ content: 'Unstake transaction sent, awaiting confirmation...', key: loadingMessageKey, duration: 0 });
            const externalMessageCell = Cell.fromBase64(result.boc);
            const txHash = await waitForTransactionConfirmation(rawAddress, externalMessageCell, 180000, 5000);

            if (!txHash) {
                throw new Error('Failed to confirm unstake transaction on blockchain. Please check your wallet activity.');
            }

            message.loading({ content: 'Transaction confirmed! Finalizing ARIX unstake with backend...', key: loadingMessageKey, duration: 0 });
            await confirmArixUnstake({
                userWalletAddress: rawAddress,
                stakeId: selectedStakeForUnstake.id,
                unstakeTransactionBoc: result.boc,
                unstakeTransactionHash: txHash
            });
            message.success({ content: "ARIX unstake request submitted! Backend will verify the outcome.", key: loadingMessageKey, duration: 7 });

            setIsUnstakeModalVisible(false);
            setSelectedStakeForUnstake(null);
            setUnstakePrepDetails(null);
            setStakeToSelectForUnstakeId(undefined);
            fetchAllUserData(false);
        } catch (txError) {
            message.error({ content: txError?.response?.data?.message || txError?.message || 'ARIX unstake failed.', key: loadingMessageKey, duration: 6 });
            console.error("On-chain ARIX Unstake Tx Error:", txError);
        } finally {
            setIsUnstakeActionLoading(false);
        }
    };

    const combinedLoading = loadingProfile || loadingReferral || loadingStakes || loadingGames;

    const tabItems = [
        {
            key: 'stakes',
            label: <span className="user-tab-label"><HistoryOutlined /> Staking History</span>,
            children: (
                <TransactionList
                    items={stakesAndRewards.stakes}
                    isLoading={loadingStakes}
                    renderItemDetails={renderStakeHistoryItem}
                    itemType="staking activity"
                    listTitle={null}
                    onUnstakeItemClick={prepareForUnstakeModal}
                />
            ),
        },
        {
            key: 'games',
            label: <span className="user-tab-label"><ExperimentOutlined /> Game History</span>,
            children: (
                <TransactionList
                    items={coinflipHistory}
                    isLoading={loadingGames}
                    renderItemDetails={renderCoinflipHistoryItem}
                    itemType="Coinflip game"
                    listTitle={null}
                />
            ),
        },
    ];

    return (
        <div className="user-page-container">
            <Title level={2} className="page-title">
                <UserOutlined style={{ marginRight: 10 }} /> User Dashboard
            </Title>

            <UserProfileCard
                userProfileData={userProfile}
                referralData={referralDashboardData}
                activeStakes={activeUserStakes}
                currentArxPrice={currentArxPrice}
                onRefreshAllData={fetchAllUserData}
                isDataLoading={combinedLoading}
                onInitiateUnstakeProcess={initiateUnstakeProcessFromCardOrList}
            />

            <Divider className="user-page-divider"><Text className="divider-text">ACTIVITY LOGS</Text></Divider>

            <Tabs
                activeKey={activeTabKey}
                items={tabItems}
                onChange={handleTabChange}
                centered
                className="dark-theme-tabs user-history-tabs"
                size={isMobile ? 'small' : 'middle'}
            />

            <Modal
                title={
                    <Text className="modal-title-text">
                        {selectedStakeForUnstake && unstakePrepDetails ? 'Confirm ARIX Principal Unstake' : 'Select Active Stake to Unstake'}
                    </Text>
                }
                open={isUnstakeModalVisible}
                onOk={selectedStakeForUnstake && unstakePrepDetails ? handleConfirmUnstakeInModal : () => message.info("Please select a stake from the list if shown.")}
                onCancel={() => {
                    setIsUnstakeModalVisible(false);
                    setSelectedStakeForUnstake(null);
                    setUnstakePrepDetails(null);
                    setStakeToSelectForUnstakeId(undefined);
                    setIsUnstakeActionLoading(false);
                }}
                confirmLoading={isUnstakeActionLoading}
                okText={selectedStakeForUnstake && unstakePrepDetails ? "Proceed with Unstake" : "Confirm Selection"}
                cancelText="Cancel"
                className="dark-theme-modal unstake-confirm-modal"
                destroyOnClose
                centered
                okButtonProps={{
                    danger: selectedStakeForUnstake && unstakePrepDetails?.isEarly,
                    disabled: (!selectedStakeForUnstake || !unstakePrepDetails) && activeUserStakes.length > 1
                }}
                width={isMobile ? '90%' : 520}
            >
                {activeUserStakes.length > 1 && !selectedStakeForUnstake && !unstakePrepDetails && (
                    <div className="stake-selection-modal-content">
                        <Paragraph className="modal-text">You have multiple active stakes. Please select which one you'd like to unstake:</Paragraph>
                        <Select
                            placeholder="Select an active stake to view unstake details"
                            style={{ width: '100%', marginBottom: 20 }}
                            onChange={handleModalUnstakeSelectionChange}
                            value={stakeToSelectForUnstakeId}
                            size="large"
                            className="themed-select"
                            showSearch
                            optionFilterProp="children"
                        >
                            {activeUserStakes.map(stake => (
                                <Option key={stake.id} value={stake.id}>
                                    {stake.planTitle} - {parseFloat(stake.arixAmountStaked).toFixed(4)} ARIX (Unlocks: {new Date(stake.unlockTimestamp).toLocaleDateString()})
                                </Option>
                            ))}
                        </Select>
                        <Paragraph className="modal-text small-note">Once selected, unstake details and confirmation will appear below if preparation is successful.</Paragraph>
                    </div>
                )}
                {selectedStakeForUnstake && unstakePrepDetails ? (
                    <div className="unstake-details-modal-content">
                        <Paragraph className="modal-text">{unstakePrepDetails.message}</Paragraph>
                        <Descriptions column={1} bordered size="small" className="modal-descriptions">
                            <Descriptions.Item label="Plan">{selectedStakeForUnstake.planTitle}</Descriptions.Item>
                            <Descriptions.Item label="ARIX Principal Staked">{unstakePrepDetails.principalArix} ARIX</Descriptions.Item>
                            {unstakePrepDetails.isEarly &&
                                <Descriptions.Item label="Early Unstake Penalty">
                                    <Text style={{color: '#F44336'}}>{unstakePrepDetails.arixPenaltyPercentApplied}% of principal</Text>
                                </Descriptions.Item>
                            }
                        </Descriptions>
                        <Alert
                            message="Important Note"
                            description="This action only unstakes your ARIX principal from the smart contract. Your accrued USDT rewards are separate and can be withdrawn from your dashboard once they meet the minimum threshold."
                            type="info"
                            showIcon
                            style={{marginTop: 16}}
                            className="modal-alert"
                        />
                    </div>
                ) : (activeUserStakes.length === 1 && !unstakePrepDetails && isUnstakeActionLoading) || (selectedStakeForUnstake && !unstakePrepDetails && isUnstakeActionLoading) ? (
                    <div style={{textAlign: 'center', padding: '20px'}}><Spin tip="Loading unstake details..."/></div>
                ) : null}
            </Modal>
        </div>
    );
};

export default UserPage;
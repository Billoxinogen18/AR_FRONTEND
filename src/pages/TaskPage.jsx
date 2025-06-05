import React, { useState, useEffect, useCallback } from 'react';
import { List, Card, Button, Typography, Spin, message, Modal, Input, Empty, Tag, Tooltip, Row, Col, Grid, Alert } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined, ExclamationCircleOutlined, LinkOutlined, SendOutlined, RedoOutlined, WalletOutlined, ArrowDownOutlined, ArrowUpOutlined } from '@ant-design/icons';
import { useTonAddress, useTonConnectUI } from '@tonconnect/ui-react';
import { getActiveTasks, submitTaskCompletion, getUserTaskHistory, getUserProfile } from '../services/api';
import { ARIX_DECIMALS } from '../utils/tonUtils';
import { useNavigate } from 'react-router-dom';
import './TaskPage.css';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { useBreakpoint } = Grid;

const TaskPage = () => {
    const [tasks, setTasks] = useState([]);
    const [userTaskHistory, setUserTaskHistory] = useState([]);
    const [loadingTasks, setLoadingTasks] = useState(true);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [submissionInput, setSubmissionInput] = useState('');
    const [submitLoading, setSubmitLoading] = useState(false);

    const [claimableArix, setClaimableArix] = useState('0');
    const [loadingBalance, setLoadingBalance] = useState(false);

    const userFriendlyAddress = useTonAddress();
    const rawAddress = useTonAddress(false);
    const [tonConnectUI] = useTonConnectUI();
    const navigate = useNavigate();
    const screens = useBreakpoint();
    const isMobile = !screens.md; // Consider using this for responsive adjustments

    const fetchUserArixBalance = useCallback(async () => {
        if (rawAddress) {
            setLoadingBalance(true);
            try {
                const profileRes = await getUserProfile(rawAddress);
                setClaimableArix(Math.floor(parseFloat(profileRes.data?.claimableArixRewards || 0)).toString());
            } catch (error) {
                // console.error("Error fetching ARIX balance for Task Page:", error);
            } finally {
                setLoadingBalance(false);
            }
        } else {
            setClaimableArix('0');
        }
    }, [rawAddress]);

    const fetchTasks = useCallback(async () => {
        setLoadingTasks(true);
        try {
            const response = await getActiveTasks(rawAddress || undefined);
            setTasks(response.data || []);
        } catch (error) {
            message.error("Failed to load tasks.");
        } finally {
            setLoadingTasks(false);
        }
    }, [rawAddress]);

    const fetchUserHistory = useCallback(async () => {
        if (!rawAddress) {
            setUserTaskHistory([]);
            return;
        }
        setLoadingHistory(true);
        try {
            const response = await getUserTaskHistory(rawAddress);
            setUserTaskHistory(response.data || []);
        } catch (error) {
            message.error("Failed to load your task history.");
        } finally {
            setLoadingHistory(false);
        }
    }, [rawAddress]);

    useEffect(() => {
        fetchTasks();
        fetchUserArixBalance();
        if (userFriendlyAddress) {
            fetchUserHistory();
        } else {
            setUserTaskHistory([]);
        }
    }, [userFriendlyAddress, fetchTasks, fetchUserHistory, fetchUserArixBalance]);

    const handleRefreshAll = () => {
        fetchTasks();
        fetchUserArixBalance();
        if (userFriendlyAddress) {
            fetchUserHistory();
        } else {
            message.info("Connect wallet to see your task history.")
        }
    }

    const handleTaskAction = (task) => {
        if (!userFriendlyAddress) {
            message.warn("Please connect your wallet to participate in tasks.");
            tonConnectUI.openModal();
            return;
        }
        setSelectedTask(task);
        if (task.validation_type === 'link_submission' || task.validation_type === 'text_submission') {
            setIsModalVisible(true);
        } else if (task.validation_type === 'auto_approve') {
            handleModalSubmit();
        } else if (task.action_url) {
            window.open(task.action_url, '_blank');
            setIsModalVisible(true);
        } else {
             setIsModalVisible(true);
        }
    };

    const handleModalSubmit = async () => {
        if (!selectedTask || !rawAddress) return;

        setSubmitLoading(true);
        const loadingMessageKey = 'taskSubmit';
        message.loading({ content: `Submitting task '${selectedTask.title}'...`, key: loadingMessageKey, duration: 0});

        let submissionPayload = {};
        if (selectedTask.validation_type === 'link_submission') {
            if (!submissionInput || !(submissionInput.startsWith('http://') || submissionInput.startsWith('https://'))) {
                message.error({ content: 'Please enter a valid link (http:// or https://).', key: loadingMessageKey, duration: 3 });
                setSubmitLoading(false);
                return;
            }
            submissionPayload = { link: submissionInput };
        } else if (selectedTask.validation_type === 'text_submission') {
             submissionPayload = { text: submissionInput };
        }

        try {
            const response = await submitTaskCompletion(selectedTask.task_id, {
                userWalletAddress: rawAddress,
                submissionData: Object.keys(submissionPayload).length > 0 ? submissionPayload : null,
            });
            message.success({ content: response.data.message || 'Task submitted successfully!', key: loadingMessageKey, duration: 4 });
            setIsModalVisible(false);
            setSubmissionInput('');
            setSelectedTask(null);
            fetchTasks();
            fetchUserHistory();
            fetchUserArixBalance();
        } catch (error) {
            message.error({ content: error?.response?.data?.message || 'Task submission failed.', key: loadingMessageKey, duration: 4 });
        } finally {
            setSubmitLoading(false);
        }
    };

    const getTaskStatusTag = (task) => {
        const statusText = task.user_status?.replace(/_/g, ' ').toUpperCase();
        if (task.user_status === 'completed' || task.user_status === 'reward_credited') {
            return <Tag icon={<CheckCircleOutlined />} color="success">{statusText}</Tag>;
        }
        if (task.user_status === 'pending_verification' || task.user_status === 'approved') {
            return <Tag icon={<ClockCircleOutlined />} color="processing">{statusText}</Tag>;
        }
        if (task.user_status === 'rejected') {
            return <Tag icon={<ExclamationCircleOutlined />} color="error">{statusText}</Tag>;
        }
        return null;
    };

    const getHistoryStatusTag = (status) => {
        const statusText = status?.replace(/_/g, ' ').toUpperCase();
        if (status === 'reward_credited' || status === 'completed') return <Tag color="success">{statusText}</Tag>;
        if (status === 'approved') return <Tag color="blue">{statusText}</Tag>;
        if (status === 'pending_verification') return <Tag color="gold">{statusText}</Tag>;
        if (status === 'rejected') return <Tag color="error">{statusText}</Tag>;
        return <Tag>{statusText}</Tag>;
    };

    const renderTaskItem = (task) => (
        <List.Item className="task-list-item">
            <Card
                className="dark-theme-card"
                title={<Text className="text-primary-light" style={{fontWeight: '600', fontSize:'1.05rem'}}>{task.title}</Text>}
                extra={getTaskStatusTag(task)}
                style={{height: '100%', display: 'flex', flexDirection: 'column'}}
            >
                <div style={{flexGrow: 1}}>
                    <Paragraph className="task-description">{task.description}</Paragraph>
                </div>
                <Row justify="space-between" align="middle" style={{marginTop: 'auto', paddingTop: 12}}>
                    <Col>
                        <Text strong className="task-reward-text">
                            Reward: {parseFloat(task.reward_arix_amount).toFixed(ARIX_DECIMALS)} ARIX
                        </Text>
                    </Col>
                    <Col>
                        {task.can_attempt ? (
                            <Button
                                type="primary"
                                className="task-action-button"
                                icon={task.action_url && task.validation_type !== 'auto_approve' ? <LinkOutlined /> : <SendOutlined />}
                                onClick={() => handleTaskAction(task)}
                                disabled={!userFriendlyAddress}
                                size="middle"
                            >
                                {task.validation_type === 'auto_approve' && !task.action_url ? 'Claim' :
                                (task.action_url && (task.validation_type === 'auto_approve' || !task.validation_type.includes('submission')) ? 'Visit & Claim' :
                                (task.action_url ? 'Go to Task' : 'Submit Proof'))}
                            </Button>
                        ) : (
                            <Button disabled type="dashed" size="middle" className="task-disabled-button">
                                {(task.user_status === 'pending_verification' || task.user_status === 'approved') ? 'Pending' : 'Completed'}
                            </Button>
                        )}
                    </Col>
                </Row>
                 {task.action_url && task.can_attempt && task.validation_type !== 'auto_approve' && (
                     <Text className="task-sub-note">
                         Perform action at link, then confirm or submit proof.
                     </Text>
                 )}
            </Card>
        </List.Item>
    );

    const renderHistoryItem = (item) => (
        <List.Item className="history-list-item">
             <Card size="small" className="dark-theme-card">
                <Row justify="space-between" align="top" gutter={[8,4]}>
                    <Col xs={24} sm={16}>
                        <Text strong className="task-title-history">{item.title}</Text>
                        <Paragraph className="submission-date">
                            Submitted: {new Date(item.completed_at).toLocaleString()}
                        </Paragraph>
                        {item.submission_data?.link && <Text className="submission-details-text">Link: <a href={item.submission_data.link} target="_blank" rel="noopener noreferrer">{item.submission_data.link.substring(0,isMobile? 25 : 40)}...</a></Text>}
                        {item.submission_data?.text && <Text className="submission-details-text">Details: {item.submission_data.text.substring(0,isMobile ? 30 : 50)}...</Text>}
                    </Col>
                    <Col xs={24} sm={8} style={{textAlign: isMobile ? 'left' : 'right', marginTop: isMobile ? 8 : 0}}>
                        {getHistoryStatusTag(item.status)}
                        <Text block className="reward-history-text" style={{ marginTop: 4}}>
                            + {parseFloat(item.reward_arix_amount).toFixed(ARIX_DECIMALS)} ARIX
                        </Text>
                    </Col>
                </Row>
                {item.notes && <Paragraph className="notes-history-text" style={{ marginTop: 5}}>Note: {item.notes}</Paragraph>}
            </Card>
        </List.Item>
    );

    return (
        <div className="task-page-container">
            <div className="page-header-section">
                <div className="balance-display-box">
                    <div className="balance-amount-line">
                        <div className="balance-icon-wrapper">
                            <span className="balance-icon-representation">♢</span>
                        </div>
                        <Text className="balance-amount-value">
                            {loadingBalance ? <Spin size="small" wrapperClassName="balance-spin"/> : claimableArix}
                        </Text>
                    </div>
                    <Text className="balance-currency-label">ARIX</Text>
                </div>
                <div className="topup-cashout-buttons">
                    <Button icon={<ArrowDownOutlined />} onClick={() => message.info("Top up ARIX (Coming Soon)")}>Top up</Button>
                    <Button icon={<ArrowUpOutlined />} onClick={() => message.info("Cash out ARIX (Coming Soon)")}>Cashout</Button>
                </div>
                <div className="page-banner" onClick={() => navigate('/game')}>
                    <Text className="page-banner-text">X2 or maybe x256? Play Coinflip and try your luck! →</Text>
                </div>
            </div>

            <Title level={2} className="task-page-title">ARIX Tasks</Title>

            {!userFriendlyAddress && !loadingTasks && (
                 <Alert
                    message="Connect Wallet to Participate"
                    description="Please connect your TON wallet to view personalized task statuses, submit tasks, and claim ARIX rewards."
                    type="info"
                    showIcon
                    style={{marginBottom: 24, marginLeft: isMobile ? 0 : 0, marginRight: isMobile ? 0: 0}}
                    action={
                        <Button size="small" type="primary" onClick={() => tonConnectUI.openModal()}>
                            Connect Wallet
                        </Button>
                    }
                />
            )}

            <div style={{textAlign:'right', marginBottom: loadingTasks && tasks.length === 0 ? 0 : 20, paddingRight: isMobile? 0:0 }}>
                <Button icon={<RedoOutlined/>} onClick={handleRefreshAll} loading={loadingTasks || loadingHistory}>Refresh Tasks</Button>
            </div>

            {loadingTasks && tasks.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 50 }}><Spin size="large" tip="Loading Available Tasks..." /></div>
            ) : tasks.length > 0 ? (
                <List
                    grid={{ gutter: isMobile ? 16 : 24, xs: 1, sm: 1, md: 2, lg:2, xl:3 }}
                    dataSource={tasks}
                    renderItem={renderTaskItem}
                    style={{padding: isMobile? '0' : '0'}}
                />
            ) : (
                !loadingTasks && <Card className="dark-theme-card" style={{textAlign:'center', padding: '30px', margin: isMobile ? '0' : '0'}}><Empty description={<Text className="text-secondary-light">No active tasks available. Check back soon!</Text>} /></Card>
            )}

            {userFriendlyAddress && (userTaskHistory.length > 0 || loadingHistory) && (
                <div style={{marginTop: 40, padding: isMobile? '0' : '0'}}>
                    <Title level={3} className="section-title" style={{textAlign: 'center', marginBottom: 24}}>Your Task History</Title>
                    {loadingHistory ? (
                        <div style={{ textAlign: 'center', padding: 30 }}><Spin tip="Loading your history..." /></div>
                    ) : userTaskHistory.length > 0 ? (
                         <List
                            dataSource={userTaskHistory}
                            renderItem={renderHistoryItem}
                        />
                    ) : (
                        <Card className="dark-theme-card" style={{textAlign:'center', padding: '20px'}}><Empty description={<Text className="text-secondary-light">You haven't completed any tasks yet.</Text>} /></Card>
                    )}
                </div>
            )}

            <Modal
                title={<Text className="task-modal-title">Submit Task: {selectedTask?.title}</Text>}
                open={isModalVisible}
                onOk={handleModalSubmit}
                onCancel={() => { setIsModalVisible(false); setSubmissionInput(''); setSelectedTask(null); }}
                confirmLoading={submitLoading}
                okText="Submit"
                destroyOnClose
            >
                {selectedTask && (
                    <>
                        <Paragraph className="task-modal-text">{selectedTask.description}</Paragraph>
                        <Paragraph strong className="task-modal-reward">Reward: {parseFloat(selectedTask.reward_arix_amount).toFixed(ARIX_DECIMALS)} ARIX</Paragraph>

                        {selectedTask.validation_type === 'link_submission' && (
                            <Input
                                prefix={<LinkOutlined />}
                                placeholder="Paste your submission link here (e.g., post URL)"
                                value={submissionInput}
                                onChange={(e) => setSubmissionInput(e.target.value)}
                                style={{marginTop: 12}}
                            />
                        )}
                        {selectedTask.validation_type === 'text_submission' && (
                            <TextArea
                                rows={3}
                                placeholder="Enter your submission details here"
                                value={submissionInput}
                                onChange={(e) => setSubmissionInput(e.target.value)}
                                style={{marginTop: 12}}
                            />
                        )}
                        {(selectedTask.validation_type === 'auto_approve' || (selectedTask.action_url && !(selectedTask.validation_type === 'link_submission' || selectedTask.validation_type === 'text_submission'))) && (
                             <Paragraph className="task-modal-text" style={{marginTop:12, fontSize:'0.9rem', opacity:0.7}}>
                                {selectedTask.action_url ?
                                 `Please ensure you have completed the action at the provided link.` :
                                 `This task will be automatically processed.`}
                                {selectedTask.action_url && <div className="task-modal-url"><Text className="text-secondary-light">Task URL:</Text> <a href={selectedTask.action_url} target="_blank" rel="noopener noreferrer"> {selectedTask.action_url}</a></div>}
                                <br/>Click "Submit" to confirm your completion.
                             </Paragraph>
                        )}
                    </>
                )}
            </Modal>
        </div>
    );
};

export default TaskPage;

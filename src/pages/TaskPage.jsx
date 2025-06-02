// File: AR_Proj/AR_FRONTEND/src/pages/TaskPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { List, Card, Button, Typography, Spin, message, Modal, Input, Empty, Tag, Tooltip, Row, Col, Grid } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined, ExclamationCircleOutlined, LinkOutlined, SendOutlined, RedoOutlined } from '@ant-design/icons';
import { useTonAddress, useTonConnectUI } from '@tonconnect/ui-react';
import { getActiveTasks, submitTaskCompletion, getUserTaskHistory } from '../services/api';
import { ARIX_DECIMALS } from '../utils/tonUtils';

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

    const userFriendlyAddress = useTonAddress();
    const rawAddress = useTonAddress(false);
    const [tonConnectUI] = useTonConnectUI();
    const screens = useBreakpoint();
    const isMobile = !screens.md;

    const fetchTasks = useCallback(async () => {
        if (!rawAddress && !userFriendlyAddress) { // Allow fetching general tasks even if not connected
             console.log("[TaskPage] No wallet connected, fetching general active tasks.");
        }
        setLoadingTasks(true);
        try {
            // Pass rawAddress if available to get user-specific completion status
            const response = await getActiveTasks(rawAddress || undefined); 
            setTasks(response.data || []);
        } catch (error) {
            message.error("Failed to load tasks.");
            console.error("Fetch tasks error:", error);
        } finally {
            setLoadingTasks(false);
        }
    }, [rawAddress, userFriendlyAddress]);

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
            console.error("Fetch task history error:", error);
        } finally {
            setLoadingHistory(false);
        }
    }, [rawAddress]);

    useEffect(() => {
        fetchTasks();
        if (userFriendlyAddress) {
            fetchUserHistory();
        } else {
            setUserTaskHistory([]); // Clear history if wallet disconnects
        }
    }, [userFriendlyAddress, fetchTasks, fetchUserHistory]);

    const handleRefreshAll = () => {
        fetchTasks();
        if (userFriendlyAddress) {
            fetchUserHistory();
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
            // Directly submit for auto_approve tasks
            handleModalSubmit(); 
        } else if (task.action_url) {
            // For tasks with an action_url (like "visit page"), open the URL.
            // Submission might still be manual or a separate "I've done this" button.
            // For MVP, opening URL and then allowing manual submission via modal is one way.
            window.open(task.action_url, '_blank');
            // Optionally, still open modal for confirmation if needed, or have a different flow
            // For now, let's assume after visiting, they might need to click a submit button that opens modal.
            // Or, if it's just "visit", the backend might auto-approve on click (more complex).
            // Let's assume for now that even for action_url, they might come back and click a submit button.
            // So, we can open the modal for them to confirm completion.
            setIsModalVisible(true); // Open modal to confirm they've done the action_url task
        } else {
            // Default to opening modal for other types or if logic is complex
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
            if (!submissionInput || !submissionInput.startsWith('http')) {
                message.error({ content: 'Please enter a valid link (http/https).', key: loadingMessageKey, duration: 3 });
                setSubmitLoading(false);
                return;
            }
            submissionPayload = { link: submissionInput };
        } else if (selectedTask.validation_type === 'text_submission') {
             submissionPayload = { text: submissionInput };
        }
        // For 'auto_approve' or action_url confirmations, submissionPayload might be empty or predefined

        try {
            const response = await submitTaskCompletion(selectedTask.task_id, {
                userWalletAddress: rawAddress,
                submissionData: Object.keys(submissionPayload).length > 0 ? submissionPayload : null,
            });
            message.success({ content: response.data.message || 'Task submitted successfully!', key: loadingMessageKey, duration: 4 });
            setIsModalVisible(false);
            setSubmissionInput('');
            setSelectedTask(null);
            // Refresh tasks (to update status) and user history
            fetchTasks(); 
            fetchUserHistory();
        } catch (error) {
            message.error({ content: error?.response?.data?.message || 'Task submission failed.', key: loadingMessageKey, duration: 4 });
            console.error("Submit task error:", error);
        } finally {
            setSubmitLoading(false);
        }
    };

    const getTaskStatusTag = (task) => {
        if (task.user_status === 'completed' || task.user_status === 'reward_credited') {
            return <Tag icon={<CheckCircleOutlined />} color="success">Completed</Tag>;
        }
        if (task.user_status === 'pending_verification') {
            return <Tag icon={<ClockCircleOutlined />} color="processing">Pending</Tag>;
        }
        if (task.user_status === 'rejected') {
            return <Tag icon={<ExclamationCircleOutlined />} color="error">Rejected</Tag>;
        }
        return null; // Not started or can attempt again
    };
    
    const getHistoryStatusTag = (status) => {
        if (status === 'reward_credited') return <Tag color="success">REWARD CREDITED</Tag>;
        if (status === 'approved') return <Tag color="blue">APPROVED</Tag>;
        if (status === 'pending_verification') return <Tag color="gold">PENDING</Tag>;
        if (status === 'rejected') return <Tag color="error">REJECTED</Tag>;
        return <Tag>{status?.toUpperCase()}</Tag>;
    };


    const renderTaskItem = (task) => (
        <List.Item className="task-list-item">
            <Card 
                className="neumorphic-glass-card" 
                title={<Text style={{color: '#00adee', fontWeight: 'bold'}}>{task.title}</Text>}
                extra={getTaskStatusTag(task)}
            >
                <Paragraph style={{color: '#ccc', minHeight: '40px'}}>{task.description}</Paragraph>
                <Row justify="space-between" align="middle" style={{marginTop: 10}}>
                    <Col>
                        <Text strong style={{color: '#52c41a', fontSize: '1.1em'}}>
                            Reward: {parseFloat(task.reward_arix_amount).toFixed(2)} ARIX
                        </Text>
                    </Col>
                    <Col>
                        {task.can_attempt ? (
                            <Button 
                                type="primary" 
                                icon={task.action_url ? <LinkOutlined /> : <SendOutlined />}
                                onClick={() => handleTaskAction(task)}
                                disabled={!userFriendlyAddress}
                            >
                                {task.validation_type === 'auto_approve' && !task.action_url ? 'Claim Reward' : (task.action_url ? 'Go to Task' : 'Submit')}
                            </Button>
                        ) : (
                            <Button disabled type="dashed">{task.user_status === 'pending_verification' ? 'Pending' : 'Completed'}</Button>
                        )}
                    </Col>
                </Row>
                 {task.action_url && task.can_attempt && task.validation_type !== 'auto_approve' && (
                     <Text type="secondary" style={{fontSize: '0.8em', display:'block', marginTop: 5}}>
                         You might need to perform an action at the link, then submit proof or confirm completion.
                     </Text>
                 )}
            </Card>
        </List.Item>
    );

    const renderHistoryItem = (item) => (
        <List.Item className="history-list-item">
             <Card size="small" className="neumorphic-glass-card-inner">
                <Row justify="space-between" align="top">
                    <Col xs={24} sm={16}>
                        <Text strong style={{color: '#00adee'}}>{item.title}</Text>
                        <Paragraph style={{color: '#aaa', fontSize: '0.9em', marginBottom: 4}}>
                            Submitted: {new Date(item.completed_at).toLocaleString()}
                        </Paragraph>
                        {item.submission_data?.link && <Text style={{color: '#ccc'}}>Link: <a href={item.submission_data.link} target="_blank" rel="noopener noreferrer" style={{color: '#00adee'}}>{item.submission_data.link.substring(0,30)}...</a></Text>}
                        {item.submission_data?.text && <Text style={{color: '#ccc'}}>Submission: {item.submission_data.text.substring(0,50)}...</Text>}
                    </Col>
                    <Col xs={24} sm={8} style={{textAlign: isMobile ? 'left' : 'right', marginTop: isMobile ? 8 : 0}}>
                        {getHistoryStatusTag(item.status)}
                        <Text block style={{color: '#52c41a', fontSize: '0.9em', marginTop: 4}}>
                            + {parseFloat(item.reward_arix_amount).toFixed(2)} ARIX
                        </Text>
                    </Col>
                </Row>
                {item.notes && <Paragraph style={{color: '#888', fontSize: '0.8em', marginTop: 5}}>Note: {item.notes}</Paragraph>}
            </Card>
        </List.Item>
    );


    if (!userFriendlyAddress && loadingTasks) { // Show loading only if not connected and still fetching general tasks
        return <div style={{ textAlign: 'center', padding: 50 }}><Spin size="large" tip="Loading Tasks..." /></div>;
    }
    
    return (
        <div style={{ padding: isMobile ? '16px' : '24px', maxWidth: '960px', margin: '0 auto' }}>
            <Title level={2} style={{ color: 'white', textAlign: 'center', marginBottom: isMobile ? '20px' : '30px', fontWeight: 'bold' }}>
                ARIX Tasks Center
            </Title>

            {!userFriendlyAddress && (
                 <Alert
                    message="Connect Wallet to Participate"
                    description="Please connect your TON wallet to view personalized task statuses, submit tasks, and claim ARIX rewards."
                    type="info"
                    showIcon
                    className="glass-pane-alert"
                    style={{marginBottom: 20}}
                    action={
                        <Button size="small" type="primary" onClick={() => tonConnectUI.openModal()}>
                            Connect Wallet
                        </Button>
                    }
                />
            )}
            
            <div style={{textAlign:'right', marginBottom: 16}}>
                <Button icon={<RedoOutlined/>} onClick={handleRefreshAll} loading={loadingTasks || loadingHistory}>Refresh</Button>
            </div>


            {loadingTasks && tasks.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 50 }}><Spin size="large" tip="Loading Available Tasks..." /></div>
            ) : tasks.length > 0 ? (
                <List
                    grid={{ gutter: 16, xs: 1, sm: 1, md: 2, lg: 2, xl: 2, xxl: 2 }}
                    dataSource={tasks}
                    renderItem={renderTaskItem}
                />
            ) : (
                !loadingTasks && <Card className="neumorphic-glass-card"><Empty description="No active tasks available right now. Check back soon!" /></Card>
            )}

            {userFriendlyAddress && (
                <div style={{marginTop: 40}}>
                    <Title level={3} style={{color: 'white', textAlign: 'center', marginBottom: 20}}>Your Task History</Title>
                    {loadingHistory ? (
                        <div style={{ textAlign: 'center', padding: 30 }}><Spin tip="Loading your history..." /></div>
                    ) : userTaskHistory.length > 0 ? (
                         <List
                            dataSource={userTaskHistory}
                            renderItem={renderHistoryItem}
                            className="history-list-container"
                        />
                    ) : (
                        <Card className="neumorphic-glass-card"><Empty description="You haven't completed any tasks yet." /></Card>
                    )}
                </div>
            )}

            <Modal
                title={<Text style={{color: '#00adee', fontWeight: 'bold'}}>Submit Task: {selectedTask?.title}</Text>}
                open={isModalVisible}
                onOk={handleModalSubmit}
                onCancel={() => { setIsModalVisible(false); setSubmissionInput(''); setSelectedTask(null); }}
                confirmLoading={submitLoading}
                okText="Submit"
                className="glass-pane"
                destroyOnClose
            >
                {selectedTask && (
                    <>
                        <Paragraph style={{color: '#ccc'}}>{selectedTask.description}</Paragraph>
                        <Paragraph strong style={{color: '#52c41a'}}>Reward: {parseFloat(selectedTask.reward_arix_amount).toFixed(2)} ARIX</Paragraph>
                        
                        {selectedTask.validation_type === 'link_submission' && (
                            <Input 
                                prefix={<LinkOutlined style={{color: '#aaa'}}/>}
                                placeholder="Paste your submission link here (e.g., Twitter post, Telegram profile)" 
                                value={submissionInput} 
                                onChange={(e) => setSubmissionInput(e.target.value)} 
                                style={{marginTop: 10}}
                            />
                        )}
                        {selectedTask.validation_type === 'text_submission' && (
                            <TextArea 
                                rows={3}
                                placeholder="Enter your submission details here" 
                                value={submissionInput} 
                                onChange={(e) => setSubmissionInput(e.target.value)} 
                                style={{marginTop: 10}}
                            />
                        )}
                        {(selectedTask.validation_type === 'auto_approve' || selectedTask.action_url) && ! (selectedTask.validation_type === 'link_submission' || selectedTask.validation_type === 'text_submission') && (
                             <Paragraph style={{color: '#aaa', marginTop:10}}>
                                {selectedTask.action_url ? 
                                 `Please ensure you have completed the action at: ` : 
                                 `This task will be automatically processed.`}
                                {selectedTask.action_url && <a href={selectedTask.action_url} target="_blank" rel="noopener noreferrer" style={{color: '#00adee'}}> {selectedTask.action_url}</a>}
                                <br/>Click "Submit" to confirm completion.
                             </Paragraph>
                        )}
                    </>
                )}
            </Modal>
        </div>
    );
};

export default TaskPage;
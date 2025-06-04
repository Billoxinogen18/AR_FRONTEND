
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
        setLoadingTasks(true);
        try {
            const response = await getActiveTasks(rawAddress || undefined); 
            setTasks(response.data || []);
        } catch (error) {
            message.error("Failed to load tasks.");
            console.error("Fetch tasks error:", error);
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
            setUserTaskHistory([]);
        }
    }, [userFriendlyAddress, fetchTasks, fetchUserHistory]);

    const handleRefreshAll = () => {
        fetchTasks();
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
        } catch (error) {
            message.error({ content: error?.response?.data?.message || 'Task submission failed.', key: loadingMessageKey, duration: 4 });
            console.error("Submit task error:", error);
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
        if (status === 'reward_credited' || status === 'completed') return <Tag color="success" style={{fontWeight: '500'}}>{statusText}</Tag>;
        if (status === 'approved') return <Tag color="blue" style={{fontWeight: '500'}}>{statusText}</Tag>;
        if (status === 'pending_verification') return <Tag color="gold" style={{fontWeight: '500'}}>{statusText}</Tag>;
        if (status === 'rejected') return <Tag color="error" style={{fontWeight: '500'}}>{statusText}</Tag>;
        return <Tag style={{fontWeight: '500'}}>{statusText}</Tag>;
    };


    const renderTaskItem = (task) => (
        <List.Item className="task-list-item">
            <Card 
                className="dark-theme-card" 
                title={<Text style={{color: '#ffffff', fontWeight: '600', fontSize:'1.05rem'}}>{task.title}</Text>}
                extra={getTaskStatusTag(task)}
                style={{height: '100%', display: 'flex', flexDirection: 'column'}} 
            >
                <div style={{flexGrow: 1}}> {}
                    <Paragraph className="task-description">{task.description}</Paragraph>
                </div>
                <Row justify="space-between" align="middle" style={{marginTop: 'auto', paddingTop: 12}}> {}
                    <Col>
                        <Text strong style={{color: '#4CAF50', fontSize: '1.1rem'}}>
                            Reward: {parseFloat(task.reward_arix_amount).toFixed(ARIX_DECIMALS)} ARIX
                        </Text>
                    </Col>
                    <Col>
                        {task.can_attempt ? (
                            <Button 
                                type="primary" 
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
                            <Button disabled type="dashed" size="middle">
                                {(task.user_status === 'pending_verification' || task.user_status === 'approved') ? 'Pending' : 'Completed'}
                            </Button>
                        )}
                    </Col>
                </Row>
                 {task.action_url && task.can_attempt && task.validation_type !== 'auto_approve' && (
                     <Text type="secondary" style={{fontSize: '0.8em', display:'block', marginTop: 8, color: '#8e8e93'}}>
                         Perform action at link, then confirm or submit proof.
                     </Text>
                 )}
            </Card>
        </List.Item>
    );

    const renderHistoryItem = (item) => (
        <List.Item className="history-list-item">
             <Card size="small" className="dark-theme-card" style={{borderColor: '#2a2a2a'}}>
                <Row justify="space-between" align="top" gutter={[8,4]}>
                    <Col xs={24} sm={16}>
                        <Text strong style={{color: '#e0e0e5', fontSize:'1rem'}}>{item.title}</Text>
                        <Paragraph style={{color: '#a0a0a5', fontSize: '0.85em', marginBottom: 4}}>
                            Submitted: {new Date(item.completed_at).toLocaleString()}
                        </Paragraph>
                        {item.submission_data?.link && <Text style={{color: '#8e8e93', fontSize:'0.8em'}}>Link: <a href={item.submission_data.link} target="_blank" rel="noopener noreferrer" style={{color: '#7e73ff'}}>{item.submission_data.link.substring(0,isMobile? 25 : 40)}...</a></Text>}
                        {item.submission_data?.text && <Text style={{color: '#8e8e93', fontSize:'0.8em'}}>Details: {item.submission_data.text.substring(0,isMobile ? 30 : 50)}...</Text>}
                    </Col>
                    <Col xs={24} sm={8} style={{textAlign: isMobile ? 'left' : 'right', marginTop: isMobile ? 8 : 0}}>
                        {getHistoryStatusTag(item.status)}
                        <Text block style={{color: '#4CAF50', fontSize: '0.9em', marginTop: 4, fontWeight:'500'}}>
                            + {parseFloat(item.reward_arix_amount).toFixed(ARIX_DECIMALS)} ARIX
                        </Text>
                    </Col>
                </Row>
                {item.notes && <Paragraph style={{color: '#6a6a6e', fontSize: '0.8em', marginTop: 5, fontStyle:'italic'}}>Note: {item.notes}</Paragraph>}
            </Card>
        </List.Item>
    );

    return (
        <div style={{ padding: isMobile ? '0px' : '0px' }}>
            <Title level={2} className="page-title">ARIX Tasks</Title>

            {!userFriendlyAddress && !loadingTasks && (
                 <Alert
                    message="Connect Wallet to Participate"
                    description="Please connect your TON wallet to view personalized task statuses, submit tasks, and claim ARIX rewards."
                    type="info"
                    showIcon
                    className="dark-theme-alert"
                    style={{marginBottom: 24, marginLeft: isMobile ? 16 : 0, marginRight: isMobile ? 16: 0}}
                    action={
                        <Button size="small" type="primary" onClick={() => tonConnectUI.openModal()}>
                            Connect Wallet
                        </Button>
                    }
                />
            )}
            
            <div style={{textAlign:'right', marginBottom: 20, paddingRight: isMobile? 16:0 }}>
                <Button icon={<RedoOutlined/>} onClick={handleRefreshAll} loading={loadingTasks || loadingHistory}>Refresh Tasks</Button>
            </div>

            {loadingTasks && tasks.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 50 }}><Spin size="large" tip="Loading Available Tasks..." /></div>
            ) : tasks.length > 0 ? (
                <List
                    grid={{ gutter: isMobile ? 16 : 24, xs: 1, sm: 1, md: 2 }}
                    dataSource={tasks}
                    renderItem={renderTaskItem}
                    style={{padding: isMobile? '0 16px' : '0'}}
                />
            ) : (
                !loadingTasks && <Card className="dark-theme-card" style={{textAlign:'center', padding: '30px', margin: isMobile ? '0 16px' : '0'}}><Empty description={<Text style={{color: '#a0a0a5'}}>No active tasks available. Check back soon!</Text>} /></Card>
            )}

            {userFriendlyAddress && (
                <div style={{marginTop: 40, padding: isMobile? '0 16px' : '0'}}>
                    <Title level={3} className="section-title" style={{textAlign: 'center', marginBottom: 24}}>Your Task History</Title>
                    {loadingHistory ? (
                        <div style={{ textAlign: 'center', padding: 30 }}><Spin tip="Loading your history..." /></div>
                    ) : userTaskHistory.length > 0 ? (
                         <List
                            dataSource={userTaskHistory}
                            renderItem={renderHistoryItem}
                        />
                    ) : (
                        <Card className="dark-theme-card" style={{textAlign:'center', padding: '20px'}}><Empty description={<Text style={{color: '#a0a0a5'}}>You haven't completed any tasks yet.</Text>} /></Card>
                    )}
                </div>
            )}

            <Modal
                title={<Text style={{color: '#7e73ff', fontWeight: 'bold'}}>Submit Task: {selectedTask?.title}</Text>}
                open={isModalVisible}
                onOk={handleModalSubmit}
                onCancel={() => { setIsModalVisible(false); setSubmissionInput(''); setSelectedTask(null); }}
                confirmLoading={submitLoading}
                okText="Submit"
                className="dark-theme-modal" 
                destroyOnClose
            >
                {selectedTask && (
                    <>
                        <Paragraph style={{color: '#d1d1d6'}}>{selectedTask.description}</Paragraph>
                        <Paragraph strong style={{color: '#4CAF50', fontSize: '1.05rem'}}>Reward: {parseFloat(selectedTask.reward_arix_amount).toFixed(ARIX_DECIMALS)} ARIX</Paragraph>
                        
                        {selectedTask.validation_type === 'link_submission' && (
                            <Input 
                                prefix={<LinkOutlined style={{color: '#6a6a6e'}}/>}
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
                             <Paragraph style={{color: '#a0a0a5', marginTop:12, fontSize:'0.9rem'}}>
                                {selectedTask.action_url ? 
                                 `Please ensure you have completed the action at the provided link.` : 
                                 `This task will be automatically processed.`}
                                {selectedTask.action_url && <div><Text>Task URL:</Text> <a href={selectedTask.action_url} target="_blank" rel="noopener noreferrer" style={{color: '#7e73ff', wordBreak:'break-all'}}> {selectedTask.action_url}</a></div>}
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
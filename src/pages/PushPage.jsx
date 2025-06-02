// File: AR_Proj/AR_FRONTEND/src/pages/PushPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { List, Card, Typography, Spin, message, Empty, Tag, Button, Grid, Image as AntImage } from 'antd';
import { BellOutlined, TagOutlined, CalendarOutlined, LinkOutlined, RedoOutlined } from '@ant-design/icons';
import { getAnnouncements } from '../services/api'; // Ensure this is added to api.js

const { Title, Text, Paragraph } = Typography;
const { useBreakpoint } = Grid;

const PushPage = () => {
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const screens = useBreakpoint();
    const isMobile = !screens.md;

    const fetchAnnouncementsData = useCallback(async () => {
        setLoading(true);
        try {
            const response = await getAnnouncements();
            setAnnouncements(response.data || []);
        } catch (error) {
            message.error("Failed to load announcements.");
            console.error("Fetch announcements error:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAnnouncementsData();
    }, [fetchAnnouncementsData]);

    const renderAnnouncementItem = (item) => (
        <List.Item>
            <Card 
                className="neumorphic-glass-card announcement-card"
                title={
                    <div style={{display: 'flex', alignItems: 'center'}}>
                        {item.is_pinned && <Tag color="#00adee" style={{marginRight: 8}}>PINNED</Tag>}
                        <Text style={{color: '#00adee', fontWeight: 'bold', fontSize: '1.1em'}}>{item.title}</Text>
                    </div>
                }
            >
                {item.image_url && (
                    <div style={{ textAlign: 'center', marginBottom: 16 }}>
                        <AntImage 
                            src={item.image_url} 
                            alt={item.title} 
                            style={{ maxHeight: isMobile ? '150px' : '200px', borderRadius: '8px', objectFit: 'cover' }} 
                            preview={false} // Can enable preview if desired
                            fallback="/img/arix_logo_placeholder_event.png" // Add a placeholder
                        />
                    </div>
                )}
                <Paragraph style={{color: '#ccc', whiteSpace: 'pre-wrap'}}>{item.content}</Paragraph>
                <div style={{marginTop: 15, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px'}}>
                    <div>
                        {item.type && <Tag icon={<TagOutlined />} color="blue" style={{marginRight: 5}}>{item.type.toUpperCase()}</Tag>}
                        <Tag icon={<CalendarOutlined />}>{new Date(item.published_at).toLocaleDateString()}</Tag>
                    </div>
                    {item.action_url && (
                        <Button 
                            type="primary" 
                            href={item.action_url} 
                            target="_blank" 
                            icon={<LinkOutlined />}
                        >
                            {item.action_text || 'Learn More'}
                        </Button>
                    )}
                </div>
            </Card>
        </List.Item>
    );

    return (
        <div style={{ padding: isMobile ? '16px' : '24px', maxWidth: '960px', margin: '0 auto' }}>
            <Title level={2} style={{ color: 'white', textAlign: 'center', marginBottom: isMobile ? '20px' : '30px', fontWeight: 'bold' }}>
                <BellOutlined style={{marginRight: 10}} /> Platform Updates & News
            </Title>

            <div style={{textAlign:'right', marginBottom: 16}}>
                <Button icon={<RedoOutlined/>} onClick={fetchAnnouncementsData} loading={loading}>Refresh</Button>
            </div>

            {loading ? (
                 <div style={{ textAlign: 'center', padding: 50 }}><Spin size="large" tip="Loading Announcements..." /></div>
            ) : announcements.length > 0 ? (
                <List
                    itemLayout="vertical"
                    dataSource={announcements}
                    renderItem={renderAnnouncementItem}
                    className="announcements-list"
                />
            ) : (
                <Card className="neumorphic-glass-card">
                    <Empty description="No announcements available at the moment. Stay tuned!" />
                </Card>
            )}
        </div>
    );
};

export default PushPage;
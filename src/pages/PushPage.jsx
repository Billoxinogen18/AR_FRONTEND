import React, { useState, useEffect, useCallback } from 'react';
import { List, Card, Typography, Spin, message, Empty, Tag, Button, Grid, Image as AntImage } from 'antd';
import { BellOutlined, TagOutlined, CalendarOutlined, LinkOutlined, RedoOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { getAnnouncements } from '../services/api';

const { Title, Text, Paragraph } = Typography;
const { useBreakpoint } = Grid;

const PushPage = () => {
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const screens = useBreakpoint();
    const isMobile = !screens.md;
    const showBigIcon = announcements.length === 0;

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
        <List.Item style={{ padding: '8px 0' }}>
            <Card
                className="dark-card announcement-card"
                title={
                    <div style={{display: 'flex', alignItems: 'center'}}>
                        {item.is_pinned && <Tag color="#00BFFF" style={{marginRight: 8}}>PINNED</Tag>}
                        <Text style={{color: '#00BFFF', fontWeight: 'bold', fontSize: '1.05em'}}>{item.title}</Text>
                    </div>
                }
                style={{width: '100%'}}
            >
                {item.image_url && (
                    <div style={{ textAlign: 'center', marginBottom: 12 }}>
                        <AntImage
                            src={item.image_url}
                            alt={item.title}
                            style={{ maxHeight: isMobile ? '120px' : '180px', borderRadius: '6px', objectFit: 'cover', width: '100%' }}
                            preview={false}
                            fallback="/your-arix-icon.png"
                        />
                    </div>
                )}
                <Paragraph style={{color: '#B0B0B0', whiteSpace: 'pre-wrap', fontSize: '0.9em'}}>{item.content}</Paragraph>
                <div style={{marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px'}}>
                    <div>
                        {item.type && <Tag icon={<TagOutlined />} color="blue" style={{marginRight: 5, fontSize: '0.75em'}}>{item.type.toUpperCase()}</Tag>}
                        <Tag icon={<CalendarOutlined />} style={{fontSize: '0.75em'}}>{new Date(item.published_at).toLocaleDateString()}</Tag>
                    </div>
                    {item.action_url && (
                        <Button
                            type="primary"
                            href={item.action_url}
                            target="_blank"
                            icon={<LinkOutlined />}
                            size="small"
                        >
                            {item.action_text || 'Learn More'}
                        </Button>
                    )}
                </div>
            </Card>
        </List.Item>
    );

    return (
        <div style={{ padding: isMobile ? '12px' : '16px', maxWidth: '960px', margin: '0 auto' }}>
            {!showBigIcon && (
                <Title level={3} style={{ color: 'white', textAlign: 'center', marginBottom: isMobile ? '15px' : '20px', fontWeight: 'bold' }}>
                    <BellOutlined style={{marginRight: 10}} /> Platform Updates & News
                </Title>
            )}

            {showBigIcon && !loading && (
                <div style={{ textAlign: 'center', padding: '30px 0' }}>
                     <ThunderboltOutlined style={{ fontSize: '80px', color: '#00BFFF', opacity: 0.6, marginBottom: 20 }} className="push-page-image" />
                     <Title level={3} style={{color: '#00BFFF'}}>Push Notifications</Title>
                     <Paragraph style={{color: '#8A8A8A'}}>
                        Stay tuned for important updates and announcements!
                     </Paragraph>
                </div>
            )}


            <div style={{textAlign:'right', marginBottom: 12}}>
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
                    split={false}
                />
            ) : (
                !showBigIcon && <Card className="dark-card"><Empty description="No announcements available at the moment." /></Card>
            )}
        </div>
    );
};

export default PushPage;
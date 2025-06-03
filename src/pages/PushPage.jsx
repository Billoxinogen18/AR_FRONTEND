// File: AR_FRONTEND/src/pages/PushPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { List, Card, Typography, Spin, message, Empty, Tag, Button, Grid, Image as AntImage, Row, Col } from 'antd';
import { BellOutlined, TagOutlined, CalendarOutlined, LinkOutlined, RedoOutlined } from '@ant-design/icons';
import { getAnnouncements } from '../services/api'; 

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
        <List.Item className="announcement-list-item">
            <Card 
                className="dark-theme-card" 
                title={
                    <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                        {item.is_pinned && <Tag color="#7e73ff" style={{fontWeight:'bold'}}>PINNED</Tag>}
                        <Text style={{color: '#ffffff', fontWeight: '600', fontSize: '1.05rem'}}>{item.title}</Text>
                    </div>
                }
            >
                {item.image_url && (
                    <div style={{ textAlign: 'center', marginBottom: 12, overflow: 'hidden', borderRadius: '8px' }}>
                        <AntImage 
                            src={item.image_url} 
                            alt={item.title} 
                            style={{ width: '100%', maxHeight: isMobile ? '180px' : '220px', objectFit: 'cover' }} 
                            preview={false}
                            fallback="/img/arix_logo_placeholder_event.png" 
                        />
                    </div>
                )}
                <Paragraph style={{color: '#d1d1d6', whiteSpace: 'pre-wrap', fontSize: '0.9rem'}}>{item.content}</Paragraph>
                <Row justify="space-between" align="middle" style={{marginTop: 16}} gutter={[8,8]}>
                    <Col>
                        {item.type && <Tag icon={<TagOutlined />} color="blue" style={{marginRight: 5, fontSize:'0.75rem'}}>{item.type.toUpperCase()}</Tag>}
                        <Tag icon={<CalendarOutlined />} style={{fontSize:'0.75rem'}}>{new Date(item.published_at).toLocaleDateString()}</Tag>
                    </Col>
                    {item.action_url && (
                       <Col>
                        <Button 
                            type="primary" 
                            href={item.action_url} 
                            target="_blank" 
                            icon={<LinkOutlined />}
                            size="small"
                        >
                            {item.action_text || 'Learn More'}
                        </Button>
                       </Col>
                    )}
                </Row>
            </Card>
        </List.Item>
    );

    return (
        <div style={{ padding: isMobile ? '0px' : '0px' }}> {/* Reduced padding */}
            <Title level={2} className="page-title">
                <BellOutlined style={{marginRight: 10}} /> Updates & News
            </Title>

            <div style={{textAlign:'right', marginBottom: 16, paddingRight: isMobile? 16:0 }}>
                <Button icon={<RedoOutlined/>} onClick={fetchAnnouncementsData} loading={loading}>Refresh</Button>
            </div>

            {loading ? (
                 <div style={{ textAlign: 'center', padding: 50 }}><Spin size="large" tip="Loading Announcements..." /></div>
            ) : announcements.length > 0 ? (
                <List
                    grid={{ gutter: 16, xs: 1, sm: 1, md: 1, lg: 2 }} 
                    dataSource={announcements}
                    renderItem={renderAnnouncementItem}
                    className="announcements-list"
                    style={{padding: isMobile? '0 16px' : '0'}}
                />
            ) : (
                <Card className="dark-theme-card" style={{textAlign:'center', padding: '30px', margin: isMobile ? '0 16px' : '0'}}>
                     <Empty 
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={
                           <Title level={4} style={{color: '#a0a0a5'}}>So much empty, engage!</Title>
                        }
                    />
                    <Paragraph style={{color: '#8e8e93'}}>No new announcements. Check back soon for updates or explore other sections!</Paragraph>
                </Card>
            )}
        </div>
    );
};

export default PushPage;
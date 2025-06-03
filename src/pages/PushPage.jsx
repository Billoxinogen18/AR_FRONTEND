// File: AR_FRONTEND/src/pages/PushPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { List, Card, Typography, Spin, message, Empty, Tag, Button, Grid, Image as AntImage, Row, Col } from 'antd';
import { BellOutlined, TagOutlined, CalendarOutlined, LinkOutlined, RedoOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { getAnnouncements } from '../services/api'; 

const { Title, Text, Paragraph } = Typography;
const { useBreakpoint } = Grid;

// Based on one of the screenshots for "Push", if announcements are empty, or for a different state:
const PushPlaceholderContent = () => (
  <div className="page-image-container" style={{padding: '20px 0'}}>
      <img src="/img/push-main-placeholder.png" alt="Push center graphic" style={{maxWidth: '280px', maxHeight: '280px', objectFit: 'contain'}}/>
      <Title level={3} style={{color: 'white', marginTop: 16, marginBottom: 8}}>Mystery Zone</Title>
      <Paragraph style={{color: '#a0a0a5', fontSize: '1rem', maxWidth: '400px', margin: '0 auto'}}>
          What's that mysterious button? Looks like TopUp & Cashout coming soon to manage your ARIX right here. Stay tuned for updates!
      </Paragraph>
      {/* 
      Example TopUp/Cashout section as in one screenshot:
      <Card className="dark-theme-card" style={{maxWidth: '350px', margin: '24px auto 0 auto'}}>
         <AntdStatistic title={<Text style={{color: '#8e8e93', textAlign:'center', display:'block'}}>TOTAL BALANCE</Text>} value={"0.00"} suffix="TON" valueStyle={{textAlign:'center', fontSize: '1.8em'}}/>
         <Row gutter={16} style={{marginTop: 16}}>
           <Col span={12}>
             <Button block icon={<ArrowDownOutlined />}>Top up</Button>
           </Col>
           <Col span={12}>
             <Button block icon={<ArrowUpOutlined />}>Cashout</Button>
           </Col>
         </Row>
      </Card> 
      */}
  </div>
);


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
                className="dark-theme-card" // Use the new base card style
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
        <div style={{ padding: isMobile ? '16px' : '24px'}}>
            <Title level={2} className="page-title">
                <BellOutlined style={{marginRight: 10}} /> Updates & News
            </Title>

            <div style={{textAlign:'right', marginBottom: 16}}>
                <Button icon={<RedoOutlined/>} onClick={fetchAnnouncementsData} loading={loading}>Refresh</Button>
            </div>

            {loading ? (
                 <div style={{ textAlign: 'center', padding: 50 }}><Spin size="large" tip="Loading Announcements..." /></div>
            ) : announcements.length > 0 ? (
                <List
                    grid={{ gutter: 16, xs: 1, sm: 1, md: 1, lg: 2 }} // Display 2 columns on larger screens
                    dataSource={announcements}
                    renderItem={renderAnnouncementItem}
                    className="announcements-list"
                />
            ) : (
                 // If no announcements, show the placeholder from screenshot for "Push"
                 <PushPlaceholderContent />
                //  <Card className="dark-theme-card" style={{textAlign:'center', padding: '30px'}}>
                //      <Empty description={<Text style={{color:'#a0a0a5'}}>No announcements available at the moment. Stay tuned!</Text>} />
                //  </Card>
            )}
        </div>
    );
};

export default PushPage;
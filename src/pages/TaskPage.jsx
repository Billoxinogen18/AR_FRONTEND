import React from 'react';
import { Typography, Grid, Button } from 'antd';
import { Link } from 'react-router-dom'; // Assuming you might link to tasks later

const { Title, Text, Paragraph } = Typography;
const { useBreakpoint } = Grid;

const TaskPage = () => {
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  return (
    <div style={{
        padding: isMobile ? '20px 12px' : '30px 16px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 'calc(100vh - 56px - 60px - 130px)', // Adjust based on header/footer/balance heights
    }}>
      <img
        src="/img/terminal_character_money.png"
        alt="ARIX Terminal Character with Money"
        style={{
          maxWidth: isMobile ? '280px' : '350px',
          width: '80%',
          marginBottom: '20px',
          filter: 'drop-shadow(0 0 20px rgba(0, 191, 255, 0.2))'
        }}
        onError={(e) => { e.currentTarget.src = 'https://placehold.co/350x300/0D0D0D/1A1A1A?text=Task+Art&font=inter'; }}
      />
        <Title level={3} style={{ color: '#00BFFF', marginBottom: '10px' }}>
            Tasks Coming Soon
        </Title>
        <Paragraph style={{ color: '#8A8A8A', fontSize: isMobile ? '0.9em': '1em', maxWidth: '450px', lineHeight: '1.6' }}>
            Exciting tasks and challenges are being prepared. Complete them to earn ARIX and other rewards. Check back soon for updates!
        </Paragraph>
        {/*
        <Button type="primary" size="large" style={{marginTop: '20px'}} onClick={() => message.info("Task system is under development!")}>
            Notify Me
        </Button>
        */}
    </div>
  );
};

export default TaskPage;
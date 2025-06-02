// File: AR_Proj/AR_FRONTEND/src/components/user/UserProfileCard.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Card, Typography, Button, Spin, message, Tooltip } from 'antd';
import { CopyOutlined, RedoOutlined, GlobalOutlined } from '@ant-design/icons';
import { useTonAddress } from '@tonconnect/ui-react';
import { getJettonWalletAddress, getJettonBalance, fromArixSmallestUnits, ARIX_DECIMALS } from '../../utils/tonUtils'; // Ensure path is correct

const { Text, Paragraph, Title } = Typography;
const ARIX_JETTON_MASTER_ADDRESS = import.meta.env.VITE_ARIX_TOKEN_MASTER_ADDRESS;
const TON_NETWORK = import.meta.env.VITE_TON_NETWORK || "mainnet";

const UserProfileCard = () => {
  const userFriendlyAddress = useTonAddress();
  const rawAddress = useTonAddress(false);
  const [arixBalance, setArixBalance] = useState(0);
  const [loadingBalance, setLoadingBalance] = useState(false);

  const fetchArixBalance = useCallback(async () => {
    if (!rawAddress || !ARIX_JETTON_MASTER_ADDRESS) {
      setArixBalance(0);
      return;
    }
    setLoadingBalance(true);
    try {
      const userArixJettonWallet = await getJettonWalletAddress(rawAddress, ARIX_JETTON_MASTER_ADDRESS);
      if (userArixJettonWallet) {
        const balanceSmallestUnits = await getJettonBalance(userArixJettonWallet);
        setArixBalance(fromArixSmallestUnits(balanceSmallestUnits));
      } else {
        setArixBalance(0);
        // message.info("No ARIX token wallet found for your address."); // Optional user feedback
      }
    } catch (err) {
      console.error("Failed to fetch ARIX balance for profile:", err);
      setArixBalance(0);
      message.error("Could not fetch ARIX balance.");
    } finally {
      setLoadingBalance(false);
    }
  }, [rawAddress]); // Removed ARIX_JETTON_MASTER_ADDRESS from deps as it's from env

  useEffect(() => {
    if (rawAddress) {
      fetchArixBalance();
    }
  }, [rawAddress, fetchArixBalance]);

  const explorerUrl = TON_NETWORK === 'testnet'
    ? `https://testnet.tonscan.org/address/${rawAddress}`
    : `https://tonscan.org/address/${rawAddress}`;

  const handleCopyToClipboard = (textToCopy) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(textToCopy)
        .then(() => message.success('Address copied to clipboard!'))
        .catch(err => message.error('Failed to copy address.'));
    } else {
      // Fallback for environments where clipboard API might not be available (e.g. insecure contexts)
      const textArea = document.createElement("textarea");
      textArea.value = textToCopy;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        message.success('Address copied to clipboard!');
      } catch (err) {
        message.error('Failed to copy address.');
      }
      document.body.removeChild(textArea);
    }
  };

  if (!userFriendlyAddress) {
    // This part might not be directly visible if UserPage itself checks for userFriendlyAddress
    // but good for standalone use or testing.
    return (
      <Card className="neumorphic-glass-card" style={{ marginBottom: 24 }}>
        <Text style={{ color: '#aaa' }}>Please connect your wallet to view profile information.</Text>
      </Card>
    );
  }

  return (
    <Card className="neumorphic-glass-card" style={{ marginBottom: 24 }}>
      <Title level={4} style={{ color: '#00adee', marginBottom: 20 }}>Your ARIX Profile</Title>
      <Spin spinning={loadingBalance} tip="Fetching balance...">
        <Paragraph>
          <Text strong style={{ color: '#aaa' }}>Wallet Address: </Text>
          <Text copyable={{ text: userFriendlyAddress, tooltips: ['Copy', 'Copied!'] }} style={{ color: 'white' }}>
            {`${userFriendlyAddress.slice(0, 6)}...${userFriendlyAddress.slice(-4)}`}
          </Text>
        </Paragraph>
        <Paragraph style={{ wordBreak: 'break-all' }}>
          <Text strong style={{ color: '#aaa' }}>Raw Address: </Text>
          <Text style={{ color: 'white', fontSize: '0.9em' }}>{rawAddress} </Text>
          <Tooltip title="Copy Raw Address">
            <Button 
              icon={<CopyOutlined />} 
              type="text" 
              onClick={() => handleCopyToClipboard(rawAddress)} 
              style={{color: '#00adee', marginLeft: 8, padding: '0 8px'}} 
            />
          </Tooltip>
        </Paragraph>
         <Paragraph>
          <Text strong style={{ color: '#aaa' }}>View on Explorer: </Text>
          <a href={explorerUrl} target="_blank" rel="noopener noreferrer" style={{color: '#00adee'}}>
            <GlobalOutlined style={{marginRight: 4}}/>{TON_NETWORK === 'testnet' ? 'Tonscan (Testnet)' : 'Tonscan (Mainnet)'}
          </a>
        </Paragraph>
        <Title level={3} style={{ color: '#00adee', marginTop: 20, marginBottom: 5 }}>
          {arixBalance.toFixed(ARIX_DECIMALS)} ARIX
        </Title>
        <Button 
          icon={<RedoOutlined />} 
          onClick={fetchArixBalance} 
          loading={loadingBalance} 
          size="small"
          // className="neumorphic-button-default" // If you have a specific class for default neumorphic buttons
        >
          Refresh Balance
        </Button>
      </Spin>
    </Card>
  );
};

export default UserProfileCard;
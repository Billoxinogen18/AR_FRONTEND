const GamePage = () => {
  const screens = useBreakpoint();
  // Example: If GamePage itself needs to fetch overall ARIX balance to pass to games
  // const rawAddress = useTonAddress(false);
  // const [mainArixBalance, setMainArixBalance] = useState(0);
  // useEffect(() => { /* fetch main ARIX balance if needed */ }, [rawAddress]);

  return (
    <div style={{ 
        padding: screens.md ? '24px' : '16px', 
        maxWidth: '900px', // Increased max-width for better layout of game elements
        margin: '0 auto' 
    }}>
      <Title level={2} style={{ 
          color: 'white', textAlign: 'center', 
          marginBottom: screens.md ? '30px' : '20px', 
          fontWeight: 'bold' 
      }}>
        ARIX Games Center
      </Title>
      
      {/* Pass initialArixBalance and an onGameEnd handler if needed */}
      <CoinflipGame /* initialArixBalance={mainArixBalance} onGameEnd={(gameData) => { console.log(gameData); // Potentially refresh mainArixBalance }} */ />
      
      <Card className="neumorphic-glass-card" style={{marginTop: 30, textAlign: 'center'}}>
            <Title level={4} style={{color: '#00adee'}}>More Games Coming Soon!</Title>
            <Text style={{color: '#aaa'}}>Poker, Durak, and more adventures await.</Text>
      </Card>
    </div>
  );
};

export default GamePage;

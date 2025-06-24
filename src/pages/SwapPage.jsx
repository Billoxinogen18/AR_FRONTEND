// AR_FRONTEND/src/pages/SwapPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { getSwapQuote, performSwap } from '../services/swapServiceFrontend';
import { getUserTransactions } from '../services/api';
import TransactionList from '../components/user/TransactionList';
import './SwapPage.css';

const SwapPage = ({ user, setUser }) => {
    const [fromCurrency, setFromCurrency] = useState('ARIX');
    const [toCurrency, setToCurrency] = useState('USDT');
    const [fromAmount, setFromAmount] = useState('');
    const [toAmount, setToAmount] = useState('');
    const [rate, setRate] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });
    const [transactions, setTransactions] = useState([]);

    const availableCurrencies = ['ARIX', 'USDT', 'TON'];

    const fetchTransactions = useCallback(async () => {
        if (user?.wallet_address) {
            try {
                const trans = await getUserTransactions(user.wallet_address);
                const swapTrans = trans.filter(t => t.type === 'swap');
                setTransactions(swapTrans);
            } catch (error) {
                console.error("Failed to fetch transactions:", error);
            }
        }
    }, [user?.wallet_address]);

    useEffect(() => {
        fetchTransactions();
    }, [fetchTransactions]);
    
    const fetchRate = useCallback(async () => {
        if (fromCurrency && toCurrency && fromCurrency !== toCurrency) {
            try {
                setMessage({ text: '', type: '' });
                const quote = await getSwapQuote(fromCurrency, toCurrency);
                setRate(quote.rate);
            } catch (error) {
                setRate(null);
                setMessage({ text: error.message || 'Could not get swap rate', type: 'error' });
            }
        } else {
            setRate(null);
        }
    }, [fromCurrency, toCurrency]);

    useEffect(() => {
        fetchRate();
    }, [fetchRate]);

    useEffect(() => {
        if (fromAmount && rate) {
            const calculatedToAmount = (parseFloat(fromAmount) * rate).toFixed(8);
            setToAmount(calculatedToAmount);
        } else {
            setToAmount('');
        }
    }, [fromAmount, rate]);

    const handleFlip = () => {
        setFromCurrency(toCurrency);
        setToCurrency(fromCurrency);
        setFromAmount(toAmount); // Keep the value from the other input
    };
    
    const handleMax = () => {
        if (!user) return;
        const balance = getBalance(fromCurrency);
        setFromAmount(balance);
    };

    const handleSwap = async () => {
        if (!fromAmount || parseFloat(fromAmount) <= 0 || !user?.wallet_address) return;
        
        setIsLoading(true);
        setMessage({ text: '', type: '' });

        try {
            const result = await performSwap(user.wallet_address, fromCurrency, toCurrency, parseFloat(fromAmount));
            setUser(result.user); // Update user state in App.jsx
            setMessage({ text: 'Swap successful!', type: 'success' });
            setFromAmount('');
            fetchTransactions(); // Refresh transaction list
        } catch (error) {
            setMessage({ text: error.message || 'Swap failed. Please try again.', type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };
    
    if (!user) {
        return <div className="swap-page-container">Loading user data...</div>;
    }

    const getBalance = (currency) => {
        switch(currency) {
            case 'ARIX': return parseFloat(user.balance || 0).toFixed(4);
            case 'USDT': return parseFloat(user.usdt_balance || 0).toFixed(4);
            case 'TON': return parseFloat(user.ton_balance || 0).toFixed(8);
            default: return '0.00';
        }
    }
    
    return (
        <div className="swap-page-container">
            <div className="wallet-overview">
                <h2>My Wallet</h2>
                <div className="balances-grid">
                    <div className="balance-card">
                        <div className="currency-logo">💎</div>
                        <div className="currency-name">ARIX</div>
                        <div className="currency-amount">{getBalance('ARIX')}</div>
                    </div>
                     <div className="balance-card">
                        <div className="currency-logo">💵</div>
                        <div className="currency-name">USDT</div>
                        <div className="currency-amount">{getBalance('USDT')}</div>
                    </div>
                     <div className="balance-card">
                        <div className="currency-logo">🔵</div>
                        <div className="currency-name">TON</div>
                        <div className="currency-amount">{getBalance('TON')}</div>
                    </div>
                </div>
            </div>

            <div className="swap-container">
                <h3>Swap Tokens</h3>
                <div className="swap-box">
                    <div className="swap-label">You Pay</div>
                    <div className="swap-input-row">
                        <input type="number" value={fromAmount} onChange={(e) => setFromAmount(e.target.value)} placeholder="0.0" disabled={isLoading}/>
                        <select className="currency-selector" value={fromCurrency} onChange={e => setFromCurrency(e.target.value)}>
                            {availableCurrencies.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                     <div className="swap-label">
                         Balance: {getBalance(fromCurrency)}
                         <button onClick={handleMax} className="max-button">MAX</button>
                     </div>
                </div>

                <div className="swap-icon-container">
                    <div className="swap-icon" onClick={handleFlip}>&#x21c5;</div>
                </div>

                <div className="swap-box">
                    <div className="swap-label">You Receive (est.)</div>
                    <div className="swap-input-row">
                        <input type="number" value={toAmount} readOnly placeholder="0.0" />
                         <select className="currency-selector" value={toCurrency} onChange={e => setToCurrency(e.target.value)}>
                            {availableCurrencies.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div className="swap-label">Balance: {getBalance(toCurrency)}</div>
                </div>

                <div className="swap-info">
                    {rate && fromCurrency !== toCurrency && `1 ${fromCurrency} ≈ ${parseFloat(rate).toFixed(6)} ${toCurrency}`}
                </div>
                <div className={`swap-message ${message.type}`}>{message.text}</div>

                <button className="swap-button" onClick={handleSwap} disabled={isLoading || !fromAmount || parseFloat(fromAmount) <= 0 || fromCurrency === toCurrency}>
                    {isLoading ? 'Swapping...' : 'Swap'}
                </button>
            </div>
            
            <div className="transaction-history-container">
                <h3>Recent Swaps</h3>
                <TransactionList transactions={transactions} />
            </div>
        </div>
    );
};

export default SwapPage;

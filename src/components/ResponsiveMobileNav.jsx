// File: AR_FRONTEND/src/components/ResponsiveMobileNav.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Menu, Dropdown, Grid } from 'antd';
import { MoreOutlined } from '@ant-design/icons';

// menuConfig will be passed as a prop from App.jsx
const ResponsiveMobileNav = ({ menuConfig }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const containerRef = useRef(null);

    const [visibleItems, setVisibleItems] = useState(menuConfig);
    const [hiddenItems, setHiddenItems] = useState([]);
    const [containerWidth, setContainerWidth] = useState(0);

    let currentPath = location.pathname;
    // Default to '/earn' if at root or path not in menu
    if (!menuConfig.some(item => item.key === currentPath)) {
        currentPath = '/earn';
    }

    useEffect(() => {
        const calculateVisibleItems = () => {
            if (!containerRef.current) return;

            const currentContainerWidth = containerRef.current.offsetWidth;
            setContainerWidth(currentContainerWidth);

            // Estimate tab width: icon (24px) + label (variable, avg ~30-50px) + padding (8px*2)
            // Min width per item to look decent.
            const minTabWidth = 65; // Increased slightly for better spacing
            const maxPossibleTabs = menuConfig.length;
            const moreButtonWidth = 60; // Approx width for "More" button

            let numVisible = maxPossibleTabs;
            let totalWidthNeeded = maxPossibleTabs * minTabWidth;

            // If all items don't fit, start reducing and add "More" button
            if (totalWidthNeeded > currentContainerWidth) {
                totalWidthNeeded += moreButtonWidth; // Account for "More" button
                numVisible = Math.floor((currentContainerWidth - moreButtonWidth) / minTabWidth);
                numVisible = Math.max(1, Math.min(numVisible, maxPossibleTabs -1)); // Ensure at least 1 item + More, or all but one
            } else {
                numVisible = maxPossibleTabs; // All items fit
            }

            const visible = menuConfig.slice(0, numVisible);
            const hidden = menuConfig.slice(numVisible);

            setVisibleItems(visible);
            setHiddenItems(hidden);
        };

        calculateVisibleItems();
        const debouncedCalculate = setTimeout(calculateVisibleItems, 50); // Recalculate shortly after mount for accurate width

        window.addEventListener('resize', calculateVisibleItems);
        return () => {
            clearTimeout(debouncedCalculate);
            window.removeEventListener('resize', calculateVisibleItems);
        };
    }, [menuConfig]); // Rerun if menuConfig changes

    const handleNavigation = (path) => {
        navigate(path);
    };

    const dropdownMenu = {
        items: hiddenItems.map(item => ({
            key: item.key,
            icon: React.cloneElement(item.icon, { style: { fontSize: '16px', marginRight: '8px', color: item.key === currentPath ? '#7065F0' : '#A0A0A5' } }),
            label: <span style={{color: item.key === currentPath ? '#7065F0' : '#E0E0E5'}}>{item.labelText}</span>,
            onClick: () => handleNavigation(item.key),
        })),
        style: {
            backgroundColor: '#252525', // Match theme.components.Dropdown.colorBgElevated
            borderRadius: '10px', // Match theme.components.Dropdown.borderRadiusLG
            border: '1px solid #303030', // Match theme.components.Dropdown.colorBorderSecondary
        }
    };

    // Calculate flex basis for visible items to distribute them evenly
    const numItemsToShow = visibleItems.length + (hiddenItems.length > 0 ? 1 : 0);
    const itemFlexBasis = numItemsToShow > 0 ? `${100 / numItemsToShow}%` : 'auto';

    return (
        <div
            ref={containerRef}
            className="responsive-mobile-nav-container"
        >
            {visibleItems.map((item) => {
                const isSelected = currentPath === item.key;
                return (
                    <div
                        key={item.key}
                        className={`responsive-nav-item ${isSelected ? 'selected' : ''}`}
                        style={{ flexBasis: itemFlexBasis }}
                        onClick={() => handleNavigation(item.key)}
                        role="button"
                        tabIndex={0}
                        onKeyPress={(e) => e.key === 'Enter' && handleNavigation(item.key)}
                    >
                        <div className="nav-item-icon">
                            {React.cloneElement(item.icon, {
                                style: {
                                    fontSize: containerWidth < 350 ? '18px' : '20px',
                                    color: isSelected ? '#7065F0' : '#8E8E93'
                                }
                            })}
                        </div>
                        <div className="nav-item-label" style={{color: isSelected ? '#7065F0' : '#8E8E93' }}>
                            {item.labelText}
                        </div>
                    </div>
                );
            })}

            {hiddenItems.length > 0 && (
                <Dropdown
                    menu={dropdownMenu}
                    placement="topRight"
                    trigger={['click']}
                    overlayClassName="responsive-nav-dropdown-overlay"
                >
                    <div
                        className={`responsive-nav-item more-button ${hiddenItems.some(item => item.key === currentPath) ? 'selected' : ''}`}
                        style={{ flexBasis: itemFlexBasis }}
                        role="button"
                        tabIndex={0}
                    >
                        <div className="nav-item-icon">
                            <MoreOutlined style={{ fontSize: containerWidth < 350 ? '18px' : '20px', color: hiddenItems.some(item => item.key === currentPath) ? '#7065F0' : '#8E8E93' }}/>
                        </div>
                        <div className="nav-item-label" style={{color: hiddenItems.some(item => item.key === currentPath) ? '#7065F0' : '#8E8E93' }}>
                            MORE
                        </div>
                    </div>
                </Dropdown>
            )}
        </div>
    );
};

export default ResponsiveMobileNav;

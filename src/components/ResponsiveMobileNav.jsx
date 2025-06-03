// File: AR_Proj/AR_FRONTEND/src/components/ResponsiveMobileNav.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Menu, Dropdown } from 'antd';
import { MoreOutlined } from '@ant-design/icons';

const ResponsiveMobileNav = ({ menuConfig }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const [visibleItems, setVisibleItems] = useState(menuConfig);
  const [hiddenItems, setHiddenItems] = useState([]);
  const [containerWidth, setContainerWidth] = useState(0);

  let currentPath = location.pathname;
  if (currentPath === '/' || currentPath === '') { 
    currentPath = '/earn'; 
  }

  // Calculate optimal tab distribution based on screen width
  useEffect(() => {
    const calculateVisibleItems = () => {
      if (!containerRef.current) return;
      
      const containerWidth = containerRef.current.offsetWidth;
      setContainerWidth(containerWidth);
      
      // Base calculations for tab sizing
      const minTabWidth = 60; // Minimum width for icon + label
      const moreButtonWidth = 60; // Width needed for "More" button
      const availableWidth = containerWidth;
      
      // Calculate how many items can fit comfortably
      let maxVisibleItems = Math.floor(availableWidth / minTabWidth);
      
      // If we can't fit all items, reserve space for "More" button
      if (maxVisibleItems < menuConfig.length) {
        maxVisibleItems = Math.max(2, Math.floor((availableWidth - moreButtonWidth) / minTabWidth));
      }
      
      // Ensure we don't exceed the total number of items
      maxVisibleItems = Math.min(maxVisibleItems, menuConfig.length);
      
      // Split items into visible and hidden
      const visible = menuConfig.slice(0, maxVisibleItems);
      const hidden = menuConfig.slice(maxVisibleItems);
      
      setVisibleItems(visible);
      setHiddenItems(hidden);
    };

    // Initial calculation
    calculateVisibleItems();

    // Recalculate on window resize
    const handleResize = () => {
      setTimeout(calculateVisibleItems, 100); // Debounce
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [menuConfig]);

  // Handle navigation
  const handleNavigation = (path) => {
    navigate(path);
  };

  // Create dropdown menu for hidden items
  const dropdownMenu = {
    items: hiddenItems.map(item => ({
      key: item.key,
      icon: React.cloneElement(item.icon, { style: { fontSize: '16px', marginRight: '8px' } }),
      label: item.labelText,
      onClick: () => handleNavigation(item.key),
    })),
  };

  // Calculate flex basis for visible items
  const flexBasis = hiddenItems.length > 0 
    ? `${100 / (visibleItems.length + 1)}%` 
    : `${100 / visibleItems.length}%`;

  return (
    <div 
      ref={containerRef}
      className="responsive-mobile-nav"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'stretch',
        background: '#1c1c1e',
        borderTop: '1px solid #38383a',
        boxShadow: '0 -2px 10px rgba(0,0,0,0.2)',
        height: '60px',
        width: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Visible Navigation Items */}
      {visibleItems.map((item) => {
        const isSelected = currentPath === item.key;
        return (
          <div
            key={item.key}
            className={`nav-item ${isSelected ? 'selected' : ''}`}
            style={{
              flex: `0 0 ${flexBasis}`,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              backgroundColor: isSelected ? 'rgba(126, 115, 255, 0.1)' : 'transparent',
              color: isSelected ? '#7e73ff' : '#8e8e93',
              padding: '8px 4px',
              minWidth: 0, // Allow shrinking
            }}
            onClick={() => handleNavigation(item.key)}
          >
            <div style={{ 
              fontSize: '20px', 
              lineHeight: 1, 
              marginBottom: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {React.cloneElement(item.icon, { 
                style: { 
                  fontSize: containerWidth < 350 ? '18px' : '20px' 
                } 
              })}
            </div>
            <div style={{
              fontSize: containerWidth < 350 ? '9px' : '10px',
              fontWeight: '500',
              lineHeight: 1,
              textAlign: 'center',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '100%',
            }}>
              {item.labelText}
            </div>
          </div>
        );
      })}

      {/* More Button for Hidden Items */}
      {hiddenItems.length > 0 && (
        <Dropdown
          menu={dropdownMenu}
          placement="topRight"
          trigger={['click']}
        >
          <div
            className="nav-item more-button"
            style={{
              flex: `0 0 ${flexBasis}`,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              backgroundColor: hiddenItems.some(item => item.key === currentPath) 
                ? 'rgba(126, 115, 255, 0.1)' 
                : 'transparent',
              color: hiddenItems.some(item => item.key === currentPath) 
                ? '#7e73ff' 
                : '#8e8e93',
              padding: '8px 4px',
            }}
          >
            <div style={{ 
              fontSize: containerWidth < 350 ? '18px' : '20px', 
              lineHeight: 1, 
              marginBottom: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <MoreOutlined />
            </div>
            <div style={{
              fontSize: containerWidth < 350 ? '9px' : '10px',
              fontWeight: '500',
              lineHeight: 1,
              textAlign: 'center',
            }}>
              MORE
            </div>
          </div>
        </Dropdown>
      )}
    </div>
  );
};

export default ResponsiveMobileNav;
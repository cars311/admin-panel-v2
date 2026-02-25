import React, { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  makeStyles,
  tokens,
  Avatar,
  Body1,
  Caption1,
  Menu,
  MenuItem,
  MenuList,
  MenuPopover,
  MenuTrigger,
} from '@fluentui/react-components';
import {
  DataTrendingRegular,
  BuildingRegular,
  PeopleRegular,
  SignOutRegular,
  NavigationRegular,
  CalendarSyncRegular,
} from '@fluentui/react-icons';
import { useAuth } from '../../context/AuthContext';
import logo from '../../assets/images/ai-sales-logo-dark.svg';

const NAV_WIDTH = 240;

const useStyles = makeStyles({
  root: {
    display: 'flex',
    height: '100vh',
    width: '100vw',
    overflow: 'hidden',
  },
  sidebar: {
    width: `${NAV_WIDTH}px`,
    minWidth: `${NAV_WIDTH}px`,
    backgroundColor: '#ffffff',
    borderRight: `1px solid ${tokens.colorNeutralStroke2}`,
    display: 'flex',
    flexDirection: 'column',
    padding: '0',
    transition: 'margin-left 0.2s ease',
  },
  sidebarCollapsed: {
    marginLeft: `-${NAV_WIDTH}px`,
  },
  logoContainer: {
    padding: '24px 24px 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logo: {
    height: '32px',
  },
  nav: {
    flex: 1,
    padding: '8px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 12px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 400,
    color: tokens.colorNeutralForeground2,
    textDecoration: 'none',
    border: 'none',
    backgroundColor: 'transparent',
    width: '100%',
    textAlign: 'left',
    transition: 'background-color 0.15s ease',
    '&:hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
  },
  navItemActive: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 12px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 600,
    color: tokens.colorBrandForeground1,
    textDecoration: 'none',
    border: 'none',
    backgroundColor: tokens.colorBrandBackground2,
    width: '100%',
    textAlign: 'left',
  },
  userSection: {
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
    padding: '16px',
  },
  userCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    cursor: 'pointer',
    padding: '8px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: 'transparent',
    width: '100%',
    textAlign: 'left',
    '&:hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
  },
  userInfo: {
    flex: 1,
    overflow: 'hidden',
  },
  contentWrapper: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  topBar: {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 16px',
    backgroundColor: '#ffffff',
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    minHeight: '48px',
  },
  burgerButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '36px',
    height: '36px',
    borderRadius: '6px',
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    color: tokens.colorNeutralForeground2,
    fontSize: '20px',
    '&:hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
  },
  content: {
    flex: 1,
    overflow: 'auto',
    backgroundColor: '#f5f5f5',
    padding: '32px',
  },
});

const navItems = [
  { path: '/', label: 'Reports', icon: <DataTrendingRegular /> },
  { path: '/companies', label: 'Companies', icon: <BuildingRegular /> },
  { path: '/users', label: 'Users', icon: <PeopleRegular /> },
  { path: '/scheduled-jobs', label: 'Scheduled Jobs', icon: <CalendarSyncRegular /> },
];

const MainLayout: React.FC = () => {
  const styles = useStyles();
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const getUserName = () => {
    const email = user.email || '';
    const name = email.split('@')[0] || 'Admin';
    return name.charAt(0).toUpperCase() + name.slice(1);
  };

  const getInitials = () => {
    const name = getUserName();
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className={styles.root}>
      <aside className={`${styles.sidebar} ${!sidebarOpen ? styles.sidebarCollapsed : ''}`}>
        <div className={styles.logoContainer}>
          <img src={logo} alt="Cars311" className={styles.logo} />
        </div>

        <nav className={styles.nav}>
          {navItems.map((item) => {
            const isActive =
              item.path === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.path);

            return (
              <button
                key={item.path}
                className={isActive ? styles.navItemActive : styles.navItem}
                onClick={() => navigate(item.path)}
              >
                {item.icon}
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className={styles.userSection}>
          <Menu>
            <MenuTrigger disableButtonEnhancement>
              <button className={styles.userCard}>
                <Avatar
                  name={getUserName()}
                  initials={getInitials()}
                  image={user.picture ? { src: user.picture } : undefined}
                  size={36}
                  color="brand"
                />
                <div className={styles.userInfo}>
                  <Body1 style={{ display: 'block', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {getUserName()}
                  </Body1>
                  <Caption1 style={{ display: 'block', color: tokens.colorNeutralForeground3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {user.email}
                  </Caption1>
                </div>
              </button>
            </MenuTrigger>
            <MenuPopover>
              <MenuList>
                <MenuItem icon={<SignOutRegular />} onClick={logout}>
                  Sign out
                </MenuItem>
              </MenuList>
            </MenuPopover>
          </Menu>
        </div>
      </aside>

      <div className={styles.contentWrapper}>
        <div className={styles.topBar}>
          <button
            className={styles.burgerButton}
            onClick={() => setSidebarOpen((prev) => !prev)}
            aria-label="Toggle sidebar"
          >
            <NavigationRegular />
          </button>
        </div>
        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;

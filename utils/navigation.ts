import { NavigationItem } from '../types';

const NAV_TO_PATH: Record<NavigationItem, string> = {
  'dashboard': '/dashboard',
  'sales-entry': '/sales-entry',
  'crm': '/crm',
  'accounts': '/accounts',
  'contacts': '/contacts',
  'deals': '/deals',
  'quote-builder': '/quote-builder',
  'reports': '/reports',
  'admin': '/admin',
  'settings': '/settings',
};

const PATH_TO_NAV: Record<string, NavigationItem> = Object.fromEntries(
  Object.entries(NAV_TO_PATH).map(([k, v]) => [v, k as NavigationItem])
) as Record<string, NavigationItem>;

export function navigationItemToPath(item: NavigationItem): string {
  return NAV_TO_PATH[item] || '/dashboard';
}

export function pathToNavigationItem(path: string): NavigationItem {
  const normalized = path === '/' ? '/dashboard' : path.replace(/\/$/, '');
  return PATH_TO_NAV[normalized] || 'dashboard';
}

export const pageTitles: Record<NavigationItem, string> = {
  'dashboard': 'Dashboard',
  'sales-entry': 'Sales Entry',
  'crm': 'Leads',
  'accounts': 'Accounts',
  'contacts': 'Contacts',
  'deals': 'Deals',
  'quote-builder': 'Quote Builder',
  'reports': 'Reports',
  'admin': 'Admin Panel',
  'settings': 'Settings',
};

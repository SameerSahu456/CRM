import { NavigationItem } from '@/types';

const NAV_TO_PATH: Record<NavigationItem, string> = {
  'dashboard': '/dashboard',
  'sales-entry': '/sales-entry',
  'leads': '/leads',
  'collections': '/collections',
  'accounts': '/accounts',
  'contacts': '/contacts',
  'deals': '/deals',
  'inventory': '/inventory',
  'tasks': '/tasks',
  'calendar': '/calendar',
  'meetings': '/meetings',
  'reports': '/reports',
  'admin': '/admin',
  'activity-log': '/activity-log',
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
  // Handle legacy /crm path → redirect to leads
  if (normalized === '/crm') return 'leads';
  // Exact match first
  if (PATH_TO_NAV[normalized]) return PATH_TO_NAV[normalized];
  // Sub-path match: /leads/create → 'leads', /deals/edit/123 → 'deals'
  for (const [navPath, navItem] of Object.entries(PATH_TO_NAV)) {
    if (normalized.startsWith(navPath + '/')) return navItem;
  }
  return 'dashboard';
}

export const pageTitles: Record<NavigationItem, string> = {
  'dashboard': 'Dashboard',
  'sales-entry': 'Sales Entry',
  'leads': 'Leads',
  'collections': 'Collections',
  'accounts': 'Accounts',
  'contacts': 'Contacts',
  'deals': 'Deals',
  'inventory': 'Inventory',
  'tasks': 'Tasks',
  'calendar': 'Calendar',
  'meetings': 'Meetings',
  'reports': 'Reports',
  'admin': 'Admin Panel',
  'activity-log': 'Activity Log',
  'settings': 'Settings',
};

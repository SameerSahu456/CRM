import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { Pipeline } from './components/Pipeline';
import { LeadsTable } from './components/LeadsTable';
import { AccountsTable } from './components/AccountsTable';
import { AnalyticsView } from './components/AnalyticsView';
import { ContactsTable } from './components/ContactsTable';
import { TasksView } from './components/TasksView';
import { CalendarView } from './components/CalendarView';
// Marketing & Support modules - commented out as not needed
// import { CampaignsView } from './components/CampaignsView';
// import { TicketsView } from './components/TicketsView';
import { EmailView } from './components/EmailView';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';
import { NavigationItem } from './types';
import { NavigationProvider } from './contexts/NavigationContext';

function App() {
  const [activeTab, setActiveTab] = useState<NavigationItem>('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'deals':
        return <Pipeline />;
      case 'leads':
        return <LeadsTable />;
      case 'accounts':
        return <AccountsTable />;
      case 'contacts':
        return <ContactsTable />;
      case 'tasks':
        return <TasksView />;
      case 'calendar':
        return <CalendarView />;
      // Marketing & Support modules - commented out as not needed
      // case 'campaigns':
      //   return <CampaignsView />;
      // case 'tickets':
      //   return <TicketsView />;
      case 'email':
        return <EmailView />;
      case 'reports':
        return <ReportsView />;
      case 'analytics':
        return <AnalyticsView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <Dashboard />;
    }
  };

  const getTitle = () => {
    return activeTab.charAt(0).toUpperCase() + activeTab.slice(1);
  };

  return (
    <NavigationProvider activeTab={activeTab} setActiveTab={setActiveTab}>
      <div className="flex bg-slate-50 min-h-screen font-sans text-slate-900">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        <main className="flex-1 ml-64 flex flex-col min-h-screen transition-all duration-300">
          <Header title={getTitle()} />

          <div className="flex-1 overflow-auto relative">
            {renderContent()}
          </div>
        </main>
      </div>
    </NavigationProvider>
  );
}

export default App;
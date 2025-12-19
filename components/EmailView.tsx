import React, { useState, useEffect } from 'react';
import { Plus, Search, Inbox, Send, FileEdit, Star, Trash2, Archive, MoreVertical, Paperclip, Clock, CheckCircle2, X, Reply, Forward, Tag, Loader2, AlertCircle, ChevronLeft } from 'lucide-react';
import { Email } from '../types';
import { emailsApi } from '../services/api';

const emailTemplates = [
  {
    id: '1',
    name: 'Introduction Email',
    subject: 'Introduction - [Company Name]',
    category: 'Sales',
    body: `Hi [Name],

I hope this email finds you well. My name is [Your Name] from [Company Name], and I wanted to reach out to introduce myself and our company.

We specialize in [brief description of services/products] and have helped companies like yours achieve [key benefit].

I'd love to schedule a quick call to learn more about your needs and see if there's a potential fit.

Would you be available for a 15-minute call this week?

Best regards,
[Your Name]`
  },
  {
    id: '2',
    name: 'Follow-up After Demo',
    subject: 'Great meeting today!',
    category: 'Sales',
    body: `Hi [Name],

Thank you for taking the time to meet with me today! I really enjoyed learning about [Company Name] and your goals for [specific topic discussed].

As we discussed, here are the key points:
• [Key point 1]
• [Key point 2]
• [Key point 3]

I'm confident that our solution can help you [specific benefit discussed].

What would be the best next step? I'm happy to set up a follow-up call or send over a detailed proposal.

Looking forward to hearing from you!

Best regards,
[Your Name]`
  },
  {
    id: '3',
    name: 'Proposal Follow-up',
    subject: 'Following up on our proposal',
    category: 'Sales',
    body: `Hi [Name],

I wanted to follow up on the proposal I sent over last week regarding [project/service name].

I understand you're likely busy, but I wanted to check if you had any questions or if there's anything I can clarify about our proposal.

Key highlights from our proposal:
• [Highlight 1]
• [Highlight 2]
• [Highlight 3]

Would you be available for a quick call to discuss? I'm happy to walk through any details.

Best regards,
[Your Name]`
  },
  {
    id: '4',
    name: 'Thank You Email',
    subject: 'Thank you for your time',
    category: 'Sales',
    body: `Hi [Name],

I wanted to take a moment to thank you for [specific reason - meeting/call/referral/business].

It was a pleasure speaking with you about [topic discussed]. I appreciate you sharing your insights about [specific detail].

If there's anything else I can help with, please don't hesitate to reach out.

Thank you again, and I look forward to staying in touch!

Best regards,
[Your Name]`
  },
  {
    id: '5',
    name: 'Meeting Request',
    subject: 'Request for a meeting',
    category: 'Sales',
    body: `Hi [Name],

I hope this email finds you well. I'm reaching out because I believe [Company Name] could benefit from [your product/service].

I'd love to schedule a brief meeting to:
• Learn more about your current [process/challenges]
• Share how we've helped similar companies
• Explore potential collaboration opportunities

Would you have 20-30 minutes available this week or next? I'm flexible with timing and can work around your schedule.

Looking forward to connecting!

Best regards,
[Your Name]`
  },
  {
    id: '6',
    name: 'Cold Outreach',
    subject: 'Quick question about [Company Name]',
    category: 'Sales',
    body: `Hi [Name],

I noticed that [Company Name] is [observation about their company - growing, launching new product, etc.] and thought I'd reach out.

At [Your Company], we help businesses like yours [specific value proposition].

Some of our recent results include:
• [Result 1]
• [Result 2]

Would you be open to a brief conversation to see if this might be relevant for you?

Best regards,
[Your Name]`
  },
  {
    id: '7',
    name: 'Re-engagement Email',
    subject: 'Checking in - still interested?',
    category: 'Sales',
    body: `Hi [Name],

I wanted to check in since we last spoke about [topic/project]. I understand priorities shift, and I wanted to see if your situation has changed.

Are you still interested in [product/service/solution]? If so, I'd be happy to pick up where we left off.

If now isn't the right time, no worries at all - just let me know and I'll follow up later.

Looking forward to hearing from you!

Best regards,
[Your Name]`
  },
  {
    id: '8',
    name: 'Contract Renewal',
    subject: 'Your contract is coming up for renewal',
    category: 'Account Management',
    body: `Hi [Name],

I hope you're doing well! I wanted to reach out regarding your upcoming contract renewal on [date].

Over the past [time period], we've been grateful for your partnership and are excited about the results we've achieved together:
• [Achievement 1]
• [Achievement 2]

I'd love to schedule a call to discuss your renewal options and any new features that might benefit your team.

Please let me know a time that works for you.

Best regards,
[Your Name]`
  },
];

// Mock email data for offline/development mode
const MOCK_EMAILS: Email[] = [
  // Inbox emails (received)
  {
    id: 'email-inbox-1',
    subject: 'Re: Partnership Opportunity Discussion',
    body: 'Hi Sarah,\n\nThank you for reaching out! I have reviewed your proposal and I am very interested in exploring this partnership further.\n\nI am available next Tuesday or Wednesday afternoon for a call. Please let me know what works best for you.\n\nAlso, could you send me more details about the integration timeline?\n\nBest regards,\nJohn Doe\nAcme Corporation',
    from: 'john.doe@acmecorp.com',
    to: ['sarah.jenkins@comprint.com'],
    cc: [],
    status: 'Received',
    sentAt: '2024-12-18T17:30:00Z',
    scheduledAt: '',
    openedAt: '',
    clickedAt: '',
    trackOpens: false,
    trackClicks: false,
    relatedTo: { type: 'Deal', id: 'deal-1', name: 'Acme Corp Partnership' },
    createdAt: '2024-12-18T17:30:00Z',
  },
  {
    id: 'email-inbox-2',
    subject: 'Quote Request - Enterprise License',
    body: 'Hello,\n\nWe are interested in your enterprise CRM solution for our organization of 500+ employees. Could you please provide us with a quote and information about:\n\n1. Volume licensing options\n2. Implementation timeline\n3. Training and support packages\n4. Data migration services\n\nWe are looking to make a decision by end of Q1.\n\nThank you,\nJennifer Martinez\nGlobal Tech Solutions',
    from: 'jennifer.martinez@globaltech.com',
    to: ['sales@comprint.com'],
    cc: ['sarah.jenkins@comprint.com'],
    status: 'Received',
    sentAt: '2024-12-18T10:15:00Z',
    scheduledAt: '',
    openedAt: '',
    clickedAt: '',
    trackOpens: false,
    trackClicks: false,
    relatedTo: undefined,
    createdAt: '2024-12-18T10:15:00Z',
  },
  {
    id: 'email-inbox-3',
    subject: 'Meeting Confirmation - Product Demo',
    body: 'Hi Michael,\n\nThis is to confirm our product demo meeting scheduled for tomorrow at 2:00 PM EST.\n\nMeeting Details:\n- Platform: Zoom\n- Link: https://zoom.us/j/123456789\n- Duration: 1 hour\n\nPlease let me know if you need to reschedule.\n\nBest,\nRobert Chen\nTechStart Inc.',
    from: 'robert.chen@techstart.io',
    to: ['michael.chen@comprint.com'],
    cc: [],
    status: 'Received',
    sentAt: '2024-12-17T16:00:00Z',
    scheduledAt: '',
    openedAt: '',
    clickedAt: '',
    trackOpens: false,
    trackClicks: false,
    relatedTo: { type: 'Deal', id: 'deal-2', name: 'TechStart Enterprise Deal' },
    createdAt: '2024-12-17T16:00:00Z',
  },
  {
    id: 'email-inbox-4',
    subject: 'Support Request - Login Issue',
    body: 'Hi Support Team,\n\nOne of our users is having trouble logging into the CRM. They are receiving an "Invalid credentials" error even though the password was just reset.\n\nUser email: user@globalindustries.com\nAccount: Global Industries Ltd\n\nCan you please look into this urgently?\n\nThanks,\nIT Department\nGlobal Industries',
    from: 'it@globalindustries.com',
    to: ['support@comprint.com'],
    cc: [],
    status: 'Received',
    sentAt: '2024-12-18T08:45:00Z',
    scheduledAt: '',
    openedAt: '',
    clickedAt: '',
    trackOpens: false,
    trackClicks: false,
    relatedTo: { type: 'Account', id: 'acc-3', name: 'Global Industries' },
    createdAt: '2024-12-18T08:45:00Z',
  },
  // Sent emails
  {
    id: 'email-1',
    subject: 'Partnership Opportunity Discussion',
    body: 'Hi John,\n\nI wanted to follow up on our conversation about the potential partnership between our companies. After reviewing your proposal, I believe there are several synergies we could explore.\n\nWould you be available for a call next week to discuss the next steps? I have some ideas on how we could structure the collaboration.\n\nLooking forward to hearing from you.\n\nBest regards,\nSarah Jenkins\nComprint CRM',
    from: 'sarah.jenkins@comprint.com',
    to: ['john.doe@acmecorp.com'],
    cc: [],
    status: 'Sent',
    sentAt: '2024-12-18T14:30:00Z',
    scheduledAt: '',
    openedAt: '2024-12-18T16:45:00Z',
    clickedAt: '',
    trackOpens: true,
    trackClicks: true,
    relatedTo: { type: 'Deal', id: 'deal-1', name: 'Acme Corp Partnership' },
    createdAt: '2024-12-18T14:25:00Z',
  },
  {
    id: 'email-2',
    subject: 'Proposal: Enterprise Software Solution',
    body: 'Dear Ms. Thompson,\n\nThank you for taking the time to meet with us last week. As discussed, I am pleased to present our comprehensive proposal for the enterprise software solution.\n\nKey highlights include:\n- Custom implementation tailored to your needs\n- 24/7 support and maintenance\n- Training for your team\n- Scalable architecture\n\nPlease find the detailed proposal attached. I am available to answer any questions you may have.\n\nBest regards,\nMichael Chen',
    from: 'michael.chen@comprint.com',
    to: ['jennifer.thompson@techstart.io'],
    cc: ['sarah.jenkins@comprint.com'],
    status: 'Sent',
    sentAt: '2024-12-17T10:00:00Z',
    scheduledAt: '',
    openedAt: '2024-12-17T11:30:00Z',
    clickedAt: '2024-12-17T11:35:00Z',
    trackOpens: true,
    trackClicks: true,
    relatedTo: { type: 'Deal', id: 'deal-2', name: 'TechStart Enterprise Deal' },
    createdAt: '2024-12-17T09:45:00Z',
  },
  {
    id: 'email-3',
    subject: 'Welcome to Comprint CRM!',
    body: 'Hi Robert,\n\nWelcome aboard! We are thrilled to have Global Industries as a new customer.\n\nYour account has been set up and you should have received your login credentials. Here are some resources to help you get started:\n\n1. Getting Started Guide\n2. Video Tutorials\n3. Support Documentation\n\nOur customer success team will reach out to schedule your onboarding session.\n\nBest regards,\nEmily Rodriguez',
    from: 'emily.rodriguez@comprint.com',
    to: ['robert.wilson@globalindustries.com'],
    cc: [],
    status: 'Sent',
    sentAt: '2024-12-16T09:15:00Z',
    scheduledAt: '',
    openedAt: '2024-12-16T09:45:00Z',
    clickedAt: '',
    trackOpens: true,
    trackClicks: false,
    relatedTo: { type: 'Account', id: 'acc-3', name: 'Global Industries' },
    createdAt: '2024-12-16T09:00:00Z',
  },
  {
    id: 'email-4',
    subject: 'Q1 Planning Meeting - Agenda',
    body: 'Team,\n\nPlease find below the agenda for our Q1 planning meeting scheduled for next Monday:\n\n1. Review Q4 performance metrics\n2. Set Q1 targets and KPIs\n3. Resource allocation discussion\n4. New product roadmap preview\n5. Open discussion\n\nPlease come prepared with your department updates.\n\nBest,\nSarah',
    from: 'sarah.jenkins@comprint.com',
    to: ['team@comprint.com'],
    cc: [],
    status: 'Scheduled',
    sentAt: '',
    scheduledAt: '2024-12-20T08:00:00Z',
    openedAt: '',
    clickedAt: '',
    trackOpens: false,
    trackClicks: false,
    relatedTo: undefined,
    createdAt: '2024-12-15T16:00:00Z',
  },
  {
    id: 'email-5',
    subject: 'Draft: Annual Review Summary',
    body: 'Dear Valued Partners,\n\nAs we approach the end of the year, I wanted to take a moment to reflect on our partnership and share some highlights from 2024...\n\n[Draft in progress]',
    from: 'sarah.jenkins@comprint.com',
    to: ['partners@list.comprint.com'],
    cc: [],
    status: 'Draft',
    sentAt: '',
    scheduledAt: '',
    openedAt: '',
    clickedAt: '',
    trackOpens: false,
    trackClicks: false,
    relatedTo: undefined,
    createdAt: '2024-12-14T14:30:00Z',
  },
];

export const EmailView: React.FC = () => {
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [activeFolder, setActiveFolder] = useState<'inbox' | 'sent' | 'drafts' | 'scheduled'>('inbox');
  const [showCompose, setShowCompose] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [composeData, setComposeData] = useState({ to: '', subject: '', body: '' });

  const handleUseTemplate = (template: typeof emailTemplates[0]) => {
    setComposeData({
      to: '',
      subject: template.subject,
      body: template.body
    });
    setShowTemplates(false);
    setShowCompose(true);
  };

  const openCompose = () => {
    setComposeData({ to: '', subject: '', body: '' });
    setShowCompose(true);
  };

  useEffect(() => {
    const fetchEmails = async () => {
      try {
        setLoading(true);
        const data = await emailsApi.getAll();
        setEmails(data as Email[]);
      } catch (err) {
        // API unavailable, use mock data
        console.log('API unavailable, using mock email data');
        setEmails(MOCK_EMAILS);
        setError(null); // Clear any error since we have fallback data
      } finally {
        setLoading(false);
      }
    };
    fetchEmails();
  }, []);

  const folders = [
    { id: 'inbox' as const, label: 'Inbox', icon: Inbox, count: emails.filter(e => e.status === 'Received').length },
    { id: 'sent' as const, label: 'Sent', icon: Send, count: emails.filter(e => e.status === 'Sent').length },
    { id: 'drafts' as const, label: 'Drafts', icon: FileEdit, count: emails.filter(e => e.status === 'Draft').length },
    { id: 'scheduled' as const, label: 'Scheduled', icon: Clock, count: emails.filter(e => e.status === 'Scheduled').length },
  ];

  const filteredEmails = emails.filter(email => {
    if (activeFolder === 'inbox') return email.status === 'Received';
    if (activeFolder === 'sent') return email.status === 'Sent';
    if (activeFolder === 'drafts') return email.status === 'Draft';
    if (activeFolder === 'scheduled') return email.status === 'Scheduled';
    return false;
  });

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-brand-600 mx-auto mb-3" />
          <p className="text-slate-500">Loading emails...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-3" />
          <p className="text-red-600 font-medium">Error loading emails</p>
          <p className="text-slate-500 text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 h-[calc(100vh-4rem)] md:h-[calc(100vh-5rem)]">
      <div className="flex flex-col md:flex-row gap-4 md:gap-6 h-full">
        {/* Sidebar - hidden on mobile when email selected */}
        <div className={`${selectedEmail ? 'hidden md:block' : ''} w-full md:w-56 lg:w-64 flex-shrink-0 space-y-4`}>
          <button
            onClick={openCompose}
            className="w-full flex items-center justify-center gap-2 bg-brand-600 text-white px-4 py-3 rounded-xl text-sm font-medium hover:bg-brand-700 shadow-glow"
          >
            <Plus size={18} /> Compose
          </button>

          <div className="bg-white rounded-xl border border-slate-200 shadow-soft overflow-hidden">
            {folders.map((folder) => (
              <button
                key={folder.id}
                onClick={() => setActiveFolder(folder.id)}
                className={`w-full flex items-center justify-between px-4 py-3 text-sm transition-colors ${
                  activeFolder === folder.id
                    ? 'bg-brand-50 text-brand-600 font-medium'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="flex items-center gap-3">
                  <folder.icon size={18} />
                  {folder.label}
                </span>
                {folder.count > 0 && (
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    activeFolder === folder.id ? 'bg-brand-100 text-brand-700' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {folder.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Email Templates */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-soft p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900">Templates</h3>
              <button
                onClick={() => setShowTemplates(true)}
                className="text-xs text-brand-600 hover:text-brand-700"
              >
                View All
              </button>
            </div>
            <div className="space-y-2">
              {emailTemplates.slice(0, 3).map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleUseTemplate(template)}
                  className="w-full text-left px-3 py-2 text-xs text-slate-600 hover:bg-slate-50 hover:text-brand-600 rounded-lg transition-colors truncate"
                >
                  {template.name}
                </button>
              ))}
            </div>
          </div>

          {/* Email Stats */}
          <div className="bg-gradient-to-br from-brand-600 to-brand-800 rounded-xl p-4 text-white">
            <h3 className="text-sm font-bold mb-3">This Week</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-brand-200 text-xs">Emails Sent</span>
                <span className="font-bold">127</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-brand-200 text-xs">Open Rate</span>
                <span className="font-bold">42.3%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-brand-200 text-xs">Click Rate</span>
                <span className="font-bold">18.5%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Email List */}
        <div className={`${selectedEmail ? 'hidden md:flex' : 'flex'} flex-1 bg-white rounded-2xl shadow-soft border border-slate-200 overflow-hidden flex-col`}>
          {/* Header */}
          <div className="p-3 lg:p-4 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 lg:gap-4">
              <h3 className="text-base lg:text-lg font-bold text-slate-900 capitalize">{activeFolder}</h3>
              <span className="text-xs lg:text-sm text-slate-500">{filteredEmails.length} emails</span>
            </div>
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search emails..."
                className="pl-9 pr-4 py-2 w-full sm:w-48 lg:w-64 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          {/* Email List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {filteredEmails.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Inbox size={48} className="mx-auto text-slate-300 mb-4" />
                  <h4 className="text-lg font-medium text-slate-600">No emails</h4>
                  <p className="text-sm text-slate-400">Your {activeFolder} folder is empty</p>
                </div>
              </div>
            ) : (
              filteredEmails.map((email) => (
                <div
                  key={email.id}
                  onClick={() => setSelectedEmail(email)}
                  className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer ${
                    selectedEmail?.id === email.id ? 'bg-brand-50' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {activeFolder === 'inbox'
                        ? email.from.split('@')[0].substring(0, 2).toUpperCase()
                        : email.to[0].split('@')[0].substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-slate-900 truncate">
                          {activeFolder === 'inbox' ? email.from : email.to[0]}
                        </span>
                        <span className="text-xs text-slate-400 flex-shrink-0">
                          {email.sentAt ? formatDate(email.sentAt) : email.scheduledAt ? formatDate(email.scheduledAt) : ''}
                        </span>
                      </div>
                      <h4 className="text-sm text-slate-900 font-medium truncate">{email.subject}</h4>
                      <p className="text-xs text-slate-500 truncate mt-1">{email.body.substring(0, 100)}...</p>
                      <div className="flex items-center gap-3 mt-2">
                        {email.relatedTo && (
                          <span className="text-xs text-brand-600 bg-brand-50 px-2 py-0.5 rounded">
                            {email.relatedTo.type}: {email.relatedTo.name}
                          </span>
                        )}
                        {email.openedAt && (
                          <span className="text-xs text-green-600 flex items-center gap-1">
                            <CheckCircle2 size={12} /> Opened
                          </span>
                        )}
                        {email.status === 'Scheduled' && (
                          <span className="text-xs text-orange-600 flex items-center gap-1">
                            <Clock size={12} /> Scheduled
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Email Detail Panel */}
        {selectedEmail && (
          <div className="w-full md:w-[360px] lg:w-[450px] bg-white rounded-2xl shadow-soft border border-slate-200 overflow-hidden flex flex-col flex-shrink-0">
            {/* Header */}
            <div className="p-3 md:p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedEmail(null)}
                  className="md:hidden p-2 hover:bg-slate-100 rounded-lg text-slate-600"
                >
                  <ChevronLeft size={20} />
                </button>
                <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400">
                  <Reply size={18} />
                </button>
                <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400">
                  <Forward size={18} />
                </button>
                <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400">
                  <Archive size={18} />
                </button>
                <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400">
                  <Trash2 size={18} />
                </button>
              </div>
              <button onClick={() => setSelectedEmail(null)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400">
                <X size={18} />
              </button>
            </div>

            {/* Email Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4">{selectedEmail.subject}</h2>

              <div className="flex items-start gap-4 mb-6 pb-6 border-b border-slate-100">
                <div className="w-12 h-12 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center font-bold">
                  SJ
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-900">{selectedEmail.from}</p>
                      <p className="text-sm text-slate-500">To: {selectedEmail.to.join(', ')}</p>
                    </div>
                    <span className="text-xs text-slate-400">
                      {selectedEmail.sentAt ? formatDate(selectedEmail.sentAt) : 'Draft'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="prose prose-sm max-w-none text-slate-700 leading-relaxed">
                <p>{selectedEmail.body}</p>
              </div>

              {selectedEmail.relatedTo && (
                <div className="mt-6 pt-6 border-t border-slate-100">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Related To</p>
                  <div className="flex items-center gap-2">
                    <Tag size={14} className="text-slate-400" />
                    <span className="text-sm text-brand-600">{selectedEmail.relatedTo.type}: {selectedEmail.relatedTo.name}</span>
                  </div>
                </div>
              )}

              {/* Tracking Info */}
              {(selectedEmail.trackOpens || selectedEmail.trackClicks) && (
                <div className="mt-6 pt-6 border-t border-slate-100">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">Tracking</p>
                  <div className="space-y-2">
                    {selectedEmail.openedAt && (
                      <div className="flex items-center gap-2 text-sm text-green-600">
                        <CheckCircle2 size={14} />
                        Opened on {formatDate(selectedEmail.openedAt)}
                      </div>
                    )}
                    {selectedEmail.clickedAt && (
                      <div className="flex items-center gap-2 text-sm text-blue-600">
                        <CheckCircle2 size={14} />
                        Link clicked on {formatDate(selectedEmail.clickedAt)}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Reply Section */}
            <div className="p-4 border-t border-slate-100 bg-slate-50">
              <textarea
                placeholder="Write a reply..."
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500"
                rows={3}
              />
              <div className="flex items-center justify-between mt-3">
                <button className="p-2 text-slate-400 hover:text-slate-600">
                  <Paperclip size={18} />
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700">
                  <Send size={14} /> Send
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Compose Modal */}
      {showCompose && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowCompose(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">New Email</h2>
              <button onClick={() => setShowCompose(false)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <input
                  type="email"
                  placeholder="To"
                  value={composeData.to}
                  onChange={(e) => setComposeData({ ...composeData, to: e.target.value })}
                  className="w-full px-4 py-2 border-b border-slate-200 focus:outline-none focus:border-brand-500"
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Subject"
                  value={composeData.subject}
                  onChange={(e) => setComposeData({ ...composeData, subject: e.target.value })}
                  className="w-full px-4 py-2 border-b border-slate-200 focus:outline-none focus:border-brand-500"
                />
              </div>
              <div>
                <textarea
                  placeholder="Write your message..."
                  value={composeData.body}
                  onChange={(e) => setComposeData({ ...composeData, body: e.target.value })}
                  className="w-full px-4 py-2 h-64 resize-none focus:outline-none"
                />
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
                  <Paperclip size={18} />
                </button>
                <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
                  <Tag size={18} />
                </button>
              </div>
              <div className="flex items-center gap-3">
                <button className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm">
                  Save Draft
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700">
                  <Send size={14} /> Send
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Templates Modal */}
      {showTemplates && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowTemplates(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[85vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Email Templates</h2>
              <button onClick={() => setShowTemplates(false)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(85vh-80px)]">
              <div className="grid gap-4 md:grid-cols-2">
                {emailTemplates.map((template) => (
                  <div
                    key={template.id}
                    className="bg-slate-50 rounded-xl p-4 hover:bg-slate-100 transition-colors cursor-pointer group border border-slate-200"
                    onClick={() => handleUseTemplate(template)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-medium text-slate-900 group-hover:text-brand-600 transition-colors">
                          {template.name}
                        </h3>
                        <span className="text-xs text-slate-500 bg-white px-2 py-0.5 rounded-full">
                          {template.category}
                        </span>
                      </div>
                      <FileEdit size={16} className="text-slate-400 group-hover:text-brand-600 transition-colors" />
                    </div>
                    <p className="text-sm text-slate-600 font-medium mb-2">{template.subject}</p>
                    <p className="text-xs text-slate-500 line-clamp-3">{template.body.substring(0, 150)}...</p>
                    <button className="mt-3 text-xs font-medium text-brand-600 hover:text-brand-700">
                      Use Template →
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

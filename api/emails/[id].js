const mockEmails = [
  { id: '1', subject: 'Proposal for Enterprise License', body: 'Dear John, Please find attached our proposal...', from: 'sarah.jenkins@zenith.com', to: ['john.anderson@techflow.io'], cc: [], status: 'sent', sentAt: '2024-12-08T14:30:00Z', scheduledAt: null, openedAt: '2024-12-08T15:45:00Z', clickedAt: null, trackOpens: true, trackClicks: true, relatedTo: { type: 'Deal', id: '1', name: 'Enterprise License' }, createdAt: '2024-12-08T14:30:00Z' },
  { id: '2', subject: 'Meeting Follow-up', body: 'Hi Robert, Thank you for your time today...', from: 'michael.chen@zenith.com', to: ['robert@globaldynamics.com'], cc: [], status: 'sent', sentAt: '2024-12-07T16:00:00Z', scheduledAt: null, openedAt: null, clickedAt: null, trackOpens: true, trackClicks: false, relatedTo: { type: 'Account', id: '2', name: 'Global Dynamics' }, createdAt: '2024-12-07T16:00:00Z' },
  { id: '3', subject: 'Product Demo Invitation', body: 'Hello, We would like to invite you to a demo...', from: 'sarah.jenkins@zenith.com', to: ['jennifer@securenet.io'], cc: [], status: 'scheduled', sentAt: null, scheduledAt: '2024-12-12T09:00:00Z', openedAt: null, clickedAt: null, trackOpens: true, trackClicks: true, relatedTo: { type: 'Lead', id: '3', name: 'SecureNet' }, createdAt: '2024-12-09T10:00:00Z' },
  { id: '4', subject: 'Contract Review Request', body: 'Dear James, Please review the attached contract...', from: 'michael.chen@zenith.com', to: ['james@alphawave.net'], cc: ['legal@zenith.com'], status: 'draft', sentAt: null, scheduledAt: null, openedAt: null, clickedAt: null, trackOpens: false, trackClicks: false, relatedTo: { type: 'Deal', id: '4', name: 'Consulting Retainer' }, createdAt: '2024-12-09T11:30:00Z' },
];

let emails = [...mockEmails];

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id } = req.query;

  if (req.method === 'GET') {
    const email = emails.find(e => e.id === id);
    if (!email) {
      return res.status(404).json({ error: 'Email not found' });
    }
    return res.status(200).json(email);
  }

  if (req.method === 'PUT') {
    const index = emails.findIndex(e => e.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Email not found' });
    }
    emails[index] = { ...emails[index], ...req.body };
    return res.status(200).json(emails[index]);
  }

  if (req.method === 'DELETE') {
    const index = emails.findIndex(e => e.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Email not found' });
    }
    emails.splice(index, 1);
    return res.status(200).json({ success: true });
  }

  res.status(405).json({ error: 'Method not allowed' });
};

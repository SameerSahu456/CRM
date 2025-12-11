const mockCampaigns = [
  { id: '1', name: 'Q4 Product Launch', type: 'Email', status: 'Active', startDate: '2024-11-15', endDate: '2024-12-31', budget: 15000, actualCost: 8500, expectedRevenue: 75000, actualRevenue: 45000, description: 'Launch campaign for new product features', owner: 'Emily Rodriguez', createdAt: '2024-11-01', targetAudience: 'Enterprise customers', goals: 'Generate 200 qualified leads', metrics: { sent: 5000, delivered: 4850, opened: 2100, clicked: 420, converted: 85, leads: 45, roi: 429 } },
  { id: '2', name: 'Winter Webinar Series', type: 'Webinar', status: 'Scheduled', startDate: '2024-12-10', endDate: '2024-12-20', budget: 5000, actualCost: 1200, expectedRevenue: 25000, actualRevenue: 0, description: 'Educational webinar series', owner: 'Sarah Jenkins', createdAt: '2024-11-20', targetAudience: 'SMB prospects', goals: 'Register 500 attendees', metrics: { sent: 2000, delivered: 1950, opened: 780, clicked: 195, converted: 0, leads: 0, roi: 0 } },
  { id: '3', name: 'LinkedIn Ads - Tech Leaders', type: 'Social', status: 'Active', startDate: '2024-12-01', endDate: '2025-01-31', budget: 8000, actualCost: 2400, expectedRevenue: 40000, actualRevenue: 12000, description: 'Targeted LinkedIn campaign', owner: 'Emily Rodriguez', createdAt: '2024-11-28', targetAudience: 'CTOs and VPs of Engineering', goals: 'Generate 50 demo requests', metrics: { sent: 0, delivered: 0, opened: 0, clicked: 320, converted: 28, leads: 18, roi: 400 } },
  { id: '4', name: 'Customer Success Newsletter', type: 'Email', status: 'Completed', startDate: '2024-11-01', endDate: '2024-11-30', budget: 2000, actualCost: 1800, expectedRevenue: 10000, actualRevenue: 15000, description: 'Monthly customer newsletter', owner: 'Michael Chen', createdAt: '2024-10-25', targetAudience: 'Existing customers', goals: 'Increase engagement by 20%', metrics: { sent: 1500, delivered: 1480, opened: 890, clicked: 445, converted: 120, leads: 0, roi: 733 } },
];

let campaigns = [...mockCampaigns];

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json(campaigns);
  }

  if (req.method === 'POST') {
    const newCampaign = { id: `campaign-${Date.now()}`, ...req.body, createdAt: new Date().toISOString() };
    campaigns.push(newCampaign);
    return res.status(201).json(newCampaign);
  }

  res.status(405).json({ error: 'Method not allowed' });
};

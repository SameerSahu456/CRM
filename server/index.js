import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize database
const db = new Database(join(__dirname, 'zenith.db'));

// Middleware
app.use(cors());
app.use(express.json());

// ============ LEADS API ============
app.get('/api/leads', (req, res) => {
  try {
    const leads = db.prepare('SELECT * FROM leads ORDER BY created_at DESC').all();
    res.json(leads.map(formatLead));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/leads/:id', (req, res) => {
  try {
    const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(req.params.id);
    if (!lead) return res.status(404).json({ error: 'Lead not found' });
    res.json(formatLead(lead));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/leads', (req, res) => {
  try {
    const { firstName, lastName, company, email, phone, status, source, score, owner, industry, jobTitle, budget, tags } = req.body;
    const result = db.prepare(`
      INSERT INTO leads (first_name, last_name, company, email, phone, status, source, score, owner, industry, job_title, budget, tags, created_at, last_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).run(firstName, lastName, company, email, phone, status || 'New', source || 'Website', score || 50, owner, industry, jobTitle, budget, JSON.stringify(tags || []));

    const newLead = db.prepare('SELECT * FROM leads WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(formatLead(newLead));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/leads/:id', (req, res) => {
  try {
    const { firstName, lastName, company, email, phone, status, source, score, owner, industry, jobTitle, budget, tags } = req.body;
    db.prepare(`
      UPDATE leads SET first_name = ?, last_name = ?, company = ?, email = ?, phone = ?, status = ?, source = ?, score = ?, owner = ?, industry = ?, job_title = ?, budget = ?, tags = ?, last_active = datetime('now')
      WHERE id = ?
    `).run(firstName, lastName, company, email, phone, status, source, score, owner, industry, jobTitle, budget, JSON.stringify(tags || []), req.params.id);

    const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(req.params.id);
    res.json(formatLead(lead));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/leads/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM leads WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ CONTACTS API ============
app.get('/api/contacts', (req, res) => {
  try {
    const contacts = db.prepare('SELECT * FROM contacts ORDER BY created_at DESC').all();
    res.json(contacts.map(formatContact));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/contacts/:id', (req, res) => {
  try {
    const contact = db.prepare('SELECT * FROM contacts WHERE id = ?').get(req.params.id);
    if (!contact) return res.status(404).json({ error: 'Contact not found' });
    res.json(formatContact(contact));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/contacts', (req, res) => {
  try {
    const { firstName, lastName, email, phone, mobile, jobTitle, department, accountId, accountName, type, status, avatar, owner } = req.body;
    const result = db.prepare(`
      INSERT INTO contacts (first_name, last_name, email, phone, mobile, job_title, department, account_id, account_name, type, status, avatar, owner, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(firstName, lastName, email, phone, mobile, jobTitle, department, accountId, accountName, type || 'Prospect', status || 'Active', avatar, owner);

    const newContact = db.prepare('SELECT * FROM contacts WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(formatContact(newContact));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/contacts/:id', (req, res) => {
  try {
    const { firstName, lastName, email, phone, mobile, jobTitle, department, accountId, accountName, type, status, avatar, owner, lastContacted } = req.body;
    db.prepare(`
      UPDATE contacts SET first_name = ?, last_name = ?, email = ?, phone = ?, mobile = ?, job_title = ?, department = ?, account_id = ?, account_name = ?, type = ?, status = ?, avatar = ?, owner = ?, last_contacted = ?
      WHERE id = ?
    `).run(firstName, lastName, email, phone, mobile, jobTitle, department, accountId, accountName, type, status, avatar, owner, lastContacted, req.params.id);

    const contact = db.prepare('SELECT * FROM contacts WHERE id = ?').get(req.params.id);
    res.json(formatContact(contact));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/contacts/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM contacts WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ ACCOUNTS API ============
app.get('/api/accounts', (req, res) => {
  try {
    const accounts = db.prepare('SELECT * FROM accounts ORDER BY created_at DESC').all();
    res.json(accounts.map(formatAccount));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/accounts/:id', (req, res) => {
  try {
    const account = db.prepare('SELECT * FROM accounts WHERE id = ?').get(req.params.id);
    if (!account) return res.status(404).json({ error: 'Account not found' });
    res.json(formatAccount(account));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/accounts', (req, res) => {
  try {
    const { name, industry, website, revenue, employees, location, healthScore, logo, type, status, phone, owner } = req.body;
    const result = db.prepare(`
      INSERT INTO accounts (name, industry, website, revenue, employees, location, health_score, logo, type, status, phone, owner, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(name, industry, website, revenue, employees, location, healthScore || 50, logo, type || 'Prospect', status || 'Active', phone, owner);

    const newAccount = db.prepare('SELECT * FROM accounts WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(formatAccount(newAccount));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/accounts/:id', (req, res) => {
  try {
    const { name, industry, website, revenue, employees, location, healthScore, logo, type, status, phone, owner } = req.body;
    db.prepare(`
      UPDATE accounts SET name = ?, industry = ?, website = ?, revenue = ?, employees = ?, location = ?, health_score = ?, logo = ?, type = ?, status = ?, phone = ?, owner = ?
      WHERE id = ?
    `).run(name, industry, website, revenue, employees, location, healthScore, logo, type, status, phone, owner, req.params.id);

    const account = db.prepare('SELECT * FROM accounts WHERE id = ?').get(req.params.id);
    res.json(formatAccount(account));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/accounts/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM accounts WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ DEALS API ============
app.get('/api/deals', (req, res) => {
  try {
    const deals = db.prepare('SELECT * FROM deals ORDER BY created_at DESC').all();
    res.json(deals.map(formatDeal));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/deals/:id', (req, res) => {
  try {
    const deal = db.prepare('SELECT * FROM deals WHERE id = ?').get(req.params.id);
    if (!deal) return res.status(404).json({ error: 'Deal not found' });
    res.json(formatDeal(deal));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/deals', (req, res) => {
  try {
    const { title, company, accountId, value, stage, probability, owner, closingDate, contactName, forecast, type } = req.body;
    const result = db.prepare(`
      INSERT INTO deals (title, company, account_id, value, stage, probability, owner, closing_date, contact_name, forecast, type, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(title, company, accountId, value, stage || 'Qualification', probability || 20, owner, closingDate, contactName, forecast || 'Pipeline', type || 'New Business');

    const newDeal = db.prepare('SELECT * FROM deals WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(formatDeal(newDeal));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/deals/:id', (req, res) => {
  try {
    const { title, company, accountId, value, stage, probability, owner, closingDate, contactName, forecast, type, lostReason } = req.body;
    db.prepare(`
      UPDATE deals SET title = ?, company = ?, account_id = ?, value = ?, stage = ?, probability = ?, owner = ?, closing_date = ?, contact_name = ?, forecast = ?, type = ?, lost_reason = ?
      WHERE id = ?
    `).run(title, company, accountId, value, stage, probability, owner, closingDate, contactName, forecast, type, lostReason, req.params.id);

    const deal = db.prepare('SELECT * FROM deals WHERE id = ?').get(req.params.id);
    res.json(formatDeal(deal));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/deals/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM deals WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ TASKS API ============
app.get('/api/tasks', (req, res) => {
  try {
    const tasks = db.prepare('SELECT * FROM tasks ORDER BY due_date ASC').all();
    res.json(tasks.map(formatTask));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/tasks/:id', (req, res) => {
  try {
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json(formatTask(task));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/tasks', (req, res) => {
  try {
    const { title, description, type, status, priority, dueDate, dueTime, relatedToType, relatedToId, relatedToName, assignedTo, createdBy } = req.body;
    const result = db.prepare(`
      INSERT INTO tasks (title, description, type, status, priority, due_date, due_time, related_to_type, related_to_id, related_to_name, assigned_to, created_by, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(title, description, type || 'Task', status || 'Not Started', priority || 'Normal', dueDate, dueTime, relatedToType, relatedToId, relatedToName, assignedTo, createdBy);

    const newTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(formatTask(newTask));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/tasks/:id', (req, res) => {
  try {
    const { title, description, type, status, priority, dueDate, dueTime, relatedToType, relatedToId, relatedToName, assignedTo, completedAt } = req.body;
    db.prepare(`
      UPDATE tasks SET title = ?, description = ?, type = ?, status = ?, priority = ?, due_date = ?, due_time = ?, related_to_type = ?, related_to_id = ?, related_to_name = ?, assigned_to = ?, completed_at = ?
      WHERE id = ?
    `).run(title, description, type, status, priority, dueDate, dueTime, relatedToType, relatedToId, relatedToName, assignedTo, completedAt, req.params.id);

    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
    res.json(formatTask(task));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/tasks/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ TICKETS API ============
app.get('/api/tickets', (req, res) => {
  try {
    const tickets = db.prepare('SELECT * FROM tickets ORDER BY created_at DESC').all();
    res.json(tickets.map(formatTicket));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/tickets/:id', (req, res) => {
  try {
    const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(req.params.id);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    res.json(formatTicket(ticket));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/tickets', (req, res) => {
  try {
    const { subject, description, status, priority, type, category, contactId, contactName, contactEmail, accountId, accountName, assignedTo } = req.body;
    const ticketNumber = `TKT-${String(Date.now()).slice(-6)}`;
    const result = db.prepare(`
      INSERT INTO tickets (ticket_number, subject, description, status, priority, type, category, contact_id, contact_name, contact_email, account_id, account_name, assigned_to, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).run(ticketNumber, subject, description, status || 'Open', priority || 'Medium', type || 'Question', category, contactId, contactName, contactEmail, accountId, accountName, assignedTo);

    const newTicket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(formatTicket(newTicket));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/tickets/:id', (req, res) => {
  try {
    const { subject, description, status, priority, type, category, assignedTo, resolvedAt, closedAt } = req.body;
    db.prepare(`
      UPDATE tickets SET subject = ?, description = ?, status = ?, priority = ?, type = ?, category = ?, assigned_to = ?, resolved_at = ?, closed_at = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(subject, description, status, priority, type, category, assignedTo, resolvedAt, closedAt, req.params.id);

    const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(req.params.id);
    res.json(formatTicket(ticket));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/tickets/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM tickets WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ CAMPAIGNS API ============
app.get('/api/campaigns', (req, res) => {
  try {
    const campaigns = db.prepare('SELECT * FROM campaigns ORDER BY created_at DESC').all();
    res.json(campaigns.map(formatCampaign));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/campaigns/:id', (req, res) => {
  try {
    const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(req.params.id);
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
    res.json(formatCampaign(campaign));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/campaigns', (req, res) => {
  try {
    const { name, type, status, startDate, endDate, budget, actualCost, expectedRevenue, actualRevenue, owner, targetAudience, goals } = req.body;
    const result = db.prepare(`
      INSERT INTO campaigns (name, type, status, start_date, end_date, budget, actual_cost, expected_revenue, actual_revenue, owner, target_audience, goals, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(name, type || 'Email', status || 'Planning', startDate, endDate, budget, actualCost, expectedRevenue, actualRevenue, owner, targetAudience, goals);

    const newCampaign = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(formatCampaign(newCampaign));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/campaigns/:id', (req, res) => {
  try {
    const { name, type, status, startDate, endDate, budget, actualCost, expectedRevenue, actualRevenue, owner, targetAudience, goals, metrics } = req.body;
    db.prepare(`
      UPDATE campaigns SET name = ?, type = ?, status = ?, start_date = ?, end_date = ?, budget = ?, actual_cost = ?, expected_revenue = ?, actual_revenue = ?, owner = ?, target_audience = ?, goals = ?, metrics = ?
      WHERE id = ?
    `).run(name, type, status, startDate, endDate, budget, actualCost, expectedRevenue, actualRevenue, owner, targetAudience, goals, JSON.stringify(metrics || {}), req.params.id);

    const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(req.params.id);
    res.json(formatCampaign(campaign));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/campaigns/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM campaigns WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ NOTIFICATIONS API ============
app.get('/api/notifications', (req, res) => {
  try {
    const notifications = db.prepare('SELECT * FROM notifications ORDER BY created_at DESC LIMIT 50').all();
    res.json(notifications.map(formatNotification));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/notifications/:id/read', (req, res) => {
  try {
    db.prepare('UPDATE notifications SET read = 1 WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/notifications/read-all', (req, res) => {
  try {
    db.prepare('UPDATE notifications SET read = 1').run();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/notifications/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM notifications WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ DASHBOARD STATS API ============
app.get('/api/dashboard/stats', (req, res) => {
  try {
    const totalRevenue = db.prepare("SELECT SUM(value) as total FROM deals WHERE stage = 'Closed Won'").get();
    const totalDeals = db.prepare("SELECT COUNT(*) as count FROM deals WHERE stage NOT IN ('Closed Won', 'Closed Lost')").get();
    const totalLeads = db.prepare("SELECT COUNT(*) as count FROM leads").get();
    const totalAccounts = db.prepare("SELECT COUNT(*) as count FROM accounts").get();
    const totalContacts = db.prepare("SELECT COUNT(*) as count FROM contacts").get();
    const openTasks = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status NOT IN ('Completed', 'Cancelled')").get();
    const openTickets = db.prepare("SELECT COUNT(*) as count FROM tickets WHERE status NOT IN ('Resolved', 'Closed')").get();
    const wonDeals = db.prepare("SELECT COUNT(*) as won FROM deals WHERE stage = 'Closed Won'").get();
    const totalClosedDeals = db.prepare("SELECT COUNT(*) as total FROM deals WHERE stage IN ('Closed Won', 'Closed Lost')").get();

    const conversionRate = totalClosedDeals.total > 0 ? Math.round((wonDeals.won / totalClosedDeals.total) * 100) : 0;

    res.json({
      totalLeads: totalLeads.count,
      totalDeals: totalDeals.count,
      totalAccounts: totalAccounts.count,
      totalContacts: totalContacts.count,
      totalRevenue: totalRevenue.total || 0,
      openTasks: openTasks.count,
      openTickets: openTickets.count,
      conversionRate
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/dashboard/pipeline', (req, res) => {
  try {
    const pipeline = db.prepare(`
      SELECT stage, COUNT(*) as count, SUM(value) as value
      FROM deals
      GROUP BY stage
      ORDER BY CASE stage
        WHEN 'Qualification' THEN 1
        WHEN 'Discovery' THEN 2
        WHEN 'Proposal' THEN 3
        WHEN 'Negotiation' THEN 4
        WHEN 'Closed Won' THEN 5
        WHEN 'Closed Lost' THEN 6
      END
    `).all();

    const colors = {
      'Qualification': '#4f46e5',
      'Discovery': '#0891b2',
      'Proposal': '#7c3aed',
      'Negotiation': '#ea580c',
      'Closed Won': '#059669',
      'Closed Lost': '#dc2626'
    };

    res.json(pipeline.map(p => ({
      stage: p.stage,
      count: p.count,
      value: p.value || 0,
      color: colors[p.stage] || '#6b7280'
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/dashboard/lead-sources', (req, res) => {
  try {
    const sources = db.prepare(`
      SELECT source as name, COUNT(*) as value
      FROM leads
      GROUP BY source
    `).all();

    const colors = ['#4f46e5', '#059669', '#0891b2', '#7c3aed', '#dc2626', '#ea580c'];

    res.json(sources.map((s, i) => ({
      name: s.name,
      value: s.value,
      color: colors[i % colors.length]
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ CALENDAR EVENTS API ============
app.get('/api/calendar-events', (req, res) => {
  try {
    const events = db.prepare('SELECT * FROM calendar_events ORDER BY start_time ASC').all();
    res.json(events.map(formatCalendarEvent));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/calendar-events/:id', (req, res) => {
  try {
    const event = db.prepare('SELECT * FROM calendar_events WHERE id = ?').get(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    res.json(formatCalendarEvent(event));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/calendar-events', (req, res) => {
  try {
    const { title, description, type, startTime, endTime, allDay, location, meetingLink, owner, color, relatedToType, relatedToId, relatedToName, attendees } = req.body;
    const result = db.prepare(`
      INSERT INTO calendar_events (title, description, type, start_time, end_time, all_day, location, meeting_link, owner, color, related_to_type, related_to_id, related_to_name, attendees)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(title, description, type || 'Meeting', startTime, endTime, allDay ? 1 : 0, location, meetingLink, owner, color || '#4f46e5', relatedToType, relatedToId, relatedToName, JSON.stringify(attendees || []));

    const newEvent = db.prepare('SELECT * FROM calendar_events WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(formatCalendarEvent(newEvent));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/calendar-events/:id', (req, res) => {
  try {
    const { title, description, type, startTime, endTime, allDay, location, meetingLink, owner, color, relatedToType, relatedToId, relatedToName, attendees } = req.body;
    db.prepare(`
      UPDATE calendar_events SET title = ?, description = ?, type = ?, start_time = ?, end_time = ?, all_day = ?, location = ?, meeting_link = ?, owner = ?, color = ?, related_to_type = ?, related_to_id = ?, related_to_name = ?, attendees = ?
      WHERE id = ?
    `).run(title, description, type, startTime, endTime, allDay ? 1 : 0, location, meetingLink, owner, color, relatedToType, relatedToId, relatedToName, JSON.stringify(attendees || []), req.params.id);

    const event = db.prepare('SELECT * FROM calendar_events WHERE id = ?').get(req.params.id);
    res.json(formatCalendarEvent(event));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/calendar-events/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM calendar_events WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ EMAILS API ============
app.get('/api/emails', (req, res) => {
  try {
    const emails = db.prepare('SELECT * FROM emails ORDER BY created_at DESC').all();
    res.json(emails.map(formatEmail));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/emails/:id', (req, res) => {
  try {
    const email = db.prepare('SELECT * FROM emails WHERE id = ?').get(req.params.id);
    if (!email) return res.status(404).json({ error: 'Email not found' });
    res.json(formatEmail(email));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/emails', (req, res) => {
  try {
    const { subject, body, from, to, cc, status, scheduledAt, trackOpens, trackClicks, relatedToType, relatedToId, relatedToName } = req.body;
    const sentAt = status === 'Sent' ? new Date().toISOString() : null;
    const result = db.prepare(`
      INSERT INTO emails (subject, body, from_address, to_addresses, cc_addresses, status, sent_at, scheduled_at, track_opens, track_clicks, related_to_type, related_to_id, related_to_name, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(subject, body, from, JSON.stringify(to || []), JSON.stringify(cc || []), status || 'Draft', sentAt, scheduledAt, trackOpens ? 1 : 0, trackClicks ? 1 : 0, relatedToType, relatedToId, relatedToName);

    const newEmail = db.prepare('SELECT * FROM emails WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(formatEmail(newEmail));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/emails/:id', (req, res) => {
  try {
    const { subject, body, from, to, cc, status, scheduledAt, trackOpens, trackClicks, relatedToType, relatedToId, relatedToName } = req.body;
    const sentAt = status === 'Sent' ? new Date().toISOString() : null;
    db.prepare(`
      UPDATE emails SET subject = ?, body = ?, from_address = ?, to_addresses = ?, cc_addresses = ?, status = ?, sent_at = COALESCE(?, sent_at), scheduled_at = ?, track_opens = ?, track_clicks = ?, related_to_type = ?, related_to_id = ?, related_to_name = ?
      WHERE id = ?
    `).run(subject, body, from, JSON.stringify(to || []), JSON.stringify(cc || []), status, sentAt, scheduledAt, trackOpens ? 1 : 0, trackClicks ? 1 : 0, relatedToType, relatedToId, relatedToName, req.params.id);

    const email = db.prepare('SELECT * FROM emails WHERE id = ?').get(req.params.id);
    res.json(formatEmail(email));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/emails/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM emails WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ REPORTS API ============
app.get('/api/reports/revenue-by-month', (req, res) => {
  try {
    // Generate revenue data by month for 2024
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const revenueByMonth = months.map((name, index) => {
      const baseRevenue = 180000 + Math.random() * 120000;
      const target = 200000 + (index * 10000);
      return {
        name,
        revenue: Math.round(baseRevenue),
        target: Math.round(target)
      };
    });
    res.json(revenueByMonth);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/reports/leads-by-source', (req, res) => {
  try {
    const sources = db.prepare(`
      SELECT source as name, COUNT(*) as value
      FROM leads
      GROUP BY source
    `).all();

    const colors = ['#4f46e5', '#059669', '#0891b2', '#7c3aed', '#dc2626', '#ea580c'];
    res.json(sources.map((s, i) => ({
      name: s.name,
      value: s.value,
      color: colors[i % colors.length]
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/reports/pipeline-summary', (req, res) => {
  try {
    const pipeline = db.prepare(`
      SELECT stage as name, COUNT(*) as deals, SUM(value) as value
      FROM deals
      WHERE stage NOT IN ('Closed Won', 'Closed Lost')
      GROUP BY stage
      ORDER BY CASE stage
        WHEN 'Qualification' THEN 1
        WHEN 'Discovery' THEN 2
        WHEN 'Proposal' THEN 3
        WHEN 'Negotiation' THEN 4
      END
    `).all();

    res.json(pipeline.map(p => ({
      name: p.name,
      deals: p.deals,
      value: p.value || 0
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/reports/sales-activity', (req, res) => {
  try {
    // Generate sample sales activity data by week
    const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
    const salesActivity = weeks.map(name => ({
      name,
      calls: Math.floor(30 + Math.random() * 30),
      emails: Math.floor(80 + Math.random() * 50),
      meetings: Math.floor(10 + Math.random() * 15)
    }));
    res.json(salesActivity);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ HELPER FUNCTIONS ============
function formatLead(lead) {
  return {
    id: String(lead.id),
    // Lead Information
    firstName: lead.first_name,
    lastName: lead.last_name,
    email: lead.email,
    mobile: lead.mobile,
    phone: lead.phone,
    mobileAlternate: lead.mobile_alternate,
    phoneAlternate: lead.phone_alternate,
    campaignSource: lead.campaign_source,
    website: lead.website,
    leadOwner: lead.lead_owner,
    company: lead.company,
    accountType: lead.account_type,
    source: lead.source,
    status: lead.status,
    leadCategory: lead.lead_category,
    createdBy: lead.created_by,
    modifiedBy: lead.modified_by,
    score: lead.score,
    lastActive: lead.last_active,
    avatar: lead.avatar,
    owner: lead.owner,
    createdAt: lead.created_at,
    modifiedAt: lead.modified_at,
    tags: lead.tags ? JSON.parse(lead.tags) : [],
    budget: lead.budget,
    timeline: lead.timeline,
    industry: lead.industry,
    jobTitle: lead.job_title,
    // JSON fields
    orderInfo: lead.order_info ? JSON.parse(lead.order_info) : null,
    formsInfo: lead.forms_info ? JSON.parse(lead.forms_info) : null,
    billingAddress: lead.billing_address ? JSON.parse(lead.billing_address) : null,
    description: lead.description,
    notes: lead.notes,
    visitSummary: lead.visit_summary ? JSON.parse(lead.visit_summary) : null
  };
}

function formatContact(contact) {
  return {
    id: String(contact.id),
    // Contact Information
    salutation: contact.salutation,
    firstName: contact.first_name,
    lastName: contact.last_name,
    fullName: contact.full_name,
    email: contact.email,
    secondaryEmail: contact.secondary_email,
    phone: contact.phone,
    mobile: contact.mobile,
    homePhone: contact.home_phone,
    otherPhone: contact.other_phone,
    fax: contact.fax,
    assistant: contact.assistant,
    assistantPhone: contact.assistant_phone,
    // Professional Info
    jobTitle: contact.job_title,
    department: contact.department,
    reportingTo: contact.reporting_to,
    reportingToId: contact.reporting_to_id,
    dateOfBirth: contact.date_of_birth,
    skypeId: contact.skype_id,
    twitter: contact.twitter,
    // Account Relation
    accountId: contact.account_id,
    accountName: contact.account_name,
    vendorName: contact.vendor_name,
    // Classification
    type: contact.type,
    status: contact.status,
    leadSource: contact.lead_source,
    // Address Information (JSON)
    mailingAddress: contact.mailing_address ? JSON.parse(contact.mailing_address) : null,
    otherAddress: contact.other_address ? JSON.parse(contact.other_address) : null,
    // Description
    description: contact.description,
    notes: contact.notes,
    // System Fields
    avatar: contact.avatar,
    lastContacted: contact.last_contacted,
    createdAt: contact.created_at,
    modifiedAt: contact.modified_at,
    createdBy: contact.created_by,
    modifiedBy: contact.modified_by,
    owner: contact.owner,
    tags: contact.tags ? JSON.parse(contact.tags) : [],
    preferredContact: contact.preferred_contact,
    doNotContact: Boolean(contact.do_not_contact),
    emailOptOut: Boolean(contact.email_opt_out),
    // Hierarchy (JSON)
    hierarchy: contact.hierarchy ? JSON.parse(contact.hierarchy) : null
  };
}

function formatAccount(account) {
  return {
    id: String(account.id),
    // Description Information
    description: account.description,
    group: account.group_name,
    // Account Information
    name: account.name,
    phone: account.phone,
    website: account.website,
    accountOwner: account.account_owner,
    industry: account.industry,
    accountType: account.account_type,
    rating: account.rating,
    accountNumber: account.account_number,
    accountSite: account.account_site,
    parentAccount: account.parent_account,
    parentAccountId: account.parent_account_id,
    ticker: account.ticker,
    ownership: account.ownership,
    // Other Info
    territory: account.territory,
    dealClosingDate: account.deal_closing_date,
    supportStartDate: account.support_start_date,
    supportExpiryDate: account.support_expiry_date,
    productDetails: account.product_details,
    purchaseOrderNo: account.purchase_order_no,
    lockingPeriodEndDate: account.locking_period_end_date,
    sicCode: account.sic_code,
    noOfRetailCounters: account.no_of_retail_counters,
    // Contact Info
    contactName: account.contact_name,
    contactEmail: account.contact_email,
    contactMobile: account.contact_mobile,
    contactPhone: account.contact_phone,
    fax: account.fax,
    // Employees & Revenue
    employees: account.employees,
    revenue: account.revenue,
    annualRevenue: account.annual_revenue,
    // Address Information
    location: account.location,
    billingAddress: account.billing_address ? JSON.parse(account.billing_address) : null,
    shippingAddress: account.shipping_address ? JSON.parse(account.shipping_address) : null,
    // System Fields
    healthScore: account.health_score,
    logo: account.logo,
    type: account.type,
    status: account.status,
    owner: account.owner,
    createdBy: account.created_by,
    modifiedBy: account.modified_by,
    createdAt: account.created_at,
    modifiedAt: account.modified_at
  };
}

function formatDeal(deal) {
  return {
    id: String(deal.id),
    // Deal Information
    title: deal.title,
    dealName: deal.deal_name,
    accountId: deal.account_id,
    accountName: deal.account_name,
    contactId: deal.contact_id,
    contactName: deal.contact_name,
    typeOfOrder: deal.type_of_order,
    createdByRM: deal.created_by_rm,
    dealOwner: deal.deal_owner,
    amount: deal.amount,
    value: deal.value,
    closingDate: deal.closing_date,
    leadSource: deal.lead_source,
    stage: deal.stage,
    probability: deal.probability,
    expectedRevenue: deal.expected_revenue,
    campaignSource: deal.campaign_source,
    nextStep: deal.next_step,
    // Product Information (JSON)
    productInfo: deal.product_info ? JSON.parse(deal.product_info) : null,
    products: deal.products ? JSON.parse(deal.products) : [],
    // Forms Information (JSON)
    formsInfo: deal.forms_info ? JSON.parse(deal.forms_info) : null,
    // Other Info
    territory: deal.territory,
    billingDeliveryDate: deal.billing_delivery_date,
    poDate: deal.po_date,
    poNumber: deal.po_number,
    paymentMode: deal.payment_mode,
    paymentReceived: Boolean(deal.payment_received),
    paymentReceivedDate: deal.payment_received_date,
    paymentBankName: deal.payment_bank_name,
    paymentChequeNo: deal.payment_cheque_no,
    paymentOtherDetails: deal.payment_other_details,
    paymentRefNo: deal.payment_ref_no,
    supportStartDate: deal.support_start_date,
    supportExpiryDate: deal.support_expiry_date,
    lockingPeriodEndDate: deal.locking_period_end_date,
    // Billing Address (JSON)
    billingAddress: deal.billing_address ? JSON.parse(deal.billing_address) : null,
    // Description Information
    description: deal.description,
    notes: deal.notes,
    // System Fields
    company: deal.company,
    owner: deal.owner,
    createdAt: deal.created_at,
    modifiedAt: deal.modified_at,
    createdBy: deal.created_by,
    modifiedBy: deal.modified_by,
    lostReason: deal.lost_reason,
    competitorName: deal.competitor_name,
    forecast: deal.forecast,
    type: deal.type
  };
}

function formatTask(task) {
  return {
    id: String(task.id),
    title: task.title,
    description: task.description,
    type: task.type,
    status: task.status,
    priority: task.priority,
    dueDate: task.due_date,
    dueTime: task.due_time,
    relatedTo: task.related_to_type ? {
      type: task.related_to_type,
      id: task.related_to_id,
      name: task.related_to_name
    } : null,
    assignedTo: task.assigned_to,
    createdBy: task.created_by,
    createdAt: task.created_at,
    completedAt: task.completed_at
  };
}

function formatTicket(ticket) {
  return {
    id: String(ticket.id),
    ticketNumber: ticket.ticket_number,
    subject: ticket.subject,
    description: ticket.description,
    status: ticket.status,
    priority: ticket.priority,
    type: ticket.type,
    category: ticket.category,
    contactId: ticket.contact_id,
    contactName: ticket.contact_name,
    contactEmail: ticket.contact_email,
    accountId: ticket.account_id,
    accountName: ticket.account_name,
    assignedTo: ticket.assigned_to,
    createdAt: ticket.created_at,
    updatedAt: ticket.updated_at,
    resolvedAt: ticket.resolved_at,
    closedAt: ticket.closed_at
  };
}

function formatCampaign(campaign) {
  return {
    id: String(campaign.id),
    name: campaign.name,
    type: campaign.type,
    status: campaign.status,
    startDate: campaign.start_date,
    endDate: campaign.end_date,
    budget: campaign.budget,
    actualCost: campaign.actual_cost,
    expectedRevenue: campaign.expected_revenue,
    actualRevenue: campaign.actual_revenue,
    owner: campaign.owner,
    createdAt: campaign.created_at,
    targetAudience: campaign.target_audience,
    goals: campaign.goals,
    metrics: campaign.metrics ? JSON.parse(campaign.metrics) : {}
  };
}

function formatNotification(notification) {
  return {
    id: String(notification.id),
    type: notification.type,
    title: notification.title,
    message: notification.message,
    read: Boolean(notification.read),
    createdAt: notification.created_at,
    relatedTo: notification.related_to_type ? {
      type: notification.related_to_type,
      id: notification.related_to_id
    } : null
  };
}

function formatCalendarEvent(event) {
  return {
    id: String(event.id),
    title: event.title,
    description: event.description,
    type: event.type,
    start: event.start_time,
    end: event.end_time,
    allDay: Boolean(event.all_day),
    location: event.location,
    meetingLink: event.meeting_link,
    owner: event.owner,
    color: event.color,
    relatedTo: event.related_to_type ? {
      type: event.related_to_type,
      id: event.related_to_id,
      name: event.related_to_name
    } : null,
    attendees: event.attendees ? JSON.parse(event.attendees) : []
  };
}

function formatEmail(email) {
  return {
    id: String(email.id),
    subject: email.subject,
    body: email.body,
    from: email.from_address,
    to: email.to_addresses ? JSON.parse(email.to_addresses) : [],
    cc: email.cc_addresses ? JSON.parse(email.cc_addresses) : [],
    status: email.status,
    sentAt: email.sent_at,
    scheduledAt: email.scheduled_at,
    openedAt: email.opened_at,
    clickedAt: email.clicked_at,
    trackOpens: Boolean(email.track_opens),
    trackClicks: Boolean(email.track_clicks),
    relatedTo: email.related_to_type ? {
      type: email.related_to_type,
      id: email.related_to_id,
      name: email.related_to_name
    } : null,
    createdAt: email.created_at
  };
}

// Start server
app.listen(PORT, () => {
  console.log(`Zenith CRM API Server running on http://localhost:${PORT}`);
});

-- ============================================================
-- ZENITH CRM - ANALYTICS QUERIES FOR DASHBOARD
-- ============================================================
-- This file contains optimized SQL queries for dashboard analytics
-- All queries use proper JOINs, aggregations, and window functions
-- ============================================================

-- ============================================================
-- 1. SALES PIPELINE OVERVIEW
-- ============================================================

-- Total Pipeline Value by Stage
SELECT
    stage,
    COUNT(*) as deal_count,
    SUM(value) as total_value,
    AVG(value) as avg_deal_size,
    AVG(probability) as avg_probability,
    SUM(value * probability / 100) as weighted_value
FROM deals
WHERE stage NOT IN ('Closed Won', 'Closed Lost')
GROUP BY stage
ORDER BY
    CASE stage
        WHEN 'Qualification' THEN 1
        WHEN 'Needs Analysis' THEN 2
        WHEN 'Proposal' THEN 3
        WHEN 'Negotiation' THEN 4
        ELSE 5
    END;

-- Pipeline by Sales Rep (Owner)
SELECT
    u.name as sales_rep,
    u.email,
    COUNT(d.id) as active_deals,
    SUM(d.value) as pipeline_value,
    AVG(d.value) as avg_deal_size,
    SUM(CASE WHEN d.stage = 'Negotiation' THEN d.value ELSE 0 END) as negotiation_value,
    SUM(d.value * d.probability / 100) as weighted_pipeline
FROM users u
LEFT JOIN deals d ON u.id = d.owner_id AND d.stage NOT IN ('Closed Won', 'Closed Lost')
GROUP BY u.id, u.name, u.email
ORDER BY pipeline_value DESC NULLS LAST;

-- ============================================================
-- 2. REVENUE ANALYTICS
-- ============================================================

-- Monthly Revenue Trend (Closed Won deals)
SELECT
    DATE_TRUNC('month', closing_date) as month,
    COUNT(*) as deals_closed,
    SUM(value) as revenue,
    AVG(value) as avg_deal_value
FROM deals
WHERE stage = 'Closed Won'
GROUP BY DATE_TRUNC('month', closing_date)
ORDER BY month DESC;

-- Revenue by Industry (via Accounts)
SELECT
    a.industry,
    COUNT(DISTINCT d.id) as deals_count,
    SUM(d.value) as total_revenue,
    AVG(d.value) as avg_deal_size
FROM deals d
JOIN accounts a ON d.account_id = a.id
WHERE d.stage = 'Closed Won'
GROUP BY a.industry
ORDER BY total_revenue DESC;

-- Revenue by Sales Rep (Leaderboard)
SELECT
    u.name as sales_rep,
    COUNT(d.id) as deals_won,
    SUM(d.value) as total_revenue,
    AVG(d.value) as avg_deal_size,
    RANK() OVER (ORDER BY SUM(d.value) DESC) as rank
FROM users u
LEFT JOIN deals d ON u.id = d.owner_id AND d.stage = 'Closed Won'
GROUP BY u.id, u.name
ORDER BY total_revenue DESC NULLS LAST;

-- ============================================================
-- 3. WIN/LOSS ANALYSIS
-- ============================================================

-- Win Rate by Sales Rep
SELECT
    u.name as sales_rep,
    COUNT(CASE WHEN d.stage = 'Closed Won' THEN 1 END) as won_deals,
    COUNT(CASE WHEN d.stage = 'Closed Lost' THEN 1 END) as lost_deals,
    COUNT(CASE WHEN d.stage IN ('Closed Won', 'Closed Lost') THEN 1 END) as total_closed,
    ROUND(
        100.0 * COUNT(CASE WHEN d.stage = 'Closed Won' THEN 1 END) /
        NULLIF(COUNT(CASE WHEN d.stage IN ('Closed Won', 'Closed Lost') THEN 1 END), 0),
        2
    ) as win_rate_percentage
FROM users u
LEFT JOIN deals d ON u.id = d.owner_id
GROUP BY u.id, u.name
HAVING COUNT(CASE WHEN d.stage IN ('Closed Won', 'Closed Lost') THEN 1 END) > 0
ORDER BY win_rate_percentage DESC NULLS LAST;

-- Win/Loss by Lead Source
SELECT
    lead_source,
    COUNT(CASE WHEN stage = 'Closed Won' THEN 1 END) as won_count,
    COUNT(CASE WHEN stage = 'Closed Lost' THEN 1 END) as lost_count,
    SUM(CASE WHEN stage = 'Closed Won' THEN value ELSE 0 END) as won_value,
    SUM(CASE WHEN stage = 'Closed Lost' THEN value ELSE 0 END) as lost_value,
    ROUND(
        100.0 * COUNT(CASE WHEN stage = 'Closed Won' THEN 1 END) /
        NULLIF(COUNT(CASE WHEN stage IN ('Closed Won', 'Closed Lost') THEN 1 END), 0),
        2
    ) as win_rate_percentage
FROM deals
WHERE lead_source IS NOT NULL
GROUP BY lead_source
ORDER BY won_value DESC;

-- ============================================================
-- 4. LEAD FUNNEL ANALYTICS
-- ============================================================

-- Lead Conversion Funnel
SELECT
    stage,
    COUNT(*) as lead_count,
    SUM(estimated_value) as total_value,
    ROUND(
        100.0 * COUNT(*) / SUM(COUNT(*)) OVER (),
        2
    ) as percentage_of_total
FROM leads
GROUP BY stage
ORDER BY
    CASE stage
        WHEN 'New' THEN 1
        WHEN 'Contacted' THEN 2
        WHEN 'Qualified' THEN 3
        WHEN 'Converted' THEN 4
        WHEN 'Lost' THEN 5
        ELSE 6
    END;

-- Lead Source Effectiveness
SELECT
    source,
    COUNT(*) as total_leads,
    COUNT(CASE WHEN stage = 'Converted' THEN 1 END) as converted_leads,
    COUNT(CASE WHEN stage = 'Lost' THEN 1 END) as lost_leads,
    ROUND(
        100.0 * COUNT(CASE WHEN stage = 'Converted' THEN 1 END) /
        NULLIF(COUNT(*), 0),
        2
    ) as conversion_rate,
    AVG(estimated_value) as avg_lead_value
FROM leads
GROUP BY source
ORDER BY conversion_rate DESC NULLS LAST;

-- Leads by Sales Rep
SELECT
    u.name as sales_rep,
    COUNT(l.id) as total_leads,
    COUNT(CASE WHEN l.stage = 'New' THEN 1 END) as new_leads,
    COUNT(CASE WHEN l.stage = 'Contacted' THEN 1 END) as contacted_leads,
    COUNT(CASE WHEN l.stage = 'Qualified' THEN 1 END) as qualified_leads,
    COUNT(CASE WHEN l.stage = 'Converted' THEN 1 END) as converted_leads,
    SUM(l.estimated_value) as total_lead_value
FROM users u
LEFT JOIN leads l ON u.id = l.assigned_to
GROUP BY u.id, u.name
ORDER BY total_leads DESC;

-- ============================================================
-- 5. ACTIVITY ANALYTICS
-- ============================================================

-- Task Completion by Sales Rep
SELECT
    u.name as sales_rep,
    COUNT(t.id) as total_tasks,
    COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_tasks,
    COUNT(CASE WHEN t.status = 'in_progress' THEN 1 END) as in_progress_tasks,
    COUNT(CASE WHEN t.status = 'pending' THEN 1 END) as pending_tasks,
    COUNT(CASE WHEN t.status = 'pending' AND t.due_date < CURRENT_DATE THEN 1 END) as overdue_tasks,
    ROUND(
        100.0 * COUNT(CASE WHEN t.status = 'completed' THEN 1 END) /
        NULLIF(COUNT(t.id), 0),
        2
    ) as completion_rate
FROM users u
LEFT JOIN tasks t ON u.id = t.assigned_to
GROUP BY u.id, u.name
ORDER BY total_tasks DESC;

-- Upcoming Activities (Next 7 Days)
SELECT
    u.name as owner,
    ce.title,
    ce.type,
    ce.start_time,
    ce.location,
    ce.related_to_type,
    CASE
        WHEN ce.related_to_type = 'deal' THEN d.title
        WHEN ce.related_to_type = 'lead' THEN l.company_name
    END as related_to_name
FROM calendar_events ce
JOIN users u ON ce.owner_id = u.id
LEFT JOIN deals d ON ce.related_to_type = 'deal' AND ce.related_to_id = d.id
LEFT JOIN leads l ON ce.related_to_type = 'lead' AND ce.related_to_id = l.id
WHERE ce.start_time BETWEEN CURRENT_TIMESTAMP AND CURRENT_TIMESTAMP + INTERVAL '7 days'
ORDER BY ce.start_time ASC;

-- Email Activity by Sales Rep
SELECT
    u.name as sales_rep,
    COUNT(e.id) as total_emails,
    COUNT(CASE WHEN e.status = 'sent' THEN 1 END) as sent_emails,
    COUNT(CASE WHEN e.status = 'draft' THEN 1 END) as draft_emails,
    COUNT(CASE WHEN DATE(e.sent_at) = CURRENT_DATE THEN 1 END) as emails_today
FROM users u
LEFT JOIN emails e ON u.id = e.owner_id
GROUP BY u.id, u.name
ORDER BY total_emails DESC;

-- ============================================================
-- 6. FORECAST ANALYTICS
-- ============================================================

-- Monthly Sales Forecast (Weighted Pipeline)
SELECT
    DATE_TRUNC('month', closing_date) as forecast_month,
    COUNT(*) as deal_count,
    SUM(value) as total_value,
    SUM(value * probability / 100) as weighted_forecast,
    STRING_AGG(DISTINCT stage, ', ') as stages
FROM deals
WHERE stage NOT IN ('Closed Won', 'Closed Lost')
    AND closing_date IS NOT NULL
GROUP BY DATE_TRUNC('month', closing_date)
ORDER BY forecast_month ASC;

-- Quarterly Forecast
SELECT
    DATE_TRUNC('quarter', closing_date) as quarter,
    COUNT(*) as deal_count,
    SUM(value) as pipeline_value,
    SUM(value * probability / 100) as weighted_forecast,
    AVG(probability) as avg_probability
FROM deals
WHERE stage NOT IN ('Closed Won', 'Closed Lost')
    AND closing_date IS NOT NULL
GROUP BY DATE_TRUNC('quarter', closing_date)
ORDER BY quarter ASC;

-- ============================================================
-- 7. ACCOUNT HEALTH ANALYTICS
-- ============================================================

-- Account Health Distribution
SELECT
    CASE
        WHEN health_score >= 80 THEN 'Healthy (80-100)'
        WHEN health_score >= 60 THEN 'Good (60-79)'
        WHEN health_score >= 40 THEN 'At Risk (40-59)'
        ELSE 'Critical (<40)'
    END as health_category,
    COUNT(*) as account_count,
    ROUND(AVG(revenue), 2) as avg_revenue,
    SUM(revenue) as total_revenue
FROM accounts
WHERE status = 'active'
GROUP BY
    CASE
        WHEN health_score >= 80 THEN 'Healthy (80-100)'
        WHEN health_score >= 60 THEN 'Good (60-79)'
        WHEN health_score >= 40 THEN 'At Risk (40-59)'
        ELSE 'Critical (<40)'
    END
ORDER BY
    CASE
        WHEN health_score >= 80 THEN 'Healthy (80-100)'
        WHEN health_score >= 60 THEN 'Good (60-79)'
        WHEN health_score >= 40 THEN 'At Risk (40-59)'
        ELSE 'Critical (<40)'
    END;

-- Top Accounts by Revenue Potential
SELECT
    a.name as account_name,
    a.industry,
    a.type,
    a.health_score,
    a.revenue as account_revenue,
    u.name as account_owner,
    COUNT(DISTINCT d.id) as active_deals,
    SUM(d.value) as pipeline_value
FROM accounts a
JOIN users u ON a.owner_id = u.id
LEFT JOIN deals d ON a.id = d.account_id AND d.stage NOT IN ('Closed Won', 'Closed Lost')
WHERE a.status = 'active'
GROUP BY a.id, a.name, a.industry, a.type, a.health_score, a.revenue, u.name
ORDER BY pipeline_value DESC NULLS LAST
LIMIT 20;

-- ============================================================
-- 8. COMPREHENSIVE DASHBOARD SUMMARY
-- ============================================================

-- Executive Summary (Single Row)
SELECT
    -- Pipeline Metrics
    (SELECT COUNT(*) FROM deals WHERE stage NOT IN ('Closed Won', 'Closed Lost')) as active_deals,
    (SELECT SUM(value) FROM deals WHERE stage NOT IN ('Closed Won', 'Closed Lost')) as total_pipeline_value,
    (SELECT SUM(value * probability / 100) FROM deals WHERE stage NOT IN ('Closed Won', 'Closed Lost')) as weighted_pipeline,

    -- Revenue Metrics
    (SELECT COUNT(*) FROM deals WHERE stage = 'Closed Won') as deals_won,
    (SELECT SUM(value) FROM deals WHERE stage = 'Closed Won') as total_revenue,
    (SELECT AVG(value) FROM deals WHERE stage = 'Closed Won') as avg_deal_size,

    -- Win Rate
    ROUND(
        100.0 * (SELECT COUNT(*) FROM deals WHERE stage = 'Closed Won') /
        NULLIF((SELECT COUNT(*) FROM deals WHERE stage IN ('Closed Won', 'Closed Lost')), 0),
        2
    ) as overall_win_rate,

    -- Lead Metrics
    (SELECT COUNT(*) FROM leads) as total_leads,
    (SELECT COUNT(*) FROM leads WHERE stage = 'Qualified') as qualified_leads,
    (SELECT COUNT(*) FROM leads WHERE stage = 'Converted') as converted_leads,

    -- Activity Metrics
    (SELECT COUNT(*) FROM tasks WHERE status = 'pending' AND due_date < CURRENT_DATE) as overdue_tasks,
    (SELECT COUNT(*) FROM calendar_events WHERE start_time BETWEEN CURRENT_TIMESTAMP AND CURRENT_TIMESTAMP + INTERVAL '7 days') as upcoming_events;

-- ============================================================
-- 9. TREND ANALYSIS
-- ============================================================

-- Deal Creation Trend (Last 3 Months)
SELECT
    DATE_TRUNC('week', created_at) as week,
    COUNT(*) as deals_created,
    AVG(value) as avg_value
FROM deals
WHERE created_at >= CURRENT_DATE - INTERVAL '3 months'
GROUP BY DATE_TRUNC('week', created_at)
ORDER BY week DESC;

-- Deal Velocity (Days in Pipeline)
SELECT
    stage,
    COUNT(*) as deal_count,
    ROUND(AVG(EXTRACT(DAY FROM (COALESCE(updated_at, CURRENT_TIMESTAMP) - created_at))), 2) as avg_days_in_stage
FROM deals
WHERE stage NOT IN ('Closed Won', 'Closed Lost')
GROUP BY stage;

-- ============================================================
-- 10. DEAL LINE ITEMS ANALYTICS
-- ============================================================

-- Top Selling Product Categories
SELECT
    product_category,
    COUNT(*) as line_item_count,
    SUM(quantity) as total_quantity,
    SUM(total_price) as total_revenue,
    AVG(pricing) as avg_unit_price
FROM deal_line_items
WHERE deal_id IN (SELECT id FROM deals WHERE stage = 'Closed Won')
GROUP BY product_category
ORDER BY total_revenue DESC;

-- Product Mix by Deal
SELECT
    d.title as deal_title,
    d.stage,
    d.value as deal_value,
    COUNT(dli.id) as product_count,
    STRING_AGG(DISTINCT dli.product_category, ', ') as categories,
    SUM(dli.total_price) as line_items_total
FROM deals d
LEFT JOIN deal_line_items dli ON d.id = dli.deal_id
GROUP BY d.id, d.title, d.stage, d.value
HAVING COUNT(dli.id) > 0
ORDER BY deal_value DESC;

-- ============================================================
-- END OF ANALYTICS QUERIES
-- ============================================================

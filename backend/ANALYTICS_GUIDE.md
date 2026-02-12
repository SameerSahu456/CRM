# Zenith CRM - Analytics Dashboard Guide

## Overview

This guide explains the sample data structure and analytics queries available for building comprehensive CRM dashboards.

## Sample Data Summary

After running `seed_sample_data.sql`, you'll have:

| Entity | Count | Purpose |
|--------|-------|---------|
| Users | 3 | Sales reps (John Smith, Sarah Johnson, Michael Chen) |
| Partners | 2 | Channel partners |
| Accounts | 8 | Companies across different industries |
| Contacts | 3 | Decision makers |
| Leads | 10 | Various stages (New → Converted/Lost) |
| Deals | 12 | Complete sales pipeline |
| Deal Line Items | 18 | Product details for deals |
| Tasks | 12 | Activities for tracking |
| Calendar Events | 11 | Meetings and calls |
| Emails | 9 | Communication history |

## Data Distribution for Analytics

### Deals by Stage
- **Qualification**: 3 deals ($490K)
- **Needs Analysis**: 2 deals ($1.34M)
- **Proposal**: 2 deals ($300K)
- **Negotiation**: 1 deal ($180K)
- **Closed Won**: 2 deals ($245K)
- **Closed Lost**: 2 deals ($200K)

**Total Pipeline Value**: $2,990,000
**Total Closed Won Revenue**: $245,000
**Win Rate**: 50% (2 won / 4 closed)

### Leads by Stage
- **New**: 2 leads
- **Contacted**: 3 leads
- **Qualified**: 4 leads
- **Converted**: 1 lead
- **Lost**: 1 lead

**Total Lead Value**: $835,000

---

## Analytics Queries

The `analytics_queries.sql` file contains 10 categories of queries for dashboard widgets.

### 1. Sales Pipeline Overview

#### Total Pipeline Value by Stage
```sql
-- Shows deal count, total value, avg deal size, and weighted value per stage
-- Use for: Pipeline visualization, funnel charts
```

**Dashboard Widget**: Pipeline Funnel Chart
- X-axis: Stage
- Y-axis: Total Value
- Shows progression: Qualification → Needs Analysis → Proposal → Negotiation

#### Pipeline by Sales Rep
```sql
-- Shows each rep's active deals, pipeline value, and weighted pipeline
-- Use for: Sales rep performance comparison
```

**Dashboard Widget**: Sales Rep Leaderboard
- Columns: Rep Name, Active Deals, Pipeline Value, Weighted Pipeline
- Sort by: Pipeline Value (descending)

---

### 2. Revenue Analytics

#### Monthly Revenue Trend
```sql
-- Shows revenue over time from closed won deals
-- Use for: Revenue trend line charts
```

**Dashboard Widget**: Revenue Trend Chart
- X-axis: Month
- Y-axis: Revenue
- Type: Line chart or bar chart

#### Revenue by Industry
```sql
-- Shows which industries generate most revenue
-- Use for: Industry analysis pie/bar charts
```

**Dashboard Widget**: Revenue by Industry
- Type: Pie chart or horizontal bar chart
- Shows: Industry contribution to revenue

#### Revenue by Sales Rep (Leaderboard)
```sql
-- Ranks sales reps by closed won revenue
-- Use for: Sales performance tracking
```

**Dashboard Widget**: Sales Rep Leaderboard
- Columns: Rank, Rep Name, Deals Won, Revenue, Avg Deal Size
- Highlight: Top performer

---

### 3. Win/Loss Analysis

#### Win Rate by Sales Rep
```sql
-- Shows won/lost deals and win rate percentage per rep
-- Use for: Sales effectiveness tracking
```

**Dashboard Widget**: Win Rate Comparison
- Type: Bar chart showing win rate %
- Include: Won deals vs Lost deals counts

#### Win/Loss by Lead Source
```sql
-- Shows which lead sources have best conversion
-- Use for: Marketing channel optimization
```

**Dashboard Widget**: Lead Source ROI
- Columns: Source, Won Count, Won Value, Win Rate %
- Sort by: Win Rate or Won Value

---

### 4. Lead Funnel Analytics

#### Lead Conversion Funnel
```sql
-- Shows lead distribution across stages
-- Use for: Conversion funnel visualization
```

**Dashboard Widget**: Lead Funnel Chart
- Type: Funnel chart
- Stages: New → Contacted → Qualified → Converted
- Shows: Drop-off at each stage

#### Lead Source Effectiveness
```sql
-- Compares conversion rates across sources
-- Use for: Marketing attribution
```

**Dashboard Widget**: Lead Source Performance
- Columns: Source, Total Leads, Converted, Conversion Rate %
- Highlight: Best performing sources

---

### 5. Activity Analytics

#### Task Completion by Sales Rep
```sql
-- Shows task completion rates and overdue tasks
-- Use for: Activity monitoring
```

**Dashboard Widget**: Task Completion Tracker
- Columns: Rep Name, Total Tasks, Completed %, Overdue
- Progress bars for completion rate

#### Upcoming Activities (Next 7 Days)
```sql
-- Lists all scheduled events in next week
-- Use for: Activity calendar/agenda widget
```

**Dashboard Widget**: This Week's Activities
- Type: List or calendar view
- Shows: Date, Time, Activity, Related Deal/Lead

#### Email Activity
```sql
-- Tracks email activity by rep
-- Use for: Communication tracking
```

**Dashboard Widget**: Email Activity
- Columns: Rep Name, Total Emails, Sent Today
- Type: Simple metric cards

---

### 6. Forecast Analytics

#### Monthly Sales Forecast
```sql
-- Projects revenue based on weighted pipeline
-- Use for: Revenue forecasting charts
```

**Dashboard Widget**: Revenue Forecast
- Type: Bar chart with forecast vs actual
- Shows: Expected close date month, weighted value

#### Quarterly Forecast
```sql
-- Aggregates forecast by quarter
-- Use for: Executive summary
```

**Dashboard Widget**: Quarterly Targets
- Type: Progress bars toward quarterly goals
- Shows: Weighted forecast vs target

---

### 7. Account Health Analytics

#### Account Health Distribution
```sql
-- Groups accounts by health score
-- Use for: Account health overview
```

**Dashboard Widget**: Account Health Status
- Type: Pie chart or gauge chart
- Categories: Healthy, Good, At Risk, Critical

#### Top Accounts by Revenue Potential
```sql
-- Lists accounts with highest pipeline value
-- Use for: Account prioritization
```

**Dashboard Widget**: Top Accounts List
- Columns: Account, Health Score, Pipeline Value
- Limit: Top 10-20 accounts

---

### 8. Executive Dashboard Summary

#### Comprehensive Dashboard Summary
```sql
-- Single query returning all key metrics
-- Use for: Dashboard KPI cards
```

**Dashboard Widgets**: Multiple KPI Cards
- Active Deals Count
- Total Pipeline Value
- Weighted Pipeline
- Total Revenue (Closed Won)
- Win Rate %
- Qualified Leads Count
- Overdue Tasks Count
- Upcoming Events (7 days)

**Implementation Example**:
```typescript
// Fetch all metrics in one query
const summary = await db.query(executiveSummaryQuery);

// Display as KPI cards
<MetricsGrid>
  <MetricCard title="Pipeline" value={summary.total_pipeline_value} />
  <MetricCard title="Revenue" value={summary.total_revenue} />
  <MetricCard title="Win Rate" value={`${summary.overall_win_rate}%`} />
  <MetricCard title="Active Deals" value={summary.active_deals} />
</MetricsGrid>
```

---

### 9. Trend Analysis

#### Deal Creation Trend
```sql
-- Shows new deal creation over time
-- Use for: Pipeline growth tracking
```

**Dashboard Widget**: Deal Creation Trend
- Type: Line chart
- X-axis: Week
- Y-axis: Deals Created

#### Deal Velocity
```sql
-- Shows average time deals spend in each stage
-- Use for: Sales cycle analysis
```

**Dashboard Widget**: Sales Cycle Duration
- Type: Bar chart
- Shows: Days in each stage

---

### 10. Deal Line Items Analytics

#### Top Selling Product Categories
```sql
-- Shows which products sell best
-- Use for: Product performance tracking
```

**Dashboard Widget**: Product Performance
- Type: Bar chart
- Shows: Revenue by product category

#### Product Mix by Deal
```sql
-- Shows product composition of deals
-- Use for: Deal structure analysis
```

**Dashboard Widget**: Deal Composition
- Type: Table view
- Shows: Deal, Product Count, Categories, Total

---

## Implementation Guide

### Backend API Endpoints

Create endpoints to serve analytics data:

```python
# backend/app/api/v1/endpoints/analytics.py

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db

router = APIRouter()

@router.get("/pipeline-overview")
async def get_pipeline_overview(db: AsyncSession = Depends(get_db)):
    query = """
    SELECT
        stage,
        COUNT(*) as deal_count,
        SUM(value) as total_value,
        AVG(value) as avg_deal_size,
        SUM(value * probability / 100) as weighted_value
    FROM deals
    WHERE stage NOT IN ('Closed Won', 'Closed Lost')
    GROUP BY stage
    ORDER BY CASE stage
        WHEN 'Qualification' THEN 1
        WHEN 'Needs Analysis' THEN 2
        WHEN 'Proposal' THEN 3
        WHEN 'Negotiation' THEN 4
        ELSE 5
    END;
    """
    result = await db.execute(text(query))
    return result.fetchall()

@router.get("/executive-summary")
async def get_executive_summary(db: AsyncSession = Depends(get_db)):
    # Use the executive summary query from analytics_queries.sql
    query = """..."""  # Full query from file
    result = await db.execute(text(query))
    return result.fetchone()
```

### Frontend Dashboard Components

```typescript
// components/Dashboard.tsx

import { useQuery } from '@tanstack/react-query';
import { PipelineFunnel } from './charts/PipelineFunnel';
import { RevenueChart } from './charts/RevenueChart';
import { MetricCard } from './MetricCard';

export function Dashboard() {
  const { data: summary } = useQuery({
    queryKey: ['executive-summary'],
    queryFn: () => fetch('/api/analytics/executive-summary').then(r => r.json())
  });

  const { data: pipeline } = useQuery({
    queryKey: ['pipeline-overview'],
    queryFn: () => fetch('/api/analytics/pipeline-overview').then(r => r.json())
  });

  return (
    <div className="dashboard">
      {/* KPI Cards */}
      <div className="kpi-grid">
        <MetricCard
          title="Total Pipeline"
          value={summary?.total_pipeline_value}
          format="currency"
        />
        <MetricCard
          title="Revenue"
          value={summary?.total_revenue}
          format="currency"
        />
        <MetricCard
          title="Win Rate"
          value={summary?.overall_win_rate}
          format="percentage"
        />
        <MetricCard
          title="Active Deals"
          value={summary?.active_deals}
        />
      </div>

      {/* Pipeline Funnel */}
      <PipelineFunnel data={pipeline} />

      {/* More widgets... */}
    </div>
  );
}
```

---

## Running the Analytics

### Step 1: Load Sample Data
```bash
cd backend
psql $DATABASE_URL -f seed_sample_data.sql
```

### Step 2: Test Analytics Queries
```bash
# Test individual queries
psql $DATABASE_URL -f analytics_queries.sql
```

### Step 3: Create API Endpoints
- Add analytics router to your FastAPI app
- Implement endpoints for each query category

### Step 4: Build Dashboard UI
- Create chart components using a library like Recharts or Chart.js
- Fetch data from analytics endpoints
- Display in dashboard layout

---

## Recommended Dashboard Layout

```
┌─────────────────────────────────────────────────────────┐
│  EXECUTIVE SUMMARY (KPI Cards)                          │
│  [Pipeline] [Revenue] [Win Rate] [Active Deals]         │
└─────────────────────────────────────────────────────────┘

┌────────────────────────┬────────────────────────────────┐
│  PIPELINE FUNNEL       │  REVENUE TREND                 │
│  (Funnel Chart)        │  (Line Chart)                  │
└────────────────────────┴────────────────────────────────┘

┌────────────────────────┬────────────────────────────────┐
│  SALES REP PERFORMANCE │  LEAD CONVERSION FUNNEL        │
│  (Leaderboard Table)   │  (Funnel Chart)                │
└────────────────────────┴────────────────────────────────┘

┌────────────────────────┬────────────────────────────────┐
│  UPCOMING ACTIVITIES   │  ACCOUNT HEALTH                │
│  (Calendar List)       │  (Pie Chart)                   │
└────────────────────────┴────────────────────────────────┘
```

---

## Performance Tips

1. **Use Indexes**: Ensure indexes on frequently queried columns
   ```sql
   CREATE INDEX idx_deals_stage ON deals(stage);
   CREATE INDEX idx_deals_owner ON deals(owner_id);
   CREATE INDEX idx_deals_closing_date ON deals(closing_date);
   ```

2. **Cache Results**: Cache analytics queries that don't need real-time data
   ```python
   from functools import lru_cache
   from datetime import datetime, timedelta

   @lru_cache(maxsize=100)
   def get_pipeline_cached(cache_key: str):
       # Query implementation
       pass
   ```

3. **Materialized Views**: For complex aggregations, use materialized views
   ```sql
   CREATE MATERIALIZED VIEW mv_pipeline_summary AS
   SELECT ... FROM deals ...;

   REFRESH MATERIALIZED VIEW mv_pipeline_summary;
   ```

4. **Query Optimization**: Use EXPLAIN ANALYZE to optimize slow queries
   ```sql
   EXPLAIN ANALYZE
   SELECT ... FROM deals ...;
   ```

---

## Next Steps

1. **Run the seed data** to populate your database
2. **Test queries** using psql or a database client
3. **Create API endpoints** for each analytics category
4. **Build dashboard components** in your frontend
5. **Add real-time updates** using websockets or polling
6. **Implement filtering** by date range, sales rep, etc.
7. **Add export functionality** for reports (PDF, Excel)

---

## Support

For questions or issues:
- Check the main README.md
- Review backend/app/api/v1/endpoints/ for endpoint examples
- See backend/app/repositories/ for data access patterns

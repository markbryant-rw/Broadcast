# Broadcast ↔ AgentBuddy Integration Specification

> **Document Status:** Draft v1.0 | Early Stage  
> **Last Updated:** January 2026  
> **From:** Broadcast Development Team  
> **To:** AgentBuddy Development Team

---

## ⚠️ Important Note

This specification represents our current understanding and vision for the Broadcast-AgentBuddy integration. **We're in the early stages of development**, and we expect this document to evolve significantly as we collaborate and learn more about each other's systems.

We welcome your feedback, suggestions, and questions. Our goal is to build something that genuinely adds value for real estate professionals using both platforms.

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [About Broadcast](#2-about-broadcast)
3. [Integration Vision](#3-integration-vision)
4. [Data We Need FROM AgentBuddy](#4-data-we-need-from-agentbuddy)
5. [Data We Will Send BACK to AgentBuddy](#5-data-we-will-send-back-to-agentbuddy)
6. [Propensity Intelligence Explained](#6-propensity-intelligence-explained)
7. [Technical Requirements](#7-technical-requirements)
8. [Proposed Architecture](#8-proposed-architecture)
9. [Implementation Phases](#9-implementation-phases)
10. [Questions for AgentBuddy Team](#10-questions-for-agentbuddy-team)
11. [Next Steps](#11-next-steps)

---

## 1. Introduction

### Who We Are

Broadcast is an email marketing and communication platform purpose-built for real estate agents and agencies. We help real estate professionals create, manage, and analyze email campaigns to nurture relationships with property owners, buyers, and leads.

### Why This Integration Matters

Real estate agents using AgentBuddy already have rich contact data and property information. By integrating Broadcast with AgentBuddy, we can:

1. **Eliminate duplicate data entry** — Agents won't need to manually export/import contacts
2. **Create a closed feedback loop** — Email engagement data flows back to AgentBuddy, enriching contact profiles
3. **Generate Propensity Intelligence** — Help agents identify which property owners might be ready to sell and which buyers are most active

### The Value Proposition

| For Agents Using Both Platforms | Benefit |
|--------------------------------|---------|
| Time Savings | One-click sync instead of CSV exports |
| Better Insights | See email engagement directly in AgentBuddy |
| Smarter Prospecting | Propensity scores highlight hot leads |
| Unified Experience | OAuth login, seamless data flow |

---

## 2. About Broadcast

### Platform Overview

Broadcast is a modern, multi-tenant email marketing platform with the following capabilities:

| Feature | Description |
|---------|-------------|
| **Email Campaigns** | Create, schedule, and send professional email campaigns |
| **Contact Management** | Organize contacts with lists, segments, and tags |
| **Template Library** | Drag-and-drop email editor with reusable templates |
| **Analytics Dashboard** | Track opens, clicks, bounces, and engagement trends |
| **Multi-Organization** | Support for agencies with multiple offices/teams |
| **Domain Verification** | Send from your own domain for better deliverability |

### Target Users

- Individual real estate agents
- Real estate teams
- Brokerages and agencies
- Property management companies

### Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | React, TypeScript, Tailwind CSS |
| Backend | Supabase (PostgreSQL, Edge Functions) |
| Email Delivery | Resend API |
| Authentication | Supabase Auth (supports OAuth) |

---

## 3. Integration Vision

### Two-Way Data Synchronization

This is not a one-way import. We envision a **bidirectional integration** where:

```
┌─────────────────┐                      ┌─────────────────┐
│                 │  Contacts, Offices   │                 │
│   AgentBuddy    │  ─────────────────►  │    Broadcast    │
│                 │                      │                 │
│   (CRM/Source   │  Engagement Data,    │  (Email         │
│    of Truth)    │  Propensity Scores   │   Marketing)    │
│                 │  ◄─────────────────  │                 │
└─────────────────┘                      └─────────────────┘
```

### Core Integration Goals

1. **Seamless Authentication** — OAuth 2.0 flow so users connect accounts once
2. **Initial Data Sync** — Pull contacts, offices, and agents from AgentBuddy
3. **Ongoing Synchronization** — Keep data fresh with scheduled or webhook-triggered syncs
4. **Engagement Pushback** — Send email metrics back to AgentBuddy in real-time
5. **Propensity Intelligence** — Calculate and share engagement-based insights

---

## 4. Data We Need FROM AgentBuddy

### 4.1 Offices / Companies

We need office/company data to support multi-location agencies and proper data segregation.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `office_id` | String/UUID | ✅ | Unique identifier |
| `name` | String | ✅ | Office/company name |
| `address` | Object | ❌ | Street, city, state, zip |
| `phone` | String | ❌ | Main contact number |
| `email` | String | ❌ | Office email |
| `parent_office_id` | String | ❌ | For hierarchical structures |
| `created_at` | DateTime | ❌ | For sync tracking |
| `updated_at` | DateTime | ✅ | For incremental sync |

### 4.2 Contacts / Clients

This is our primary data need — the people agents communicate with.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `contact_id` | String/UUID | ✅ | Unique identifier |
| `email` | String | ✅ | Primary email address |
| `first_name` | String | ✅ | First name |
| `last_name` | String | ✅ | Last name |
| `phone` | String | ❌ | For future SMS features |
| `contact_type` | Enum | ❌ | e.g., "buyer", "seller", "owner", "lead" |
| `office_id` | String | ❌ | Associated office |
| `agent_id` | String | ❌ | Assigned agent |
| `address` | Object | ❌ | Contact's address |
| `properties` | Array | ❌ | Associated property IDs |
| `tags` | Array | ❌ | Custom tags/labels |
| `custom_fields` | Object | ❌ | Any additional metadata |
| `status` | Enum | ❌ | e.g., "active", "archived" |
| `email_opt_in` | Boolean | ✅ | Marketing consent status |
| `created_at` | DateTime | ❌ | For sync tracking |
| `updated_at` | DateTime | ✅ | For incremental sync |

### 4.3 Agents / Users

To attribute contacts to agents and support team-based features.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `agent_id` | String/UUID | ✅ | Unique identifier |
| `email` | String | ✅ | Agent's email |
| `first_name` | String | ✅ | First name |
| `last_name` | String | ✅ | Last name |
| `office_id` | String | ❌ | Primary office assignment |
| `role` | Enum | ❌ | e.g., "agent", "admin", "broker" |
| `phone` | String | ❌ | Contact number |
| `avatar_url` | String | ❌ | Profile image |
| `is_active` | Boolean | ❌ | Account status |
| `created_at` | DateTime | ❌ | For sync tracking |
| `updated_at` | DateTime | ✅ | For incremental sync |

### 4.4 Properties (Optional Enhancement)

If available, property data would enable powerful segmentation (e.g., "email all owners of properties valued over $1M").

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `property_id` | String/UUID | ✅ | Unique identifier |
| `address` | Object | ✅ | Full property address |
| `property_type` | Enum | ❌ | e.g., "residential", "commercial" |
| `bedrooms` | Integer | ❌ | Bedroom count |
| `bathrooms` | Decimal | ❌ | Bathroom count |
| `square_feet` | Integer | ❌ | Living area |
| `estimated_value` | Decimal | ❌ | Current valuation |
| `owner_contact_id` | String | ❌ | Link to owner contact |
| `listing_status` | Enum | ❌ | e.g., "active", "sold", "off_market" |
| `last_sale_date` | Date | ❌ | For ownership duration insights |
| `last_sale_price` | Decimal | ❌ | For equity calculations |

---

## 5. Data We Will Send BACK to AgentBuddy

This is where the real value emerges. We want to enrich AgentBuddy with actionable engagement intelligence.

### 5.1 Email Engagement Events

Real-time or near-real-time event data for each email interaction.

| Field | Type | Description |
|-------|------|-------------|
| `event_id` | String/UUID | Unique event identifier |
| `contact_id` | String | AgentBuddy contact ID |
| `event_type` | Enum | `sent`, `delivered`, `opened`, `clicked`, `bounced`, `unsubscribed`, `complained` |
| `campaign_id` | String | Broadcast campaign identifier |
| `campaign_name` | String | Human-readable campaign name |
| `timestamp` | DateTime | When the event occurred |
| `metadata` | Object | Additional context (e.g., clicked link URL) |

### 5.2 Aggregate Engagement Metrics

Periodic summary data per contact.

| Field | Type | Description |
|-------|------|-------------|
| `contact_id` | String | AgentBuddy contact ID |
| `total_emails_sent` | Integer | Lifetime emails sent |
| `total_opens` | Integer | Lifetime opens |
| `total_clicks` | Integer | Lifetime clicks |
| `open_rate` | Decimal | Percentage (0-100) |
| `click_rate` | Decimal | Percentage (0-100) |
| `last_email_sent_at` | DateTime | Most recent send |
| `last_opened_at` | DateTime | Most recent open |
| `last_clicked_at` | DateTime | Most recent click |
| `engagement_trend` | Enum | `increasing`, `stable`, `decreasing`, `inactive` |

### 5.3 Propensity Scores

Our calculated intelligence scores (see Section 6 for methodology).

| Field | Type | Description |
|-------|------|-------------|
| `contact_id` | String | AgentBuddy contact ID |
| `propensity_score` | Integer | 0-100 overall engagement score |
| `propensity_category` | Enum | `hot`, `warm`, `cool`, `cold` |
| `seller_likelihood` | Integer | 0-100 (for property owners) |
| `buyer_activity_score` | Integer | 0-100 (for buyers) |
| `recommended_action` | String | e.g., "Call this week", "Add to nurture sequence" |
| `score_updated_at` | DateTime | When score was last calculated |
| `contributing_factors` | Array | What drove the score (e.g., "3 opens in 7 days") |

### 5.4 Campaign Participation

Which campaigns each contact has received.

| Field | Type | Description |
|-------|------|-------------|
| `contact_id` | String | AgentBuddy contact ID |
| `campaigns` | Array | List of campaign objects |
| `campaigns[].id` | String | Campaign identifier |
| `campaigns[].name` | String | Campaign name |
| `campaigns[].sent_at` | DateTime | When sent to this contact |
| `campaigns[].status` | Enum | `delivered`, `opened`, `clicked`, `bounced` |

---

## 6. Propensity Intelligence Explained

### What is Propensity Scoring?

Propensity scoring uses email engagement patterns to predict the likelihood of a contact taking a specific action. For real estate, this means:

- **For Property Owners:** How likely are they to consider selling?
- **For Buyers:** How actively are they searching?

### Why Email Engagement Matters

Email behavior is a strong signal of intent:

| Behavior | Signal |
|----------|--------|
| Opens multiple market update emails | Interested in property values |
| Clicks on "What's my home worth?" | Considering selling |
| Opens every new listing email | Active buyer |
| Sudden increase in engagement | Life event triggering change |
| Clicks on mortgage rate content | Ready to make a move |

### Proposed Scoring Methodology

```
┌─────────────────────────────────────────────────────────────────┐
│                    PROPENSITY SCORE (0-100)                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  BASE SCORE (40 points max)                                     │
│  ├─ Open rate vs. average: +/- 20 points                        │
│  └─ Click rate vs. average: +/- 20 points                       │
│                                                                 │
│  RECENCY BONUS (30 points max)                                  │
│  ├─ Opened in last 7 days: +15 points                           │
│  ├─ Opened in last 30 days: +10 points                          │
│  ├─ Clicked in last 7 days: +15 points                          │
│  └─ Clicked in last 30 days: +10 points                         │
│                                                                 │
│  TREND MULTIPLIER (30 points max)                               │
│  ├─ Engagement increasing: +30 points                           │
│  ├─ Engagement stable: +15 points                               │
│  └─ Engagement decreasing: +0 points                            │
│                                                                 │
│  CONTENT SIGNALS (bonus points)                                 │
│  ├─ Clicked valuation content: +10 (seller signal)              │
│  ├─ Clicked listing content: +10 (buyer signal)                 │
│  └─ Clicked financing content: +5 (transaction signal)          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Score Categories

| Score Range | Category | Recommended Action |
|-------------|----------|-------------------|
| 80-100 | 🔥 Hot | Immediate personal outreach |
| 60-79 | 🌡️ Warm | Schedule follow-up this week |
| 40-59 | 😐 Cool | Continue nurturing |
| 0-39 | ❄️ Cold | Re-engagement campaign |

### Example Scenarios

**Scenario 1: Property Owner Shows Seller Intent**
> Maria has owned her home for 8 years. Over the past month, she's opened every market update email (5 of 5) and clicked on "What's Your Home Worth?" twice. Her propensity score jumps from 45 to 87.
>
> **AgentBuddy receives:** `seller_likelihood: 87`, `recommended_action: "Call this week - high seller intent"`

**Scenario 2: Buyer Activity Spike**
> James is a registered buyer who was quiet for 3 months. Suddenly, he opens 4 listing emails in one week and clicks on 6 different properties.
>
> **AgentBuddy receives:** `buyer_activity_score: 92`, `contributing_factors: ["6 property clicks in 7 days", "engagement trend: increasing"]`

---

## 7. Technical Requirements

### 7.1 Authentication (OAuth 2.0)

We'd like to implement OAuth 2.0 for secure, user-authorized data access.

**Proposed Flow:**

```
┌──────────┐     ┌──────────┐     ┌────────────┐     ┌──────────┐
│          │     │          │     │            │     │          │
│  Agent   │────►│ Broadcast│────►│ AgentBuddy │────►│ Broadcast│
│  (User)  │     │    UI    │     │   OAuth    │     │ Backend  │
│          │     │          │     │            │     │          │
└──────────┘     └──────────┘     └────────────┘     └──────────┘
     │                │                 │                  │
     │  1. Click      │                 │                  │
     │  "Connect"     │                 │                  │
     │───────────────►│                 │                  │
     │                │                 │                  │
     │                │ 2. Redirect to  │                  │
     │                │ AgentBuddy Auth │                  │
     │                │────────────────►│                  │
     │                │                 │                  │
     │  3. User       │                 │                  │
     │  Authorizes    │                 │                  │
     │─────────────────────────────────►│                  │
     │                │                 │                  │
     │                │                 │ 4. Redirect with │
     │                │                 │ auth code        │
     │                │◄────────────────│                  │
     │                │                 │                  │
     │                │ 5. Exchange     │                  │
     │                │ code for tokens │                  │
     │                │─────────────────────────────────────►
     │                │                 │                  │
     │                │                 │  6. Store tokens │
     │                │                 │  securely        │
     │                │◄─────────────────────────────────────
     │                │                 │                  │
```

**What We Need from AgentBuddy:**
- OAuth authorization endpoint URL
- Token exchange endpoint URL
- Supported scopes (e.g., `read:contacts`, `read:offices`, `write:engagement`)
- Token refresh mechanism
- Client ID/Secret provisioning process

### 7.2 API Requirements (Data FROM AgentBuddy)

**Preferred:** RESTful API with JSON responses

**Endpoints We'd Need:**

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/offices` | GET | List all offices for authenticated user |
| `/offices/{id}` | GET | Get single office details |
| `/contacts` | GET | List contacts (with pagination, filtering) |
| `/contacts/{id}` | GET | Get single contact details |
| `/agents` | GET | List agents/users |
| `/agents/{id}` | GET | Get single agent details |
| `/properties` | GET | List properties (optional) |

**Pagination:**
- Cursor-based or offset-based pagination
- Suggested page size: 100-500 records
- Total count in response headers or body

**Filtering:**
- `updated_since` — For incremental sync
- `office_id` — Filter by office
- `agent_id` — Filter by assigned agent
- `contact_type` — Filter by type (buyer, seller, etc.)

**Rate Limiting:**
- What are the rate limits?
- How are limits communicated (headers)?
- Is there a higher tier for bulk operations?

### 7.3 Webhook/API Requirements (Data TO AgentBuddy)

**Option A: Webhooks (Preferred for Real-Time)**

We would send POST requests to AgentBuddy-provided endpoints:

```json
// Example: Email Event Webhook
POST https://api.agentbuddy.com/webhooks/broadcast/events
{
  "event_type": "email.opened",
  "timestamp": "2026-01-15T14:30:00Z",
  "data": {
    "contact_id": "ab_contact_123",
    "campaign_id": "bc_campaign_456",
    "campaign_name": "January Market Update"
  }
}
```

```json
// Example: Propensity Score Update
POST https://api.agentbuddy.com/webhooks/broadcast/propensity
{
  "event_type": "propensity.updated",
  "timestamp": "2026-01-15T14:35:00Z",
  "data": {
    "contact_id": "ab_contact_123",
    "propensity_score": 87,
    "propensity_category": "hot",
    "seller_likelihood": 87,
    "buyer_activity_score": 23,
    "recommended_action": "Call this week - high seller intent",
    "contributing_factors": [
      "5/5 emails opened in 30 days",
      "2 valuation link clicks",
      "engagement trend: increasing"
    ]
  }
}
```

**Option B: API Push (Alternative)**

If webhooks aren't supported, we could push data via API:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/contacts/{id}/engagement` | POST/PATCH | Update engagement metrics |
| `/contacts/{id}/propensity` | POST/PATCH | Update propensity scores |
| `/contacts/{id}/events` | POST | Log individual events |

**Questions:**
- Does AgentBuddy support incoming webhooks?
- Is there a preferred authentication method for incoming data?
- Are there custom fields where we can store this data?
- Can we create new fields programmatically?

### 7.4 Bulk Operations

For initial sync and large updates:

- **Bulk Read:** Can we request contacts in batches of 1000+?
- **Bulk Write:** Can we push engagement data for multiple contacts in one request?
- **Async Jobs:** For large syncs, is there a job/task system?

### 7.5 Error Handling

**What We'll Handle:**
- Retry logic with exponential backoff
- Graceful degradation if AgentBuddy is unavailable
- Conflict resolution for simultaneous updates
- Duplicate detection and deduplication

**What We Need to Know:**
- Error response format
- Specific error codes and meanings
- Retry recommendations

---

## 8. Proposed Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              BROADCAST PLATFORM                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐  │
│  │   React     │    │  Supabase   │    │    Edge     │    │   Resend    │  │
│  │  Frontend   │◄──►│  Database   │◄──►│  Functions  │◄──►│   (Email)   │  │
│  └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘  │
│         │                  │                  │                  │          │
│         │                  │                  │                  │          │
│         └──────────────────┴────────┬─────────┴──────────────────┘          │
│                                     │                                        │
└─────────────────────────────────────┼────────────────────────────────────────┘
                                      │
                                      │ OAuth + REST API + Webhooks
                                      │
┌─────────────────────────────────────┼────────────────────────────────────────┐
│                                     │                                        │
│                            AGENTBUDDY PLATFORM                               │
│                                     │                                        │
│  ┌─────────────────────────────────┴─────────────────────────────────────┐  │
│  │                                                                        │  │
│  │    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐           │  │
│  │    │    OAuth     │    │   REST API   │    │   Webhooks   │           │  │
│  │    │   Server     │    │   Endpoints  │    │   Receiver   │           │  │
│  │    └──────────────┘    └──────────────┘    └──────────────┘           │  │
│  │                                                                        │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Data Flow Diagram

```
                    ┌─────────────────────────────────────────┐
                    │            INITIAL SYNC                  │
                    │                                          │
                    │  AgentBuddy ───────────► Broadcast       │
                    │                                          │
                    │  • Offices                               │
                    │  • Contacts                              │
                    │  • Agents                                │
                    │  • Properties (optional)                 │
                    └─────────────────────────────────────────┘
                                      │
                                      ▼
                    ┌─────────────────────────────────────────┐
                    │          ONGOING SYNC                    │
                    │                                          │
                    │  AgentBuddy ◄──────────► Broadcast       │
                    │                                          │
                    │  → New/updated contacts                  │
                    │  ← Engagement events                     │
                    │  ← Propensity scores                     │
                    └─────────────────────────────────────────┘
                                      │
                                      ▼
                    ┌─────────────────────────────────────────┐
                    │         REAL-TIME EVENTS                 │
                    │                                          │
                    │  Email sent ──────────► Log event        │
                    │  Email opened ─────────► Update score    │
                    │  Link clicked ─────────► Push to AB      │
                    │  Bounce/Unsub ─────────► Update status   │
                    └─────────────────────────────────────────┘
```

### Sync Strategies

| Strategy | Frequency | Use Case |
|----------|-----------|----------|
| **Real-time (Webhooks)** | Immediate | Engagement events, bounces, unsubscribes |
| **Scheduled Sync** | Every 15-60 min | New contacts, updated data |
| **Manual Sync** | On-demand | User-triggered full refresh |
| **Daily Batch** | Once per day | Propensity score recalculation |

### Conflict Resolution

When data exists in both systems:

1. **AgentBuddy is source of truth** for contact demographics (name, email, phone)
2. **Broadcast is source of truth** for email engagement data
3. **Last-write-wins** for fields that can be updated in both systems
4. **Merge strategy** for arrays (e.g., tags are combined, not replaced)

---

## 9. Implementation Phases

We propose a phased approach to minimize risk and deliver value incrementally.

### Phase 1: Foundation (Weeks 1-4)

**Goal:** Establish secure connection and basic contact sync

| Deliverable | Description |
|-------------|-------------|
| OAuth Integration | Users can connect AgentBuddy account to Broadcast |
| Contact Import | Initial sync of contacts from AgentBuddy |
| Data Mapping | Map AgentBuddy fields to Broadcast schema |
| Connection UI | Settings page to manage integration |

**Success Criteria:**
- [ ] User can authenticate with AgentBuddy
- [ ] Contacts appear in Broadcast within 5 minutes of connection
- [ ] Contact data is accurate and complete

### Phase 2: Full Entity Sync (Weeks 5-8)

**Goal:** Complete bidirectional data infrastructure

| Deliverable | Description |
|-------------|-------------|
| Office Sync | Import office/company structure |
| Agent Sync | Import agent assignments |
| Incremental Sync | Only sync changed records |
| Scheduled Refresh | Automated periodic sync |

**Success Criteria:**
- [ ] All entity types syncing correctly
- [ ] Sync completes in < 10 seconds for typical account
- [ ] Changes in AgentBuddy reflected in Broadcast within 15 minutes

### Phase 3: Engagement Pushback (Weeks 9-12)

**Goal:** Send engagement data back to AgentBuddy

| Deliverable | Description |
|-------------|-------------|
| Event Streaming | Real-time email events to AgentBuddy |
| Aggregate Metrics | Periodic summary updates |
| AgentBuddy UI | Engagement data visible in AgentBuddy (requires AB team) |

**Success Criteria:**
- [ ] Events delivered to AgentBuddy within 60 seconds
- [ ] Engagement metrics visible in AgentBuddy contact records
- [ ] No data loss or duplication

### Phase 4: Propensity Intelligence (Weeks 13-16)

**Goal:** Deliver actionable insights to AgentBuddy

| Deliverable | Description |
|-------------|-------------|
| Scoring Algorithm | Implement propensity calculation |
| Score Delivery | Push scores to AgentBuddy |
| Recommendations | Generate action recommendations |
| Dashboard | Propensity insights in AgentBuddy (requires AB team) |

**Success Criteria:**
- [ ] Propensity scores calculated for all contacts
- [ ] Scores update within 24 hours of engagement
- [ ] Agents report finding value in recommendations

### Future Enhancements (Post-Launch)

- Property data sync for advanced segmentation
- Automated campaign triggers based on AgentBuddy events
- Two-way tag synchronization
- Custom field mapping configuration
- Multi-office permission controls

---

## 10. Questions for AgentBuddy Team

### API & Authentication

1. **API Documentation:** Is there existing API documentation we can review?
2. **OAuth Support:** Do you currently support OAuth 2.0? If not, what authentication do you use?
3. **API Base URL:** What is the API endpoint structure?
4. **Rate Limits:** What are the rate limits, and how are they communicated?
5. **API Versioning:** How do you version your API?

### Data & Entities

6. **Entity Structure:** Does our understanding of offices/contacts/agents match your data model?
7. **Unique Identifiers:** What fields serve as unique identifiers for each entity?
8. **Soft Deletes:** How do you handle deleted records?
9. **Custom Fields:** Are there custom/dynamic fields we should account for?
10. **Data Privacy:** Are there fields we should NOT sync (e.g., SSN, financial data)?

### Incoming Data (Engagement Pushback)

11. **Webhook Support:** Do you support incoming webhooks?
12. **Custom Fields:** Can we create custom fields to store engagement data?
13. **Bulk Updates:** Can we update multiple records in one API call?
14. **Field Types:** What data types are supported for custom fields?
15. **UI Display:** Where would engagement data appear in your UI?

### Development & Testing

16. **Sandbox Environment:** Is there a sandbox/staging environment for testing?
17. **Test Accounts:** Can you provide test credentials?
18. **Sample Data:** Can we get sample API responses?
19. **Changelog:** How do you communicate API changes?
20. **Support Contact:** Who should we contact for technical questions?

### Business & Compliance

21. **Partnership Agreement:** Is there a formal partnership process?
22. **Data Processing Agreement:** Do you require a DPA for data handling?
23. **User Consent:** How do we ensure users consent to data sharing?
24. **Branding Guidelines:** Are there guidelines for how we reference AgentBuddy?

---

## 11. Next Steps

### Immediate Actions

1. **Review this document** and provide feedback on our assumptions
2. **Share API documentation** if available
3. **Schedule a technical call** to discuss architecture
4. **Identify stakeholders** on both teams

### Proposed Timeline

| Week | Milestone |
|------|-----------|
| Week 1 | Initial technical discussion |
| Week 2-3 | API exploration and prototyping |
| Week 4 | OAuth flow implementation |
| Week 5-8 | Phase 1 development |
| Week 9 | Alpha testing with select users |
| Week 10+ | Iterate based on feedback |

### Points of Contact

**Broadcast Team:**
- Technical Lead: [To be filled]
- Product Owner: [To be filled]
- Email: [To be filled]

**AgentBuddy Team:**
- Technical Lead: [Requested]
- API Support: [Requested]
- Email: [Requested]

---

## Appendix A: Glossary

| Term | Definition |
|------|------------|
| **Propensity Score** | A 0-100 rating predicting likelihood of action based on engagement |
| **Engagement Rate** | Percentage of emails opened or clicked |
| **OAuth 2.0** | Industry-standard protocol for authorization |
| **Webhook** | HTTP callback that sends real-time data when events occur |
| **Incremental Sync** | Only syncing records that changed since last sync |
| **Source of Truth** | The system considered authoritative for specific data |

---

## Appendix B: Sample API Responses (What We'd Expect)

### GET /contacts

```json
{
  "data": [
    {
      "id": "ab_contact_12345",
      "email": "john.smith@email.com",
      "first_name": "John",
      "last_name": "Smith",
      "phone": "+1-555-123-4567",
      "contact_type": "owner",
      "office_id": "ab_office_001",
      "agent_id": "ab_agent_042",
      "address": {
        "street": "123 Main St",
        "city": "Austin",
        "state": "TX",
        "zip": "78701"
      },
      "properties": ["ab_prop_789", "ab_prop_790"],
      "tags": ["VIP", "Repeat Client"],
      "email_opt_in": true,
      "created_at": "2024-03-15T10:30:00Z",
      "updated_at": "2026-01-10T14:22:00Z"
    }
  ],
  "pagination": {
    "total": 1542,
    "page": 1,
    "per_page": 100,
    "next_cursor": "eyJpZCI6ImFiX2NvbnRhY3RfMTIzNDUifQ=="
  }
}
```

### Webhook Payload We'd Send

```json
{
  "webhook_id": "wh_abc123def456",
  "event_type": "engagement.batch_update",
  "timestamp": "2026-01-15T00:00:00Z",
  "data": {
    "updates": [
      {
        "contact_id": "ab_contact_12345",
        "propensity_score": 87,
        "propensity_category": "hot",
        "seller_likelihood": 87,
        "buyer_activity_score": 23,
        "engagement_metrics": {
          "total_emails_sent": 24,
          "total_opens": 18,
          "total_clicks": 7,
          "open_rate": 75.0,
          "click_rate": 29.2,
          "last_opened_at": "2026-01-14T16:45:00Z"
        },
        "recommended_action": "High seller intent - call this week",
        "contributing_factors": [
          "75% open rate (above average)",
          "2 valuation link clicks in 14 days",
          "Engagement trend: increasing"
        ]
      }
    ]
  }
}
```

---

*This document is a living specification. Version history and changes will be tracked as we collaborate.*

**Document Version:** 1.0  
**Status:** Draft - Awaiting AgentBuddy Feedback

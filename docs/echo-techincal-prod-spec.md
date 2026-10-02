# Echo Technical Product Specification

**Product:** Echo
**Type:** Personal quote and reflection web application
**Platform:** Web, responsive
**Status:** MVP specification
**Product principle:** Words worth coming back to.

---

# 1. Product Overview

Echo is a private, personal library for saving meaningful quotes and returning to them over time.

Users can save quotes, attach personal reflections, organize them with collections and tags, and rediscover them through intentional resurfacing.

Echo is not intended to be a social network or a generic quote-discovery platform.

The primary value loop is:

```text
Discover meaningful words
        ↓
Save them to Echo
        ↓
Add personal context
        ↓
Continue living
        ↓
Echo resurfaces them
        ↓
Reflect again
        ↓
Meaning evolves
```

---

# 2. Product Goals

## Primary Goals

1. Make saving a quote extremely fast.
2. Make personal context easy to attach to a quote.
3. Make a growing quote library easy to search and organize.
4. Make rediscovering old quotes meaningful.
5. Preserve user privacy.
6. Make the user's data portable.
7. Create a calm, focused experience rather than a content feed.

## Secondary Goals

1. Build a foundation for future AI-powered discovery.
2. Support future OCR/screenshot importing.
3. Support future browser extension functionality.
4. Support future PWA/mobile experiences.

---

# 3. Non-Goals for MVP

The MVP will not include:

* Public profiles
* Followers
* Likes from other users
* Comments
* Social feeds
* Trending quotes
* Public quote discovery
* Gamification
* Streaks
* Leaderboards
* Advertising
* Marketplace
* Complex recommendation systems
* Native mobile applications
* OCR
* Browser extension
* Generative AI features

---

# 4. Technical Principles

## 4.1 Privacy First

User quotes and reflections are private by default.

No data should become publicly accessible without an explicit user action.

## 4.2 Simple Data Model

The MVP should use a straightforward relational model.

Avoid premature abstraction.

## 4.3 Server-Side Source of Truth

The backend database is the canonical source of user data.

The frontend may cache data for performance but should not be treated as authoritative.

## 4.4 API-First Architecture

Frontend and backend should communicate through clearly defined APIs.

This will make future:

* Mobile apps
* Browser extensions
* AI services

easier to implement.

## 4.5 Progressive Enhancement

Core functionality must work without AI.

AI should eventually enhance the user's library, not become a dependency for basic functionality.

---

# 5. Recommended MVP Stack

The exact technology can change, but the following stack is recommended.

## Frontend

* Next.js
* React
* TypeScript
* Tailwind CSS
* Component library built specifically for Echo

## Backend

Option A:

* Next.js server/API layer
* TypeScript

Option B:

* Dedicated Node.js backend

For the MVP, Option A is sufficient.

## Database

* PostgreSQL

## ORM

* Prisma

## Authentication

Recommended:

* Auth.js / equivalent authentication provider

Support:

* Email/password
* Google OAuth

## Storage

Object storage for future uploaded images:

* S3-compatible storage

For MVP, image upload can be postponed.

## Hosting

Frontend/backend:

* Vercel or equivalent

Database:

* Managed PostgreSQL

## Analytics

Privacy-conscious product analytics.

Do not collect unnecessary personal content.

---

# 6. System Architecture

High-level architecture:

```text
                        ┌────────────────────┐
                        │      Browser       │
                        │                    │
                        │  React / Next.js   │
                        └─────────┬──────────┘
                                  │
                                  │ HTTPS
                                  ▼
                        ┌────────────────────┐
                        │ Application Layer  │
                        │                    │
                        │ Auth               │
                        │ API                │
                        │ Business Logic     │
                        └─────────┬──────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
                    ▼                           ▼
          ┌──────────────────┐        ┌──────────────────┐
          │   PostgreSQL     │        │ Object Storage   │
          │                  │        │                  │
          │ Users            │        │ Images           │
          │ Echoes           │        │ Screenshots      │
          │ Tags             │        │ Future assets    │
          │ Collections      │        └──────────────────┘
          │ Reflections     │
          └──────────────────┘
```

Future architecture:

```text
                         Echo Web App
                              │
                    ┌─────────┴─────────┐
                    │                   │
                  Core API          AI Service
                    │                   │
                    └─────────┬─────────┘
                              │
                         PostgreSQL
```

---

# 7. Core Domain Model

The core entities are:

```text
User
  │
  ├── Echo
  │     ├── Reflection
  │     ├── Tags
  │     ├── Collections
  │     ├── Revisit
  │     └── Favorite
  │
  ├── Collection
  │
  └── Tag
```

---

# 8. Database Schema

## 8.1 User

```text
User
----
id                UUID / String
email             String UNIQUE
name              String nullable
avatarUrl         String nullable
createdAt         DateTime
updatedAt         DateTime
```

Authentication-specific tables may be handled by the selected authentication framework.

---

# 9. Echo

The Echo entity is the central object.

```text
Echo
----
id                UUID
userId            UUID
quote             Text
author            String nullable
source            String nullable
reflection        Text nullable
mood              String nullable
isFavorite        Boolean
savedAt           DateTime
updatedAt         DateTime
deletedAt         DateTime nullable
```

## Notes

`quote` is required.

Everything else should be optional.

The product should not force users to provide metadata.

---

# 10. Collection

```text
Collection
----------
id                UUID
userId            UUID
name              String
description       Text nullable
createdAt         DateTime
updatedAt         DateTime
```

Examples:

```text
Courage
For Difficult Days
Books
Life
Love
Things I Want to Remember
```

---

# 11. EchoCollection

Many-to-many relationship between Echoes and Collections.

```text
EchoCollection
--------------
echoId            UUID
collectionId      UUID
createdAt         DateTime
```

Composite primary key:

```text
(echoId, collectionId)
```

---

# 12. Tag

```text
Tag
---
id                UUID
userId            UUID
name              String
createdAt         DateTime
```

Tags are user-specific.

Two users can both have a tag called:

```text
courage
```

but these are separate records.

---

# 13. EchoTag

Many-to-many relationship.

```text
EchoTag
-------
echoId            UUID
tagId             UUID
createdAt         DateTime
```

Composite primary key:

```text
(echoId, tagId)
```

---

# 14. Revisit

A Revisit represents an intentional request to resurface an Echo.

```text
Revisit
-------
id                UUID
echoId            UUID
userId            UUID
scheduledFor      DateTime
completedAt       DateTime nullable
createdAt         DateTime
```

Example:

```text
scheduledFor:
2027-04-01
```

---

# 15. Echo View / Interaction

We may eventually want to know which Echoes the user repeatedly returns to.

For MVP, this can be kept lightweight.

```text
EchoInteraction
---------------
id                UUID
echoId            UUID
userId            UUID
type              Enum
createdAt         DateTime
```

Possible interaction types:

```text
VIEW
FAVORITE
UNFAVORITE
SHARE
REVISIT
```

This table is optional for the first implementation.

If analytics are needed, a simpler aggregated `viewCount` can be used initially.

---

# 16. Future Reflection History

The initial MVP can store only the current reflection.

Future versions can introduce:

```text
Reflection
----------
id                UUID
echoId            UUID
userId            UUID
content           Text
createdAt         DateTime
```

This would allow:

```text
March 2026
"I am terrified of changing."

October 2026
"I actually did it."
```

For MVP, reflection history is not required.

---

# 17. Relationships

```text
User 1 ──────── * Echo

User 1 ──────── * Collection

User 1 ──────── * Tag

Echo * ──────── * Collection

Echo * ──────── * Tag

Echo 1 ──────── * Revisit
```

---

# 18. Data Ownership Rules

Every user-owned resource must contain a `userId` or be reachable through an entity containing `userId`.

Every API request must enforce ownership.

Example:

```text
GET /api/echoes/:id
```

must verify:

```text
echo.userId === authenticatedUser.id
```

A user must never be able to access another user's Echo by modifying an ID in the request.

This applies to:

* Echoes
* Collections
* Tags
* Revisits
* Uploaded files
* Future reflections

---

# 19. Application Routes

## Public Routes

```text
/
 /login
 /signup
 /forgot-password
```

## Authenticated Routes

```text
/app
/app/echoes
/app/echoes/new
/app/echoes/:id
/app/echoes/:id/edit

/app/collections
/app/collections/:id

/app/favorites

/app/search

/app/settings
```

Future:

```text
/app/insights
/app/revisits
```

---

# 20. Home Page

Route:

```text
/app
```

Purpose:

Give the user a calm starting point and surface one meaningful Echo.

Components:

```text
Header
Today's Echo
Echo Me Something
Recently Added
Favorites
Collections
Past Echo
```

The home page should not display an infinite feed.

---

# 21. Add Echo Page

Route:

```text
/app/echoes/new
```

Required field:

```text
Quote
```

Optional fields:

```text
Author
Source
Reflection
Mood
Tags
Collections
Favorite
Revisit
```

Primary action:

```text
Save Echo
```

Secondary action:

```text
Cancel
```

---

# 22. Add Echo UX

The interaction should be optimized for speed.

Ideal flow:

```text
Click +
   ↓
Paste quote
   ↓
Optional metadata
   ↓
Save
```

Do not force:

* Collection
* Tags
* Author
* Source
* Reflection

The user should be able to save a quote in a few seconds.

---

# 23. Echo Detail Page

Route:

```text
/app/echoes/:id
```

Display:

* Quote
* Author
* Source
* Reflection
* Tags
* Collections
* Saved date
* Favorite state
* Revisit state

Actions:

```text
Favorite
Edit
Delete
Revisit
Share
```

---

# 24. Edit Echo

Route:

```text
/app/echoes/:id/edit
```

All Echo fields should be editable.

Changes should update:

```text
updatedAt
```

---

# 25. Delete Echo

Deletion should require confirmation.

Example:

```text
Delete this Echo?

This cannot be undone.

[Cancel] [Delete]
```

For MVP, soft deletion is recommended.

Set:

```text
deletedAt = current timestamp
```

rather than immediately deleting the database record.

The normal application should exclude deleted Echoes.

---

# 26. Collections Page

Route:

```text
/app/collections
```

Display:

```text
My Collections

+ New Collection

Courage
24 Echoes

Books
41 Echoes

For Difficult Days
17 Echoes
```

---

# 27. Collection Detail

Route:

```text
/app/collections/:id
```

Display:

* Collection name
* Description
* Echo count
* Echo cards

Actions:

* Rename
* Delete
* Add Echo
* Remove Echo

Deleting a collection should **not** delete its Echoes.

---

# 28. Favorites

Route:

```text
/app/favorites
```

Display all Echoes where:

```text
isFavorite = true
```

Sort by:

```text
Recently favorited
```

or

```text
Recently updated
```

---

# 29. Search

Route:

```text
/app/search?q=...
```

Search should cover:

```text
quote
author
source
reflection
tag
collection
```

Initial implementation can use PostgreSQL text search.

Future versions can introduce semantic/vector search.

---

# 30. Search API

Example:

```http
GET /api/search?q=starting%20over
```

Response:

```json
{
  "results": [
    {
      "id": "echo-id",
      "quote": "Begin anywhere.",
      "author": "John Cage",
      "reflection": "Maybe I should finally start."
    }
  ]
}
```

---

# 31. Echo Me Something

Endpoint:

```http
GET /api/echoes/random
```

Basic MVP behavior:

1. Fetch user's active Echoes.
2. Exclude deleted Echoes.
3. Optionally exclude recently surfaced Echoes.
4. Select a random Echo.
5. Return it.

Future versions can use:

* Tags
* Interaction history
* Revisit history
* Recency
* User-selected themes
* AI

---

# 32. Today's Echo

Endpoint:

```http
GET /api/echoes/today
```

The result should be deterministic for a user on a given date.

Example approach:

```text
hash(userId + currentDate)
        ↓
deterministic index
        ↓
Echo
```

This prevents the quote from changing every time the page reloads.

---

# 33. Revisit System

Users can schedule an Echo for a future date.

Example:

```text
POST /api/revisits
```

Request:

```json
{
  "echoId": "123",
  "scheduledFor": "2027-04-01T09:00:00Z"
}
```

The system can later surface it on:

```text
/app/revisits
```

Notifications are optional for the first release.

---

# 34. Future Notification Architecture

When notifications are implemented:

```text
Revisit
   ↓
Scheduled date reached
   ↓
Notification service
   ↓
Email / Push
   ↓
User opens Echo
```

Users must be able to disable notifications.

---

# 35. API Design

Suggested API structure:

```text
/api/auth/*

/api/echoes
/api/echoes/:id
/api/echoes/random
/api/echoes/today

/api/collections
/api/collections/:id

/api/tags
/api/tags/:id

/api/revisits
/api/revisits/:id

/api/search
```

---

# 36. Echo API

## Create

```http
POST /api/echoes
```

Request:

```json
{
  "quote": "Begin anywhere.",
  "author": "John Cage",
  "source": null,
  "reflection": "Maybe I should finally start.",
  "mood": "uncertain",
  "tagIds": [],
  "collectionIds": [],
  "isFavorite": false
}
```

Response:

```json
{
  "id": "uuid",
  "quote": "Begin anywhere.",
  "author": "John Cage",
  "source": null,
  "reflection": "Maybe I should finally start.",
  "mood": "uncertain",
  "isFavorite": false,
  "savedAt": "2026-10-01T15:00:00Z"
}
```

---

## List

```http
GET /api/echoes
```

Supported query parameters:

```text
page
limit
sort
tag
collection
favorite
search
```

Example:

```http
GET /api/echoes?favorite=true&page=1&limit=20
```

---

## Get

```http
GET /api/echoes/:id
```

---

## Update

```http
PATCH /api/echoes/:id
```

---

## Delete

```http
DELETE /api/echoes/:id
```

---

# 37. Pagination

All potentially large collections must use pagination.

Recommended default:

```text
20 items per page
```

Maximum:

```text
100 items
```

Cursor-based pagination can be introduced if required.

---

# 38. Sorting

Supported sorting options:

```text
newest
oldest
recently_updated
author
```

Future:

```text
most_viewed
most_revisited
```

---

# 39. Error Handling

API responses should use consistent error structures.

Example:

```json
{
  "error": {
    "code": "ECHO_NOT_FOUND",
    "message": "Echo not found."
  }
}
```

Common codes:

```text
UNAUTHORIZED
FORBIDDEN
VALIDATION_ERROR
NOT_FOUND
ECHO_NOT_FOUND
COLLECTION_NOT_FOUND
TAG_NOT_FOUND
RATE_LIMITED
INTERNAL_ERROR
```

Frontend should display friendly messages while logging technical details separately.

---

# 40. Validation

## Echo

```text
quote
required
max length: 10,000 characters

author
optional
max length: 500

source
optional
max length: 1,000

reflection
optional
max length: 10,000

mood
optional
max length: 100
```

Tags:

```text
max 50 tags per Echo
```

Collections:

```text
max 50 collections per Echo
```

These limits can be adjusted later.

---

# 41. Security Requirements

## Authentication

All authenticated routes require a valid session.

## Authorization

Every resource must be checked against the authenticated user.

## Input Validation

All user input must be validated server-side.

Client-side validation is for UX only.

## XSS Protection

User-generated content must be safely escaped/rendered.

Do not render arbitrary HTML from quote/reflection fields.

## CSRF

Use framework-supported CSRF protection where applicable.

## Rate Limiting

Rate limit:

* Login
* Signup
* Password reset
* API mutations
* Search if necessary

---

# 42. Privacy Requirements

User content must not be:

* Publicly indexed
* Accessible without authentication
* Included in public API responses
* Used for analytics unnecessarily

Future AI features must clearly define whether user content is sent to an external AI provider.

Users should be informed before their private content is processed by third-party AI services.

---

# 43. Analytics

Analytics should focus on product behavior rather than content surveillance.

Recommended events:

```text
signup_completed
echo_created
echo_updated
echo_deleted
echo_favorited
echo_unfavorited
echo_revisited
search_performed
collection_created
collection_opened
share_created
```

Do not log:

* Full quote text
* Full reflection text
* Private notes

---

# 44. Performance Requirements

Target:

```text
Initial page load:
< 2.5 seconds on a reasonable broadband connection
```

Interactive UI should feel immediate.

Common operations such as:

```text
Save Echo
Favorite
Add tag
```

should provide optimistic UI where safe.

Search should target:

```text
< 500ms
```

for normal libraries.

---

# 45. Responsive Design

Echo must support:

* Desktop
* Laptop
* Tablet
* Mobile browser

Minimum target:

```text
320px viewport width
```

The mobile experience should not simply be a compressed desktop interface.

---

# 46. Accessibility

Target:

**WCAG 2.2 AA**

Requirements include:

* Keyboard navigation
* Visible focus states
* Semantic HTML
* Screen-reader labels
* Sufficient contrast
* Accessible form errors
* Reduced motion support
* Proper heading hierarchy
* Accessible dialogs
* Accessible buttons and icon controls

---

# 47. Design System

Create a small internal design system.

Components:

```text
Button
Input
Textarea
Select
Tag
Badge
Card
Modal
Dialog
Dropdown
Toast
Tabs
Navigation
QuoteCard
EchoCard
CollectionCard
EmptyState
LoadingState
ErrorState
```

Avoid introducing a large component library unless necessary.

---

# 48. Quote Card Component

The QuoteCard should be reusable throughout the app.

Props:

```typescript
type QuoteCardProps = {
  echo: Echo;
  showReflection?: boolean;
  showTags?: boolean;
  showSavedDate?: boolean;
  compact?: boolean;
};
```

Possible contexts:

* Home
* Search
* Library
* Collection
* Favorites
* Today's Echo

---

# 49. Empty States

Every major section needs a meaningful empty state.

## No Echoes

```text
Your library is empty.

Save the words that make you stop and think.

+ Add your first Echo
```

## No Favorites

```text
Nothing here yet.

Favorite the Echoes you never want to lose.
```

## No Collections

```text
Collections help you gather Echoes around
ideas, moments, and themes.

+ Create a collection
```

---

# 50. Loading States

Use skeletons rather than blank screens where possible.

For quote cards:

```text
████████████████
████████████
████████

████████
```

Avoid unnecessary loading spinners.

---

# 51. Database Indexes

Recommended indexes:

```text
Echo.userId
Echo.savedAt
Echo.updatedAt
Echo.isFavorite
Echo.deletedAt

Collection.userId

Tag.userId

Revisit.userId
Revisit.scheduledFor
```

For search, add appropriate PostgreSQL indexes.

---

# 52. Soft Delete

Echo deletion should use:

```text
deletedAt
```

Normal queries:

```text
WHERE deletedAt IS NULL
```

A future trash/recovery feature can be added without changing the underlying data model.

---

# 53. Backup Strategy

Database backups should be automated.

Recommended:

* Daily backups
* Point-in-time recovery where supported
* Backup retention policy
* Periodic restore testing

Backups must also be treated as sensitive because they contain private user content.

---

# 54. Export

Future API:

```http
GET /api/export
```

Supported formats:

```text
JSON
CSV
```

Future:

```text
PDF
```

Example JSON:

```json
{
  "exportedAt": "2026-10-01T15:00:00Z",
  "echoes": [
    {
      "quote": "Begin anywhere.",
      "author": "John Cage",
      "reflection": "Maybe I should finally start.",
      "tags": ["courage"],
      "collections": ["Starting Over"],
      "savedAt": "2026-10-01T15:00:00Z"
    }
  ]
}
```

---

# 55. Future OCR Architecture

Not part of MVP.

Possible flow:

```text
User uploads screenshot
        ↓
Object storage
        ↓
OCR service
        ↓
Extracted text
        ↓
Quote parsing
        ↓
User confirmation
        ↓
Create Echo
```

Never automatically save OCR output without user confirmation.

---

# 56. Future AI Architecture

AI should sit behind an abstraction layer.

Example:

```text
AIProvider
   │
   ├── generateEmbedding()
   ├── findRelatedEchoes()
   ├── summarizeTheme()
   └── generateReflectionPrompt()
```

This prevents the core application from becoming tightly coupled to one AI provider.

---

# 57. Future Semantic Search

Current MVP:

```text
PostgreSQL full-text search
```

Future:

```text
Quote
Reflection
Tags
      ↓
Embedding
      ↓
Vector database / pgvector
      ↓
Semantic search
```

Example:

User searches:

```text
"I feel like I am stuck in life"
```

Echo can surface a quote that never uses the word "stuck" but has a related meaning.

---

# 58. Future Browser Extension

Possible API:

```http
POST /api/extension/echoes
```

Input:

```json
{
  "quote": "Selected text",
  "source": "Article title",
  "url": "https://example.com/article"
}
```

The extension should create a draft Echo rather than automatically publishing/saving without user confirmation.

---

# 59. Authentication Flow

## Signup

```text
Landing page
    ↓
Sign up
    ↓
Email / Google
    ↓
Account created
    ↓
Optional onboarding
    ↓
Home
```

## Login

```text
Login
  ↓
Authentication
  ↓
Home
```

---

# 60. Onboarding

Keep onboarding extremely short.

Possible first-run experience:

```text
Welcome to Echo.

Save the words you don't want to forget.

[Add your first Echo]
```

After saving the first quote:

```text
Why did this speak to you?

[Optional reflection]
```

Avoid lengthy onboarding questionnaires.

---

# 61. Settings

Route:

```text
/app/settings
```

Sections:

### Account

* Name
* Email
* Profile image

### Appearance

* Light
* Dark
* System

### Notifications

* Revisit notifications
* Email notifications

### Privacy

* Privacy information

### Data

* Export data
* Delete account

---

# 62. Account Deletion

Users must be able to permanently delete their account.

Flow:

```text
Settings
   ↓
Delete account
   ↓
Confirmation
   ↓
Explicit confirmation
   ↓
Account deletion
   ↓
Associated private data deleted
```

The exact retention behavior for backups should be documented according to the application's privacy policy.

---

# 63. Logging

Application logs should include:

* Request IDs
* Error IDs
* HTTP status
* Endpoint
* Performance timing

Logs must not contain:

* Quote text
* Reflection text
* Passwords
* Authentication tokens
* Sensitive personal content

---

# 64. Testing Strategy

## Unit Tests

Test:

* Quote validation
* Tag handling
* Collection handling
* Random Echo selection
* Today's Echo selection
* Authorization
* Search logic

## Integration Tests

Test:

* Authentication
* Create Echo
* Edit Echo
* Delete Echo
* Collections
* Tags
* Favorites
* Search
* Revisit

## End-to-End Tests

Critical flows:

```text
Signup → Add Echo → View Echo

Login → Search → Open Echo

Add Echo → Favorite → View Favorites

Add Echo → Collection → Open Collection

Add Echo → Schedule Revisit
```

---

# 65. Authorization Test Cases

These are especially important.

### Case 1

User A requests User B's Echo.

Expected:

```text
404 or 403
```

### Case 2

User A tries to edit User B's Echo.

Expected:

```text
403
```

### Case 3

User A tries to delete User B's Echo.

Expected:

```text
403
```

### Case 4

User A tries to attach User B's tag.

Expected:

```text
403
```

---

# 66. MVP Development Phases

## Phase 1: Foundation

* Repository setup
* TypeScript
* Next.js
* Database
* Prisma
* Authentication
* Environment configuration
* Deployment pipeline

## Phase 2: Core Echo

* Create Echo
* View Echo
* Edit Echo
* Delete Echo
* Favorite
* Quote cards

## Phase 3: Organization

* Tags
* Collections
* Favorites page
* Search

## Phase 4: Discovery

* Home page
* Today's Echo
* Echo Me Something

## Phase 5: Polish

* Responsive design
* Empty states
* Loading states
* Error handling
* Accessibility
* Performance optimization

## Phase 6: Production Readiness

* Security review
* Authorization testing
* Database backups
* Analytics
* Error monitoring
* Export
* Account deletion

---

# 67. MVP Definition of Done

Echo MVP is complete when a new user can:

```text
1. Create an account
2. Add a quote
3. Add an author
4. Add a reflection
5. Add tags
6. Add the quote to a collection
7. Favorite it
8. Search for it
9. Open its detail page
10. Edit it
11. Delete it
12. Return to the home page
13. Receive a personal Today's Echo
14. Ask Echo for something random
15. Use the application comfortably on mobile
```

---

# 68. Recommended Initial Database Schema

Conceptually:

```text
users
├── id
├── email
├── name
├── avatar_url
├── created_at
└── updated_at

echoes
├── id
├── user_id
├── quote
├── author
├── source
├── reflection
├── mood
├── is_favorite
├── saved_at
├── updated_at
└── deleted_at

collections
├── id
├── user_id
├── name
├── description
├── created_at
└── updated_at

echo_collections
├── echo_id
├── collection_id
└── created_at

tags
├── id
├── user_id
├── name
└── created_at

echo_tags
├── echo_id
├── tag_id
└── created_at

revisits
├── id
├── echo_id
├── user_id
├── scheduled_for
├── completed_at
└── created_at
```

---

# 69. Example User Flow

## Saving a Quote

```text
User opens Echo
        ↓
Clicks "+"
        ↓
Add Echo page
        ↓
Pastes quote
        ↓
Adds author
        ↓
Writes reflection
        ↓
Adds "courage" tag
        ↓
Selects "Things I Want to Remember"
        ↓
Clicks Save
        ↓
Echo created
        ↓
Redirect to Echo detail
```

---

# 70. Example Rediscovery Flow

```text
User opens Echo
        ↓
Home page
        ↓
Today's Echo
        ↓
Quote appears
        ↓
"Saved 11 months ago"
        ↓
User sees old reflection
        ↓
User clicks "Echo Me Something"
        ↓
Another meaningful quote appears
```

The interaction should feel like rediscovery, not content consumption.

---

# 71. Product Metrics

The primary metrics should measure whether Echo is actually useful.

## Activation

Percentage of new users who save their first Echo.

## First Reflection

Percentage of users who add a reflection to their first Echo.

## Return Rate

Percentage of users who return after saving their first Echo.

## Rediscovery Rate

Percentage of active users who open an old Echo.

## Revisit Rate

Percentage of users who intentionally revisit an Echo.

## Library Growth

Average number of Echoes saved per active user.

## Search Usage

Percentage of users who search their library.

Avoid optimizing purely for:

* Sessions
* Screen time
* Number of page views

More usage is not automatically better for this product.

---

# 72. North Star Metric

A useful long-term metric could be:

> **Meaningful rediscoveries per active user**

A meaningful rediscovery can be defined as:

```text
User opens an Echo
that was saved at least X days earlier
```

This measures whether Echo is doing its actual job:

**bringing meaningful words back into the user's life.**

---

# 73. Future Product Evolution

The product can eventually evolve through three layers.

## Layer 1: Storage

```text
Save my quotes.
```

## Layer 2: Memory

```text
Help me find them again.
```

## Layer 3: Understanding

```text
Help me understand the themes
and ideas that keep returning to me.
```

The MVP should focus heavily on Layers 1 and 2.

Layer 3 can be introduced carefully through AI and personal insights.

---

# 74. Final Technical Principle

Echo should remain technically simple until the product proves that users want the deeper functionality.

The first version does not need:

* Vector databases
* AI agents
* Complex recommendation engines
* Microservices
* Native mobile apps
* Event-driven infrastructure

A well-structured:

```text
Next.js
+
TypeScript
+
PostgreSQL
+
Prisma
+
Authentication
```

application is sufficient for the MVP.

The architecture should leave room for future expansion without building that complexity prematurely.

---

# 75. Product Definition

Echo can ultimately be summarized technically and product-wise as:

```text
Echo
│
├── Capture
│   └── Save meaningful words
│
├── Context
│   └── Add personal reflections
│
├── Organize
│   ├── Collections
│   ├── Tags
│   └── Favorites
│
├── Discover
│   ├── Search
│   ├── Today's Echo
│   └── Echo Me Something
│
├── Remember
│   ├── Revisits
│   └── Echoes From The Past
│
└── Understand
    ├── Personal insights
    ├── Semantic search
    └── AI-assisted discovery
```

The MVP should make the first four layers excellent before expanding into the final "Understand" layer.

# Meeting Task Tool - Wireframe Specification

**Document Purpose**: Complete functional and structural specification for wireframe creation  
**Date**: 2025-12-03  
**Focus**: Data structures, functional blocks, user flows — NO styling or UI details

---

## 1. Screen Inventory

### 1.1 Landing Page (Marketing)
- **Route**: `/`
- **File**: [apps/frontend/app/page.tsx](file:///Users/alexanderAI/Desktop/just%20test%20env/meeting-task-tool/apps/frontend/app/page.tsx)
- **Purpose**: Marketing landing page that redirects to dashboard
- **Status**: ✅ Implemented

### 1.2 Login Page
- **Route**: `/login`
- **File**: [apps/frontend/app/(auth)/login/page.tsx](file:///Users/alexanderAI/Desktop/just%20test%20env/meeting-task-tool/apps/frontend/app/(auth)/login/page.tsx)
- **Purpose**: User authentication via Supabase
- **Status**: ✅ Implemented

### 1.3 Registration Page
- **Route**: `/register`
- **File**: [apps/frontend/app/(auth)/register/page.tsx](file:///Users/alexanderAI/Desktop/just%20test%20env/meeting-task-tool/apps/frontend/app/(auth)/register/page.tsx)
- **Purpose**: New user account creation with email confirmation
- **Status**: ✅ Implemented

### 1.4 Dashboard (Task Management)
- **Route**: `/dashboard`
- **File**: [apps/frontend/app/dashboard/page.tsx](file:///Users/alexanderAI/Desktop/just%20test%20env/meeting-task-tool/apps/frontend/app/dashboard/page.tsx)
- **Purpose**: Main task viewing and management interface with table and Gantt views
- **Status**: ⚠️ Partial (UI only, uses mock data)

### 1.5 Test Page
- **Route**: `/test`
- **File**: [apps/frontend/app/test/page.tsx](file:///Users/alexanderAI/Desktop/just%20test%20env/meeting-task-tool/apps/frontend/app/test/page.tsx)
- **Purpose**: Development testing page
- **Status**: ✅ Implemented

---

## 2. Functional Blocks by Screen

### 2.1 Landing Page Blocks

#### Block: Hero Section
**Functional Purpose**: Display product value proposition and CTAs

**Data Consumed**: None (static content)

**Data Produced**: Navigation events
```json
{
  "action": "navigate",
  "target": "/login" | "/register" | "/dashboard"
}
```

#### Block: Features Grid
**Functional Purpose**: Display three key feature cards (Upload, AI Extraction, Track & Manage)

**Data Consumed**: None (static content)

#### Block: How It Works
**Functional Purpose**: Show 4-step process flow

**Data Consumed**: None (static content)

#### Block: CTA Section
**Functional Purpose**: Final call-to-action for registration

**Data Consumed**: None (static content)

---

### 2.2 Login Page Blocks

#### Block: Login Form
**Functional Purpose**: Authenticate user via email/password

**Data Consumed**: User input (form submission)
```json
{
  "email": "user@example.com",
  "password": "string (min 6 chars)"
}
```

**Data Produced**: Authentication event
```json
{
  "action": "signIn",
  "email": "user@example.com",
  "password": "••••••"
}
```

**Implementation**: 
- File: [apps/frontend/app/(auth)/login/page.tsx](file:///Users/alexanderAI/Desktop/just%20test%20env/meeting-task-tool/apps/frontend/app/(auth)/login/page.tsx)
- Function: `onSubmit` (line 35)
- API Call: `useAuthStore().signIn(email, password)` → Supabase

**Validation Schema**:
```typescript
{
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
}
```

#### Block: Error Display
**Functional Purpose**: Show login errors

**Data Consumed**:
```json
{
  "error": "Login failed. Please check your credentials."
}
```

#### Block: Sign Up Link
**Functional Purpose**: Navigate to registration

**Data Produced**: Navigation to `/register`

---

### 2.3 Registration Page Blocks

#### Block: Registration Form
**Functional Purpose**: Create new user account

**Data Consumed**: User input
```json
{
  "name": "John Doe (optional)",
  "email": "user@example.com",
  "password": "string (min 6 chars)",
  "confirmPassword": "string (min 6 chars, must match)"
}
```

**Data Produced**: Supabase signup event
```json
{
  "action": "signUp",
  "email": "user@example.com",
  "password": "••••••",
  "metadata": {
    "name": "John Doe"
  }
}
```

**Implementation**:
- File: [apps/frontend/app/(auth)/register/page.tsx](file:///Users/alexanderAI/Desktop/just%20test%20env/meeting-task-tool/apps/frontend/app/(auth)/register/page.tsx)
- Function: `onSubmit` (line 43)
- API Call: `useAuthStore().signUp(email, password, name)`

#### Block: Email Confirmation Success
**Functional Purpose**: Show confirmation message after successful registration

**Data Consumed**:
```json
{
  "success": true
}
```

**Display**: Replaces form with confirmation message

---

### 2.4 Dashboard Page Blocks

#### Block: Page Header
**Functional Purpose**: Display title and primary actions

**Data Consumed**: None (static)

**Data Produced**: 
- Filter action
- Add meeting navigation/modal trigger

#### Block: View Toggle (Tabs)
**Functional Purpose**: Switch between table and Gantt views

**Data Consumed**: Current view state
```json
{
  "activeView": "table" | "gantt"
}
```

**Data Produced**: View change event
```json
{
  "newView": "table" | "gantt"
}
```

**Implementation**: Local state, line 18

#### Block: Task Table
**Functional Purpose**: Display all tasks in tabular format

**Data Consumed**: Task list
```json
{
  "tasks": [
    {
      "id": "uuid",
      "description": "Prepare quarterly report",
      "assignee": "John Doe",
      "deadline": "2025-12-15",
      "status": "pending" | "in_progress" | "completed" | "cancelled",
      "priority": "low" | "medium" | "high" | "urgent"
    }
  ]
}
```

**Current Status**: ⚠️ Uses mock data (line 10-15)

**Expected API**: `GET /api/v1/tasks`

**Table Columns**:
1. Description (text)
2. Assignee (text/contact reference)
3. Deadline (ISO date)
4. Status (badge)
5. Priority (badge)

#### Block: Gantt Chart
**Functional Purpose**: Display tasks on timeline

**Data Consumed**: Task list with dates
```json
{
  "tasks": [
    {
      "id": "uuid",
      "name": "Task description",
      "start": "2025-12-01",
      "end": "2025-12-15",
      "progress": 50,
      "dependencies": []
    }
  ]
}
```

**Current Status**: ❌ Not implemented (placeholder only, line 104-123)

**Expected Library**: Frappe Gantt (installed: `frappe-gantt@^1.0.4`)

#### Block: Statistics Cards
**Functional Purpose**: Display task summary metrics

**Data Consumed**: Aggregated task data
```json
{
  "totalTasks": 24,
  "pendingReview": 8,
  "upcomingDeadlines": 5
}
```

**Current Status**: ⚠️ Hardcoded values (line 126-154)

**Expected API**: Derived from task list or separate analytics endpoint

---

## 3. Data Shapes (Detailed)

### 3.1 User
**Source**: Database model + Supabase auth

```json
{
  "id": "uuid (Supabase auth.users.id)",
  "email": "user@example.com",
  "name": "John Doe | null",
  "createdAt": "2025-12-03T10:00:00Z",
  "updatedAt": "2025-12-03T10:00:00Z"
}
```

**Database Schema**: [apps/backend/prisma/schema.prisma](file:///Users/alexanderAI/Desktop/just%20test%20env/meeting-task-tool/apps/backend/prisma/schema.prisma) (lines 15-28)

---

### 3.2 Contact
**Purpose**: Assignable people for tasks

```json
{
  "id": "uuid",
  "userId": "uuid (owner)",
  "name": "Jane Smith",
  "email": "jane@example.com | null",
  "role": "Product Manager | null",
  "createdAt": "2025-12-03T10:00:00Z",
  "updatedAt": "2025-12-03T10:00:00Z"
}
```

**Database Schema**: Lines 31-45
**API Endpoints**:
- `GET /api/v1/contacts` → List user's contacts
- `POST /api/v1/contacts` → Create new contact

**Implementation**: [apps/backend/src/routes/contacts.ts](file:///Users/alexanderAI/Desktop/just%20test%20env/meeting-task-tool/apps/backend/src/routes/contacts.ts)

---

### 3.3 Meeting
**Purpose**: Meeting transcript storage and AI processing trigger

```json
{
  "id": "uuid",
  "userId": "uuid (owner)",
  "title": "Weekly Standup - Dec 3",
  "transcript": "Full transcript text (can be very long)",
  "processed": false,
  "processedAt": "2025-12-03T10:30:00Z | null",
  "metadata": {
    "duration": 3600,
    "participants": ["user1@example.com"],
    "custom_field": "any additional data"
  },
  "createdAt": "2025-12-03T10:00:00Z"
}
```

**Database Schema**: Lines 48-63

**API Endpoints**:
- `POST /api/v1/meetings` → Create meeting (triggers AI processing)
- `GET /api/v1/meetings` → List user's meetings
- `GET /api/v1/meetings/:id` → Get meeting with tasks

**Implementation**: [apps/backend/src/routes/meetings.ts](file:///Users/alexanderAI/Desktop/just%20test%20env/meeting-task-tool/apps/backend/src/routes/meetings.ts)

**POST Response**:
```json
{
  "id": "uuid",
  "title": "Weekly Standup",
  "processed": false,
  "createdAt": "2025-12-03T10:00:00Z"
}
```

**GET List Response**:
```json
{
  "meetings": [
    {
      "id": "uuid",
      "title": "Weekly Standup",
      "processed": true,
      "processedAt": "2025-12-03T10:30:00Z",
      "createdAt": "2025-12-03T10:00:00Z",
      "_count": {
        "tasks": 5
      }
    }
  ]
}
```

---

### 3.4 Task
**Purpose**: Action items extracted from meetings or manually created

```json
{
  "id": "uuid",
  "meetingId": "uuid",
  "userId": "uuid (owner)",
  "description": "Update project documentation with API changes",
  "assigneeId": "uuid | null",
  "assigneeName": "Jane Smith | null",
  "deadline": "2025-12-15T23:59:59Z | null",
  "status": "pending" | "in_progress" | "completed" | "cancelled",
  "priority": "low" | "medium" | "high" | "urgent",
  "aiExtracted": true,
  "reviewed": false,
  "reviewedAt": "2025-12-03T11:00:00Z | null",
  "createdAt": "2025-12-03T10:00:00Z",
  "updatedAt": "2025-12-03T10:00:00Z",
  "meeting": {
    "id": "uuid",
    "title": "Weekly Standup",
    "createdAt": "2025-12-03T10:00:00Z"
  },
  "assignee": {
    "id": "uuid",
    "name": "Jane Smith",
    "email": "jane@example.com"
  }
}
```

**Database Schema**: Lines 66-88

**API Endpoints**:
- `GET /api/v1/tasks` → List tasks (with filters)
- `PATCH /api/v1/tasks/:id` → Update task
- `PUT /api/v1/tasks/:id/review` → Mark as reviewed

**Implementation**: [apps/backend/src/routes/tasks.ts](file:///Users/alexanderAI/Desktop/just%20test%20env/meeting-task-tool/apps/backend/src/routes/tasks.ts)

**GET Query Parameters**:
```typescript
{
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled',
  assigneeId?: 'uuid',
  fromDate?: 'ISO date',
  toDate?: 'ISO date',
  meetingId?: 'uuid',
  reviewed?: 'true' | 'false'
}
```

**PATCH Request Body**:
```json
{
  "description": "string (optional)",
  "assigneeId": "uuid | null (optional)",
  "assigneeName": "string (optional)",
  "deadline": "ISO datetime | null (optional)",
  "status": "pending | in_progress | completed | cancelled (optional)",
  "priority": "low | medium | high | urgent (optional)",
  "reviewed": "boolean (optional)"
}
```

---

### 3.5 Authentication State
**Source**: Zustand store

```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe | null",
    "createdAt": "ISO datetime",
    "updatedAt": "ISO datetime"
  } | null,
  "isLoading": false,
  "isAuthenticated": true
}
```

**Implementation**: [apps/frontend/stores/auth.ts](file:///Users/alexanderAI/Desktop/just%20test%20env/meeting-task-tool/apps/frontend/stores/auth.ts)

**Persisted**: Yes (localStorage: `auth-storage`)

---

## 4. User Flows

### 4.1 User Registration Flow
**Status**: ✅ Implemented

**Steps**:
1. User navigates to `/register`
2. User fills form (name, email, password, confirm password)
3. Form validation (client-side with Zod)
4. Submit triggers `useAuthStore().signUp()`
5. Supabase creates user account
6. Success message displayed
7. User checks email for confirmation link
8. User clicks link → account confirmed
9. Navigate to `/login`

**Entry Point**: [apps/frontend/app/(auth)/register/page.tsx](file:///Users/alexanderAI/Desktop/just%20test%20env/meeting-task-tool/apps/frontend/app/(auth)/register/page.tsx) (line 43: `onSubmit`)

**Backend**: Supabase Auth (no custom backend route)

**Gaps**: 
- ❌ No resend confirmation email option
- ❌ No password strength indicator

---

### 4.2 User Login Flow
**Status**: ✅ Implemented

**Steps**:
1. User navigates to `/login`
2. User enters email/password
3. Form validation (client-side)
4. Submit triggers `useAuthStore().signIn()`
5. Supabase validates credentials
6. Session created in Supabase
7. Store fetches user profile from backend (`GET /api/v1/auth/me`)
8. If profile missing, backend auto-creates from Supabase data
9. User state stored in Zustand + localStorage
10. Redirect to `/dashboard`

**Entry Point**: [apps/frontend/app/(auth)/login/page.tsx](file:///Users/alexanderAI/Desktop/just%20test%20env/meeting-task-tool/apps/frontend/app/(auth)/login/page.tsx) (line 35: `onSubmit`)

**Backend**: 
- Supabase Auth for authentication
- [apps/backend/src/routes/auth.ts](file:///Users/alexanderAI/Desktop/just%20test%20env/meeting-task-tool/apps/backend/src/routes/auth.ts) (line 8: `GET /auth/me`)

**Gaps**:
- ❌ No "forgot password" flow
- ❌ No OAuth providers (Google, GitHub, etc.)

---

### 4.3 Create Meeting Flow
**Status**: ⚠️ Partially implemented (backend ready, no frontend UI)

**Expected Steps**:
1. User clicks "Add Meeting" button on dashboard
2. Modal/form opens requesting:
   - Meeting title
   - Transcript (paste or file upload)
   - Optional metadata
3. User submits form
4. Frontend calls `POST /api/v1/meetings`
5. Backend creates meeting record
6. Backend triggers AI processing (TODO: n8n webhook)
7. AI extracts tasks in background
8. Tasks created and linked to meeting
9. Meeting marked as `processed: true`
10. Dashboard refreshes showing new tasks

**Entry Point**: ❌ Missing frontend UI

**Backend Implementation**: [apps/backend/src/routes/meetings.ts](file:///Users/alexanderAI/Desktop/just%20test%20env/meeting-task-tool/apps/backend/src/routes/meetings.ts) (line 16: `POST /`)

**Gaps**:
- ❌ No frontend form/modal for meeting creation
- ❌ No file upload component
- ❌ AI processing webhook not implemented (line 30-31 TODO comment)
- ❌ No progress indicator for processing
- ❌ No webhook to notify when processing complete

---

### 4.4 View Tasks Flow
**Status**: ⚠️ Partial (UI exists, uses mock data)

**Current Implementation**:
1. User navigates to `/dashboard`
2. Dashboard loads mock task data (hardcoded)
3. Table displays tasks
4. User can switch to Gantt view (empty placeholder)

**Expected Implementation**:
1. User navigates to `/dashboard`
2. Frontend calls `GET /api/v1/tasks`
3. Optional filters applied (status, assignee, date range)
4. Tasks displayed in table view
5. User switches to Gantt view
6. Frappe Gantt library renders timeline

**Entry Point**: [apps/frontend/app/dashboard/page.tsx](file:///Users/alexanderAI/Desktop/just%20test%20env/meeting-task-tool/apps/frontend/app/dashboard/page.tsx) (line 17: component mount)

**Backend**: [apps/backend/src/routes/tasks.ts](file:///Users/alexanderAI/Desktop/just%20test%20env/meeting-task-tool/apps/backend/src/routes/tasks.ts) (line 20: `GET /`)

**Gaps**:
- ❌ No API integration (using mock data)
- ❌ Gantt chart not implemented
- ❌ No filter UI
- ❌ Statistics cards use hardcoded values

---

### 4.5 Edit Task Flow
**Status**: ❌ Not implemented (backend ready, no frontend UI)

**Expected Steps**:
1. User clicks task row in table
2. Edit modal/inline form opens
3. User modifies:
   - Description
   - Assignee (dropdown from contacts)
   - Deadline (date picker)
   - Status (dropdown)
   - Priority (dropdown)
4. User saves changes
5. Frontend calls `PATCH /api/v1/tasks/:id`
6. Backend updates task
7. `reviewed` set to `true`, `reviewedAt` set to current time
8. Table refreshes with updated data

**Entry Point**: ❌ Missing

**Backend Implementation**: [apps/backend/src/routes/tasks.ts](file:///Users/alexanderAI/Desktop/just%20test%20env/meeting-task-tool/apps/backend/src/routes/tasks.ts) (line 76: `PATCH /:id`)

**Gaps**:
- ❌ No task edit UI
- ❌ No assignee dropdown
- ❌ No date picker
- ❌ No inline editing or modal

---

### 4.6 Mark Task as Reviewed Flow
**Status**: ❌ Not implemented (backend ready, no frontend UI)

**Expected Steps**:
1. User sees unreviewed tasks (AI-extracted)
2. User clicks "Mark as Reviewed" button
3. Frontend calls `PUT /api/v1/tasks/:id/review`
4. Backend sets `reviewed: true`, `reviewedAt: now()`
5. UI updates task visual state

**Entry Point**: ❌ Missing

**Backend Implementation**: [apps/backend/src/routes/tasks.ts](file:///Users/alexanderAI/Desktop/just%20test%20env/meeting-task-tool/apps/backend/src/routes/tasks.ts) (line 129: `PUT /:id/review`)

**Gaps**:
- ❌ No visual indicator for unreviewed tasks
- ❌ No review button
- ❌ No bulk review action

---

### 4.7 Create Contact Flow
**Status**: ❌ Not implemented (backend ready, no frontend UI)

**Expected Steps**:
1. User navigates to contacts page (doesn't exist yet)
2. User clicks "Add Contact"
3. Form opens requesting name, email, role
4. User submits
5. Frontend calls `POST /api/v1/contacts`
6. Backend creates contact
7. Contact list refreshes

**Entry Point**: ❌ Missing

**Backend Implementation**: [apps/backend/src/routes/contacts.ts](file:///Users/alexanderAI/Desktop/just%20test%20env/meeting-task-tool/apps/backend/src/routes/contacts.ts) (line 35: `POST /`)

**Gaps**:
- ❌ No contacts page
- ❌ No contact creation UI
- ❌ No contact list view
- ❌ Cannot assign contacts to tasks in UI

---

### 4.8 Logout Flow
**Status**: ✅ Implemented

**Steps**:
1. User clicks sign out button
2. `useAuthStore().signOut()` called
3. Supabase session destroyed
4. Zustand state cleared
5. LocalStorage cleared
6. User redirected (expected, but not enforced)

**Entry Point**: [apps/frontend/stores/auth.ts](file:///Users/alexanderAI/Desktop/just%20test%20env/meeting-task-tool/apps/frontend/stores/auth.ts) (line 102: `signOut`)

**Gaps**:
- ⚠️ No explicit redirect after logout (relies on auth check)

---

## 5. Implementation Status & Gaps

### 5.1 Authentication System
**Status**: ✅ Mostly Complete

**Implemented**:
- ✅ User registration with email confirmation
- ✅ User login with Supabase
- ✅ Session management with Zustand
- ✅ Auto-profile creation on first login
- ✅ Logout

**Gaps**:
- ❌ Password reset flow
- ❌ OAuth providers
- ❌ Email confirmation resend
- ❌ Middleware authentication (commented out)
- ❌ Protected route enforcement (dashboard is public)

**Note**: Per [AUTHENTICATION-CHANGES.md](file:///Users/alexanderAI/Desktop/just%20test%20env/meeting-task-tool/AUTHENTICATION-CHANGES.md), authentication was intentionally disabled for dashboard access to prevent 404 errors during development.

---

### 5.2 Meeting Management
**Status**: ⚠️ Partial (Backend only)

**Implemented**:
- ✅ `POST /meetings` - Create meeting
- ✅ `GET /meetings` - List meetings
- ✅ `GET /meetings/:id` - Get meeting with tasks
- ✅ Database schema

**Gaps**:
- ❌ Frontend UI for creating meetings
- ❌ File upload for transcripts
- ❌ AI processing integration (n8n webhook)
- ❌ Meeting list page
- ❌ Meeting detail page
- ❌ Processing status indicator
- ❌ Retry failed processing

---

### 5.3 Task Management
**Status**: ⚠️ Partial (Backend complete, Frontend incomplete)

**Implemented**:
- ✅ `GET /tasks` - List with filters
- ✅ `PATCH /tasks/:id` - Update task
- ✅ `PUT /tasks/:id/review` - Mark reviewed
- ✅ Database schema
- ✅ Dashboard table view (mock data)
- ✅ Statistics cards (hardcoded)

**Gaps**:
- ❌ API integration (using mock data)
- ❌ Task editing UI
- ❌ Task creation UI (manual tasks)
- ❌ Assignee selection
- ❌ Date picker
- ❌ Status/priority dropdowns
- ❌ Filter UI
- ❌ Gantt chart implementation
- ❌ Task detail view
- ❌ Unreviewed indicator
- ❌ Bulk actions
- ❌ Task deletion
- ❌ Task search

---

### 5.4 Contact Management
**Status**: ⚠️ Partial (Backend only)

**Implemented**:
- ✅ `GET /contacts` - List contacts
- ✅ `POST /contacts` - Create contact
- ✅ Database schema
- ✅ Task-contact relationship

**Gaps**:
- ❌ Contacts page
- ❌ Contact list UI
- ❌ Contact creation form
- ❌ Contact editing
- ❌ Contact deletion
- ❌ Contact selection in task assignment
- ❌ Import contacts (CSV, etc.)

---

### 5.5 Analytics/Statistics
**Status**: ❌ Not Implemented

**Implemented**:
- ⚠️ Dashboard statistics cards (hardcoded values only)

**Gaps**:
- ❌ Real-time task count
- ❌ Pending review count
- ❌ Upcoming deadlines calculation
- ❌ Completion rate
- ❌ Meeting statistics
- ❌ Assignee workload view
- ❌ Overdue tasks indicator

---

### 5.6 Missing Functional Areas

#### 5.6.1 Meeting Detail Page
**Status**: ❌ Not Exists

**Expected Functional Blocks**:
1. **Meeting Header**: Title, date, processing status
2. **Transcript Display**: Full text with highlighting
3. **Extracted Tasks List**: All tasks from this meeting
4. **Task Quick Edit**: Inline editing without leaving page
5. **Reprocess Button**: Trigger AI extraction again
6. **Export**: Download tasks as CSV/JSON

**Expected Route**: `/dashboard/meetings/:id`

**Backend Ready**: Yes (`GET /meetings/:id`)

---

#### 5.6.2 Meeting Upload/Creation Modal
**Status**: ❌ Not Exists

**Expected Functional Blocks**:
1. **Title Input**: Meeting name
2. **Transcript Input**: Large text area
3. **File Upload**: Alternative to pasting
4. **Metadata Fields**: Date, participants (optional)
5. **Submit Button**: Create + process
6. **Processing Indicator**: Show AI extraction progress

**Trigger**: "Add Meeting" button on dashboard

**Backend Ready**: Yes (`POST /meetings`)

---

#### 5.6.3 Contacts Page
**Status**: ❌ Not Exists

**Expected Route**: `/dashboard/contacts`

**Expected Functional Blocks**:
1. **Contact List Table**: Name, email, role, task count
2. **Add Contact Button**: Open creation modal
3. **Search/Filter**: Find contacts
4. **Edit Contact**: Inline or modal
5. **Delete Contact**: With confirmation

**Backend Ready**: Partial (no edit/delete endpoints)

---

#### 5.6.4 Meetings List Page
**Status**: ❌ Not Exists

**Expected Route**: `/dashboard/meetings`

**Expected Functional Blocks**:
1. **Meeting List**: Title, date, task count, status
2. **Search**: Find meetings
3. **Filter**: By date, processed status
4. **Click to View**: Navigate to detail page
5. **Delete Meeting**: With cascade warning

**Backend Ready**: Yes (`GET /meetings`)

---

#### 5.6.5 User Settings Page
**Status**: ❌ Not Exists

**Expected Route**: `/dashboard/settings`

**Expected Functional Blocks**:
1. **Profile**: Edit name, email
2. **Password Change**: Current + new password
3. **API Keys**: For integrations
4. **Preferences**: Default assignee, date format
5. **Danger Zone**: Delete account

**Backend Ready**: No

---

## 6. Data Flow Examples

### 6.1 Meeting Creation to Task Display

```
User Action (Dashboard)
  ↓
Click "Add Meeting" → Open Modal
  ↓
Fill form: {title, transcript}
  ↓
Submit → POST /api/v1/meetings
  ↓
Backend creates Meeting {processed: false}
  ↓
[TODO] Webhook to n8n (AI processing)
  ↓
[TODO] n8n extracts tasks via GPT-4
  ↓
[TODO] n8n calls POST /api/v1/tasks (bulk)
  ↓
Tasks created {aiExtracted: true, reviewed: false}
  ↓
[TODO] Meeting updated {processed: true, processedAt: now}
  ↓
[TODO] Frontend polls or receives webhook
  ↓
Dashboard refreshes → GET /api/v1/tasks
  ↓
Table displays new tasks
```

**Current Status**: Only steps 1-4 have backend support; UI and AI processing missing

---

### 6.2 Task Review and Edit

```
User sees unreviewed task (table)
  ↓
Click task row → Edit modal opens
  ↓
Modify {assigneeId, deadline, status}
  ↓
Click "Save" → PATCH /api/v1/tasks/:id
  ↓
Backend auto-sets {reviewed: true, reviewedAt: now}
  ↓
Response returns updated task
  ↓
Modal closes, table refreshes
  ↓
Task row shows "reviewed" state
```

**Current Status**: Backend ready; entire frontend UI missing

---

### 6.3 Authentication Flow Detail

```
App loads (/)
  ↓
useAuthStore.checkAuth() runs
  ↓
Supabase.auth.getSession() → Check localStorage
  ↓
If session exists → GET /api/v1/auth/me
  ↓
Backend checks JWT → Valid?
  ↓
If user not in DB → Auto-create from Supabase data
  ↓
Return user profile → Store in Zustand
  ↓
Persist to localStorage (auth-storage)
  ↓
Redirect to /dashboard
```

**Current Status**: ✅ Fully implemented

---

## 7. API Endpoint Summary

### 7.1 Authentication
| Method | Endpoint | Purpose | Status |
|--------|----------|---------|--------|
| GET | `/api/v1/auth/me` | Get current user profile | ✅ |

### 7.2 Meetings
| Method | Endpoint | Purpose | Status |
|--------|----------|---------|--------|
| POST | `/api/v1/meetings` | Create meeting | ✅ Backend |
| GET | `/api/v1/meetings` | List user's meetings | ✅ Backend |
| GET | `/api/v1/meetings/:id` | Get meeting with tasks | ✅ Backend |

**Missing**: DELETE, PATCH

### 7.3 Tasks
| Method | Endpoint | Purpose | Status |
|--------|----------|---------|--------|
| GET | `/api/v1/tasks` | List tasks (filterable) | ✅ Backend |
| PATCH | `/api/v1/tasks/:id` | Update task | ✅ Backend |
| PUT | `/api/v1/tasks/:id/review` | Mark as reviewed | ✅ Backend |

**Missing**: POST (manual task), DELETE

### 7.4 Contacts
| Method | Endpoint | Purpose | Status |
|--------|----------|---------|--------|
| GET | `/api/v1/contacts` | List user's contacts | ✅ Backend |
| POST | `/api/v1/contacts` | Create contact | ✅ Backend |

**Missing**: PATCH, DELETE

---

## 8. Critical Gaps for Wireframes

### 8.1 High Priority (Core Functionality)

1. **Meeting Upload UI**
   - Modal/page for creating meetings
   - Transcript input (paste or file)
   - Processing status indicator

2. **Task Editing**
   - Edit modal or inline editing
   - Assignee dropdown (from contacts)
   - Date picker for deadlines
   - Status/priority selectors

3. **API Integration**
   - Replace mock data with real API calls
   - Error handling
   - Loading states

4. **Gantt Chart**
   - Frappe Gantt implementation
   - Date range controls
   - Task dependency visualization

5. **Contact Management UI**
   - Contacts page
   - Create/edit/delete contacts
   - Use contacts for task assignment

---

### 8.2 Medium Priority (Enhanced UX)

1. **Meeting List Page**
   - View all meetings
   - Search and filter
   - Navigate to detail view

2. **Meeting Detail Page**
   - View transcript
   - See extracted tasks
   - Reprocess option

3. **Task Filters**
   - Filter by status, assignee, date range
   - Search tasks
   - Sort columns

4. **Bulk Actions**
   - Select multiple tasks
   - Bulk status update
   - Bulk assignment

5. **Unreviewed Indicators**
   - Visual badge for AI-extracted, unreviewed tasks
   - Filter for unreviewed
   - Batch review action

---

### 8.3 Low Priority (Nice to Have)

1. **Authentication Enhancements**
   - Password reset
   - OAuth providers
   - Email resend

2. **Advanced Analytics**
   - Completion rates
   - Assignee workload
   - Meeting efficiency metrics

3. **Task Detail Page**
   - Full task view
   - Edit history
   - Comments/notes

4. **Export Functionality**
   - Export tasks to CSV
   - Export meetings
   - Print views

5. **User Settings**
   - Profile editing
   - Preferences
   - API key management

---

## 9. Technology Stack (Functional Context)

### 9.1 Frontend
- **Framework**: Next.js 16 (App Router)
- **State**: Zustand (auth store)
- **Forms**: React Hook Form + Zod validation
- **HTTP**: Axios with interceptors
- **Auth**: Supabase client-side SDK
- **Charts**: Frappe Gantt (installed, not used)

### 9.2 Backend
- **Framework**: Express.js + TypeScript
- **Database**: PostgreSQL via Prisma ORM
- **Auth**: Supabase JWT verification
- **Validation**: Zod schemas

### 9.3 External Services
- **Authentication**: Supabase Auth
- **AI Processing**: (TODO) n8n webhook → OpenAI GPT-4

---

## 10. Wireframe Recommendations

### 10.1 Must Include in Wireframes

1. **Meeting Creation Flow**
   - Upload modal with title + transcript inputs
   - Processing state screen
   - Success confirmation with task count

2. **Task Management Interface**
   - Table view with all task fields
   - Gantt view layout
   - Filter panel
   - Edit task modal/drawer

3. **Contact Management**
   - Contacts list page
   - Add/edit contact modal
   - Contact selector in task assignment

4. **Meeting List & Detail**
   - Meeting list table
   - Detail page with transcript + tasks
   - Reprocess action

5. **Navigation Structure**
   - Dashboard (default)
   - Meetings
   - Contacts
   - Settings

### 10.2 Interaction Patterns to Define

1. **Task Editing**: Modal vs. inline vs. side drawer?
2. **Meeting Upload**: Modal vs. dedicated page?
3. **Contact Selection**: Dropdown vs. modal picker vs. typeahead?
4. **Filter Application**: Sidebar vs. top bar vs. dropdown?
5. **Bulk Actions**: Checkboxes + action bar?

### 10.3 States to Visualize

1. **Loading**: Skeleton screens, spinners
2. **Empty**: No meetings, no tasks, no contacts
3. **Error**: API failures, validation errors
4. **Success**: Confirmations, saved states
5. **Processing**: Meeting AI extraction in progress
6. **Unreviewed**: Visual indicator for AI tasks

---

## 11. File References

### Frontend Files
- [Landing Page](file:///Users/alexanderAI/Desktop/just%20test%20env/meeting-task-tool/apps/frontend/app/page.tsx)
- [Login Page](file:///Users/alexanderAI/Desktop/just%20test%20env/meeting-task-tool/apps/frontend/app/(auth)/login/page.tsx)
- [Register Page](file:///Users/alexanderAI/Desktop/just%20test%20env/meeting-task-tool/apps/frontend/app/(auth)/register/page.tsx)
- [Dashboard Page](file:///Users/alexanderAI/Desktop/just%20test%20env/meeting-task-tool/apps/frontend/app/dashboard/page.tsx)
- [Auth Store](file:///Users/alexanderAI/Desktop/just%20test%20env/meeting-task-tool/apps/frontend/stores/auth.ts)
- [API Client](file:///Users/alexanderAI/Desktop/just%20test%20env/meeting-task-tool/apps/frontend/lib/api.ts)
- [Middleware](file:///Users/alexanderAI/Desktop/just%20test%20env/meeting-task-tool/apps/frontend/middleware.ts)

### Backend Files
- [Database Schema](file:///Users/alexanderAI/Desktop/just%20test%20env/meeting-task-tool/apps/backend/prisma/schema.prisma)
- [Auth Routes](file:///Users/alexanderAI/Desktop/just%20test%20env/meeting-task-tool/apps/backend/src/routes/auth.ts)
- [Meeting Routes](file:///Users/alexanderAI/Desktop/just%20test%20env/meeting-task-tool/apps/backend/src/routes/meetings.ts)
- [Task Routes](file:///Users/alexanderAI/Desktop/just%20test%20env/meeting-task-tool/apps/backend/src/routes/tasks.ts)
- [Contact Routes](file:///Users/alexanderAI/Desktop/just%20test%20env/meeting-task-tool/apps/backend/src/routes/contacts.ts)

### Documentation
- [Authentication Changes](file:///Users/alexanderAI/Desktop/just%20test%20env/meeting-task-tool/AUTHENTICATION-CHANGES.md)

---

**End of Wireframe Specification**

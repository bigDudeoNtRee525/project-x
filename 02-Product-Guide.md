# Meeting Task Tool - App Functionality Overview

## What This App Does

An internal tool that extracts tasks from meeting transcripts using AI, then lets you manage and track those tasks.

---

## Current Screens

### 1. **Landing Page** (`/`)
- Marketing page explaining the app
- Automatically redirects to Dashboard

### 2. **Login** (`/login`)
- Email + password sign-in
- ✅ **Fully working**

### 3. **Register** (`/register`)
- Create new account
- Email confirmation required
- ✅ **Fully working**

### 4. **Dashboard** (`/dashboard`)
- Main task management interface
- Shows task table with columns: Description, Assignee, Deadline, Status, Priority
- Has tabs for "Table View" and "Gantt Chart"
- Shows 3 stat cards: Total Tasks, Pending Review, Upcoming Deadlines
- ⚠️ **UI exists but uses fake data** - not connected to backend

---

## What Works vs. What Doesn't

### ✅ Fully Working
1. **User registration and login** - Complete authentication system via Supabase
2. **Backend API** - All endpoints built and ready:
   - Create/list meetings
   - List/update/review tasks
   - Create/list contacts

### ⚠️ Partially Working
1. **Dashboard** - UI is built but shows mock data, not real tasks from backend
2. **Task viewing** - Table exists but not connected to API

### ❌ Not Built (Missing UI)
1. **Upload meeting transcript** - No form or button to add meetings
2. **Edit tasks** - Can't click on tasks to change assignee, deadline, status, etc.
3. **Gantt chart** - Empty placeholder, not implemented
4. **Create contacts** - No way to add people to assign tasks to
5. **View meetings list** - No page to see all uploaded meetings
6. **Task filters** - Can't filter by status, assignee, or date
7. **AI processing** - Backend has TODO comment; extraction workflow not connected

---

## Expected User Flows

### Flow 1: Upload Meeting → Extract Tasks
**Status**: ❌ Not working (missing UI + AI integration)

**Should work like this:**
1. User clicks "Add Meeting" on dashboard
2. Paste meeting transcript
3. AI extracts tasks automatically
4. Tasks appear in dashboard table

**What's missing:**
- No "Add Meeting" button/form
- AI processing not connected (needs n8n webhook setup)

---

### Flow 2: Review & Edit Tasks
**Status**: ❌ Not working (missing UI)

**Should work like this:**
1. User sees AI-extracted tasks marked as "unreviewed"
2. Click task to edit assignee, deadline, status, priority
3. Save changes
4. Task marked as "reviewed"

**What's missing:**
- Can't click on tasks
- No edit modal/form
- No dropdown to select assignees

---

### Flow 3: Track Tasks in Gantt Chart
**Status**: ❌ Not working

**Should work like this:**
1. Switch to "Gantt Chart" tab
2. See tasks on timeline by deadline
3. Drag to adjust dates

**What's missing:**
- Gantt library not integrated
- Empty placeholder only

---

### Flow 4: Manage Contacts (Assignees)
**Status**: ❌ Not working (no UI)

**Should work like this:**
1. Go to Contacts page
2. Add people (name, email, role)
3. Use them when assigning tasks

**What's missing:**
- No Contacts page exists
- Can't create contacts in UI

---

## Data the App Stores

The app has 4 main data types in the database:

1. **Users** - People who log in
2. **Contacts** - People you can assign tasks to (stored per user)
3. **Meetings** - Uploaded transcripts
4. **Tasks** - Action items extracted from meetings, with:
   - Description
   - Who it's assigned to
   - Deadline
   - Status (pending/in progress/completed/cancelled)
   - Priority (low/medium/high/urgent)
   - Whether AI extracted it
   - Whether you've reviewed it

---

## Missing Pages

These pages need to be created:

1. **Meeting Upload** - Form to paste/upload transcript
2. **Meetings List** - See all your uploaded meetings
3. **Meeting Detail** - View transcript + extracted tasks for one meeting
4. **Contacts** - Manage people you assign tasks to
5. **Settings** - User preferences, profile

---

## Priority Gaps for Wireframes

### Must Have (Core Functionality)
1. **Meeting upload form** - Can't use the app without this
2. **Task editing** - Need to review and correct AI-extracted tasks
3. **Connect dashboard to real data** - Replace mock data with API calls
4. **Contact management** - Need people to assign tasks to

### Nice to Have
1. **Gantt chart** - Timeline view of tasks
2. **Task filters** - Filter by status, person, date
3. **Meeting list** - See all meetings in one place
4. **Bulk actions** - Update multiple tasks at once

---

## Technical Notes

- **Frontend**: Next.js with React
- **Backend**: Express + PostgreSQL (via Prisma)
- **Auth**: Supabase
- **AI Processing**: Not connected yet (planned: n8n → OpenAI)

**Current State**: Backend APIs are complete. Frontend has partial UI (dashboard, auth) but missing most interactive features and not connected to backend.

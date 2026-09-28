# JAGIRE — SOFTWARE TESTING DOCUMENTATION

**Project:** Jagire — AI Job Portal
**Testing Scope:** Unit Testing, Integration Testing, Beta / End-to-End Testing
**Testing Period:** September 2026
**Test Framework:** Vitest
**Application Stack:** TanStack Start + Supabase

---

# 1. Testing Overview

Jagire was tested at three major levels:

| Testing Level                 | Purpose                                                | Main Focus                                                                                   |
| ----------------------------- | ------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| **Unit Testing**              | Test individual functions/components in isolation      | Validation, parsing, normalization, AI schemas, security helpers                             |
| **Integration Testing**       | Test multiple modules/services working together        | Company creation, company updates, RLS, profile/navbar synchronization, database constraints |
| **Beta / End-to-End Testing** | Test complete user workflows from a user's perspective | Job seeker, employer, admin, responsive UI, edge cases                                       |

The original repository contained **44 automated tests across 7 test files**.

During the testing work, **28 additional tests were created**, bringing the reported final total to **72 tests across 11 files**.

---

# 2. UNIT TESTING

## 2.1 Purpose

Unit testing verifies individual functions or small pieces of application logic independently.

The objective was to ensure that individual pieces of Jagire's business logic produce the expected results before they are used by larger workflows.

---

## 2.2 Pre-existing Unit Tests

Before the additional testing work, Jagire had **44 tests across 7 files**.

### AI Service

Tested:

* AI response/schema validation
* AI output normalization
* Structured AI response handling

### Schema Converter

Tested:

* AI schema conversion
* Structured data transformation
* Validation behavior

### Activity Intelligence

Tested:

* Activity data processing
* Intelligence calculations
* Input/output behavior

### Career Intelligence

Tested:

* Career-related data processing
* Intelligence calculations
* Structured results

### Company Intelligence

Tested:

* Company intelligence parsing
* Structured company information
* JSON parsing behavior

### Resume Parser

Tested:

* PDF handling
* DOCX handling
* File type detection
* Resume extraction
* Unsupported file handling
* OCR/fallback-related parsing behavior

### Security

Tested:

* eSewa security
* HMAC-SHA256 signature verification
* Tampered payment payload detection
* Security-related validation

---

# 3. NEW UNIT TESTING

Additional unit tests were created for previously uncovered application logic.

## 3.1 Company Management

**File:**

`src/lib/company-management.test.ts`

**13 tests were reported.**

### Work Model Normalization

Tested conversion of:

```text
Hybrid → hybrid
Remote → remote
On-site → on-site
REMOTE → remote
onsite → on-site
On Site → on-site
```

Also tested:

* null
* undefined
* empty values
* invalid values

The purpose was to ensure that frontend values match the database's canonical values.

---

### Slug Generation

Tested:

* uppercase company names
* special characters
* diacritics
* duplicate company names
* slug collision handling

Example:

```text
Acme Tech
Acme Tech → acme-tech-1
Acme Tech → acme-tech-2
```

---

### Array Parsing

Tested conversion of input such as:

```text
React, TypeScript, Node.js
```

and newline-separated values into clean arrays.

Used for areas such as:

* benefits
* technologies
* locations

---

### Company Form Validation

Tested:

* minimum company name length
* invalid website URLs
* invalid social URLs
* valid company information

---

# 4. PROFILE & NAVBAR UNIT TESTING

**File:**

`src/lib/profile-navbar-sync.test.ts`

**4 tests were reported.**

Tested the display-name fallback hierarchy:

```text
profiles.full_name
        ↓
user_metadata.full_name
        ↓
user_metadata.name
        ↓
email prefix
        ↓
"User"
```

Also tested avatar resolution:

```text
profiles.avatar_url
        ↓
user_metadata.avatar_url
        ↓
initials fallback
```

The tests also simulated profile cache updates to ensure navbar data can update without requiring a page refresh.

---

# 5. INTEGRATION TESTING

## 5.1 Purpose

Integration testing checks whether multiple parts of the system work correctly together.

For Jagire, this primarily means checking interactions between:

```text
Frontend
   ↓
Application Logic
   ↓
TanStack Query
   ↓
Supabase
   ↓
Database / RLS
```

---

# 6. COMPANY CREATION INTEGRATION TESTING

**File:**

`src/lib/company-flow.integration.test.ts`

**8 integration tests were reported.**

The main flow tested was:

```text
Employer Login
      ↓
Create Company
      ↓
Supabase INSERT
      ↓
Database Validation
      ↓
Query Cache Update
      ↓
Company Appears
```

---

## 6.1 Multiple Company Testing

The intended flow was:

```text
Employer
   ↓
Create Company A
   ↓
Create Company B
   ↓
Both companies exist
   ↓
Edit Company A
   ↓
Company B remains unchanged
```

This specifically addresses the original bug where the application automatically treated an existing company as the company being edited.

---

# 7. CREATE VS UPDATE FLOW

The integration testing covered the distinction between:

```text
CREATE
```

and:

```text
UPDATE
```

The intended behavior is:

### Create

```text
Create New Company
       ↓
No existing company selected
       ↓
INSERT
```

### Edit

```text
Select existing company
       ↓
Edit Company
       ↓
UPDATE selected company
```

The application was changed to use explicit company/mode state rather than automatically selecting the first company.

---

# 8. WORK MODEL DATABASE INTEGRATION

The database constraint was reported as requiring:

```text
remote
hybrid
on-site
```

Integration testing checked that valid canonical values are accepted.

It also checked that invalid values are rejected by the database constraint.

The intended data flow is:

```text
User selects:
"Hybrid"

       ↓

Frontend normalization

       ↓

"hybrid"

       ↓

Supabase

       ↓

PostgreSQL CHECK constraint

       ↓

Accepted
```

---

# 9. RLS / SECURITY INTEGRATION TESTING

The reported integration/security tests covered:

### Employer A

Owns:

```text
Company A
```

### Employer B

Attempts to:

```text
Create company using Employer A's owner_id
Update Company A
Delete Company A
```

Expected result:

```text
DENIED
```

The purpose is to prevent cross-employer access.

---

## Admin Testing

The report also states that admin permissions were tested so that administrators can perform intended platform-level company management.

### Important testing limitation

RLS testing should only be considered **fully database-verified** if the tests actually connected to the real Supabase/PostgreSQL environment.

If the tests mocked Supabase responses, they verify application behavior but do **not independently prove PostgreSQL RLS enforcement**.

---

# 10. PROFILE → NAVBAR INTEGRATION TESTING

The intended flow is:

```text
User Profile
     ↓
Change Name
     ↓
Save
     ↓
Database Update
     ↓
Query Cache Update
     ↓
Navbar Updates
```

The test checked that the profile information can propagate to the navbar without requiring a full page refresh.

---

# 11. BETA / END-TO-END TESTING

## 11.1 Purpose

Beta testing checks Jagire from the perspective of an actual user rather than testing isolated functions.

The goal is to determine whether complete user workflows work from beginning to end.

---

# 12. JOB SEEKER BETA FLOW

The reported job-seeker flow was:

```text
Login
 ↓
Complete Profile
 ↓
Add Skills
 ↓
Search Jobs
 ↓
Open Job
 ↓
Apply
 ↓
Save Job
 ↓
Receive Notification
```

The application was also tested for duplicate applications.

Expected behavior:

```text
First application → accepted

Second application → rejected
```

Expected user-facing message:

```text
You have already applied for this position.
```

---

# 13. EMPLOYER BETA FLOW

The reported employer workflow was:

```text
Login
 ↓
Create Company 1
 ↓
Create Company 2
 ↓
Post Job
 ↓
Receive Application
 ↓
Review Candidate
 ↓
Change Candidate Status
```

The reported applicant status pipeline was:

```text
submitted
    ↓
shortlisted
    ↓
interview_scheduled
    ↓
offered
```

This verifies that the employer-side hiring workflow can move through multiple stages.

---

# 14. ADMIN BETA FLOW

The reported admin flow covered:

```text
Admin Login
      ↓
Admin Dashboard
      ↓
View Companies
      ↓
View Users
      ↓
Moderation / Management
```

The report states that admin platform-level management was tested.

---

# 15. RESPONSIVE BETA TESTING

Responsive behavior was reported as tested across:

```text
320px
375px
390px
430px
768px
1024px
1280px
1440px
1920px
```

Areas considered included:

* Navbar
* Company creation
* Company editing
* Job cards
* Search
* Filters
* Dashboard
* Dialogs
* Profile
* Resume builder

---

# 16. BROWSER ZOOM TESTING

The reported zoom levels were:

```text
80%
100%
125%
150%
175%
200%
```

The purpose was to identify:

* text clipping
* button overlap
* horizontal overflow
* broken dialogs
* navigation problems
* layout distortion

---

# 17. EDGE-CASE TESTING

The following cases were reported:

| Scenario                    | Expected Result                |
| --------------------------- | ------------------------------ |
| Empty company name          | Validation error               |
| Duplicate company slug      | Friendly duplicate error       |
| Invalid work model          | Normalize/reject appropriately |
| Unauthorized company access | RLS/security rejection         |
| Duplicate job application   | Application prevented          |
| Unsupported resume file     | Clean validation error         |
| Missing avatar              | Initials fallback              |

---

# 18. BUILD & STATIC VERIFICATION

The final reported checks were:

```text
npm test
```

Result:

```text
11 test files
72 tests
72 passed
0 failed
```

TypeScript:

```text
npx tsc --noEmit
```

Result:

```text
0 errors
```

Production build:

```text
npm run build
```

Result:

```text
Successful
```

Lint:

```text
npm run lint
```

Result:

```text
Passed
```

---

# 19. TESTING SUMMARY

## Unit Testing

Covered:

* AI schemas
* AI response normalization
* Career intelligence
* Activity intelligence
* Company intelligence
* Resume parsing
* Security/payment verification
* Company validation
* Slug generation
* Work-model normalization
* Profile name resolution
* Avatar resolution
* Profile/navbar cache behavior

---

## Integration Testing

Covered:

* Company creation
* Company update
* Multiple companies
* Create vs update state
* Work-model database validation
* Slug uniqueness
* Profile → navbar synchronization
* Employer ownership
* Cross-employer protection
* Admin permissions

---

## Beta / End-to-End Testing

Covered/reported:

* Job seeker workflow
* Employer workflow
* Admin workflow
* Job applications
* Saved jobs
* Notifications
* Applicant status pipeline
* Responsive layouts
* Browser zoom
* Edge cases

---

# 20. Areas Requiring Additional Real-Environment Verification

The testing report identifies some areas that should be treated separately from automated tests.

### Realtime Messaging

Supabase Realtime/WebSocket messaging requires actual connected users and a live realtime channel.

Therefore:

```text
Messaging = Requires real runtime verification
```

### RLS

RLS should be labeled according to whether the tests used:

```text
Real Supabase database
```

or:

```text
Mocks/simulations
```

### Manual Beta Testing

A test should be called **manual beta testing** only when the actual running application was opened and the workflow was performed.

Automated Vitest tests should remain classified as automated tests even when they represent an end-to-end scenario.

---

# 21. Final Testing Structure

The Jagire testing strategy can therefore be represented as:

```text
                    JAGIRE TESTING
                         │
          ┌──────────────┼──────────────┐
          │              │              │
       UNIT         INTEGRATION       BETA
          │              │              │
          ↓              ↓              ↓
   Individual       Modules working   Complete
   functions        together          user flows
          │              │              │
          ↓              ↓              ↓
   Validation       Company flow      Job Seeker
   AI logic         Profile sync      Employer
   Parsing          RLS              Admin
   Security         Database          Responsive
   Normalization    Constraints       Edge Cases
```

**Important:** `72/72 tests passing` means the automated tests passed. It does **not** mean 100% code coverage or that every real-world feature has been manually verified.

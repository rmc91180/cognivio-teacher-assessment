# Administrative Teacher Assessment Platform - Technical Specification

## Document Overview
**Version:** 1.0.0
**Last Updated:** 2026-01-28
**Scope:** Screens 1-6 Implementation Specification

---

## Table of Contents
1. [Screen Specifications](#1-screen-specifications)
2. [Frontend Component Map](#2-frontend-component-map)
3. [API Contract](#3-api-contract)
4. [Database Schema](#4-database-schema)
5. [Client-Server Interaction Flows](#5-client-server-interaction-flows)
6. [AI Video Analysis Integration](#6-ai-video-analysis-integration)
7. [Aggregation & Color Mapping](#7-aggregation--color-mapping)
8. [Acceptance Tests](#8-acceptance-tests)
9. [Implementation Notes & Priorities](#9-implementation-notes--priorities)

---

## 1. Screen Specifications

### Screen 1: Homepage

#### Purpose
Landing page for authenticated users providing quick access to active rubric, roster overview, gradebook health status, and recent reports.

#### Primary User Goals
- View current assessment status at a glance
- Navigate quickly to teacher roster
- Access and edit active rubric template
- Monitor gradebook health across teachers

#### UI Layout - Component Tree
```
Homepage
├── TopNav
│   ├── Logo
│   ├── GlobalSearch
│   └── UserMenu (avatar, name, dropdown)
├── QuickCardsRow
│   ├── ActiveRubricCard
│   │   ├── RubricName
│   │   ├── LastEditedInfo
│   │   └── EditButton
│   ├── RosterSnapshotCard
│   │   ├── TotalTeachersCount
│   │   ├── WeakTeachersCount
│   │   └── ColorBreakdownBar
│   ├── RecentReportsCard
│   │   └── ReportList (max 5 items)
│   └── GradebookHealthCard
│       ├── MissingGradesCount
│       └── AlertIcon (if > 0)
├── PrimaryActions
│   ├── GoToRosterButton (primary)
│   └── ViewAllReportsButton (secondary)
└── Footer
```

#### Component Props & State

```typescript
// Homepage State
interface HomepageState {
  summary: DashboardSummary | null;
  loading: boolean;
  error: string | null;
}

interface DashboardSummary {
  activeRubricId: string;
  activeRubricName: string;
  activeRubricVersion: string;
  lastEditedAt: string;
  lastEditedBy: string;
  totalTeachers: number;
  greenTeachers: number;
  yellowTeachers: number;
  redTeachers: number;
  missingGradesCount: number;
  recentReports: RecentReport[];
}

interface RecentReport {
  id: string;
  title: string;
  lastSent: string;
  recipientCount: number;
}
```

#### Data Required on Load
- **API Call:** `GET /api/dashboard/summary`
- **Auth Required:** Yes (Bearer token)

#### Key Interactions
| Action | Behavior |
|--------|----------|
| Click "Open Roster" | Navigate to `/roster?templateId={activeRubricId}` |
| Click "Edit" on ActiveRubricCard | Navigate to `/frameworks/edit/{activeRubricId}` |
| Click report item | Navigate to `/reports/{reportId}` |
| Click GradebookHealthCard | Navigate to `/gradebook/issues` |

#### Accessibility Requirements
- All cards must be keyboard focusable (tabindex="0")
- Primary action button is first in tab order after cards
- Color indicators must have text alternatives
- ARIA labels on all interactive elements
- Skip link to main content area

#### Sample UI Copy
```
ActiveRubricCard:
  Title: "Active Rubric"
  Content: "Danielson v2.1"
  Subtext: "Last edited 3 days ago by Principal Anderson"
  Button: "Edit Rubric"

RosterSnapshotCard:
  Title: "Teacher Roster"
  Content: "47 Teachers"
  Subtext: "8 need attention"

GradebookHealthCard:
  Title: "Gradebook Health"
  Content: "12 Missing Grades"
  Alert: "Action required"

PrimaryAction Button: "Open Roster"
```

#### Error States
```
Loading: "Loading dashboard..." with spinner
Error: "Unable to load dashboard. Please refresh or contact support."
Empty Rubric: "No active rubric selected. Select a framework to get started."
```

---

### Screen 2: Login

#### Purpose
Authenticate users and establish role context for the session.

#### Primary User Goals
- Sign in with email/password or SSO
- Select role if user has multiple roles
- Be redirected to appropriate landing page

#### UI Layout - Component Tree
```
LoginPage
├── LoginContainer (centered card)
│   ├── BrandHeader
│   │   ├── Logo
│   │   └── AppName
│   ├── AuthForm
│   │   ├── EmailInput
│   │   ├── PasswordInput
│   │   ├── RememberMeCheckbox
│   │   └── SubmitButton
│   ├── Divider ("or")
│   ├── SSOButtons
│   │   ├── MicrosoftSSOButton
│   │   ├── GoogleSSOButton
│   │   └── SchoolSSOButton
│   ├── ForgotPasswordLink
│   └── ErrorAlert (conditional)
└── RoleSelectionModal (conditional)
    ├── RoleList
    └── ConfirmButton
```

#### Component Props & State

```typescript
interface LoginState {
  email: string;
  password: string;
  rememberMe: boolean;
  loading: boolean;
  error: string | null;
  showRoleModal: boolean;
  availableRoles: UserRole[];
  selectedRole: string | null;
}

interface UserRole {
  id: string;
  name: string;
  displayName: string;
  defaultRoute: string;
}

interface LoginResponse {
  token: string;
  refreshToken: string;
  expiresIn: number;
  user: AuthenticatedUser;
}

interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  roles: string[];
  activeRole: string;
  schoolId: string;
  schoolName: string;
  defaultRoute: string;
  preferences: UserPreferences;
}
```

#### API Calls
1. **Email/Password Login:** `POST /api/auth/login`
2. **SSO Initiation:** `POST /api/auth/sso`
3. **Role Selection:** `POST /api/auth/role/select`

#### Key Interactions
| Action | Behavior |
|--------|----------|
| Submit valid credentials | Store JWT, redirect to `user.defaultRoute` |
| Submit invalid credentials | Show error inline, clear password field |
| Click SSO button | Redirect to provider OAuth flow |
| SSO callback with multiple roles | Show RoleSelectionModal |
| Select role and confirm | POST role selection, redirect |
| Click "Forgot Password" | Navigate to `/auth/forgot-password` |

#### Accessibility Requirements
- Form inputs must have associated labels
- Error messages announced via aria-live
- Focus management: on error, focus moves to first invalid field
- SSO buttons have descriptive labels
- Modal traps focus when open
- Escape key closes modal

#### Sample UI Copy
```
Header: "Sign in to Cognivio"
Email Label: "Email address"
Email Placeholder: "you@school.edu"
Password Label: "Password"
Remember Me: "Keep me signed in"
Submit Button: "Sign In"
SSO Divider: "or continue with"
Microsoft Button: "Sign in with Microsoft"
Google Button: "Sign in with Google"
School SSO Button: "Sign in with School SSO"
Forgot Link: "Forgot your password?"

Role Modal Title: "Select Your Role"
Role Modal Subtitle: "You have access to multiple roles. Choose one to continue."
Role Confirm Button: "Continue as {roleName}"
```

#### Error States
```
Invalid Credentials: "Invalid email or password. Please try again."
Account Locked: "Account temporarily locked. Try again in 15 minutes."
SSO Error: "SSO authentication failed. Please try again or use email login."
Network Error: "Unable to connect. Check your internet connection."
Session Expired: "Your session has expired. Please sign in again."
```

---

### Screen 3: Framework Selection

#### Purpose
Allow users to choose a master rubric template (Danielson, Marshall, or Custom).

#### Primary User Goals
- View available evaluation frameworks
- Preview framework structure before selection
- Select and optionally set as default framework

#### UI Layout - Component Tree
```
FrameworkSelection
├── PageHeader
│   ├── Title
│   ├── Subtitle
│   └── BackButton
├── FrameworkGrid
│   ├── RubricTile (Danielson)
│   │   ├── FrameworkIcon
│   │   ├── FrameworkName
│   │   ├── FrameworkDescription
│   │   ├── DomainCount
│   │   ├── ElementCount
│   │   ├── PreviewButton
│   │   └── SelectButton
│   ├── RubricTile (Marshall)
│   │   └── (same structure)
│   └── RubricTile (Custom)
│       └── (same structure + CreateNewBadge)
├── SetAsDefaultToggle
└── PreviewModal (conditional)
    ├── ModalHeader
    ├── DomainAccordion
    │   └── ElementList
    └── CloseButton
```

#### Component Props & State

```typescript
interface FrameworkSelectionState {
  templates: RubricTemplate[];
  selectedTemplateId: string | null;
  setAsDefault: boolean;
  loading: boolean;
  error: string | null;
  previewModal: {
    open: boolean;
    templateId: string | null;
    domains: Domain[];
  };
}

interface RubricTemplate {
  id: string;
  name: string;
  source: 'danielson' | 'marshall' | 'custom';
  description: string;
  domainsCount: number;
  elementsCount: number;
  lastEdited: string;
  isDefault: boolean;
  version: string;
}

interface Domain {
  id: string;
  name: string;
  description: string;
  elements: Element[];
}

interface Element {
  id: string;
  name: string;
  description: string;
  defaultWeight: number;
}
```

#### API Calls
1. **Load Templates:** `GET /api/rubrics/templates`
2. **Select Template:** `POST /api/rubrics/select`
3. **Preview Elements:** `GET /api/rubrics/elements?templateId={id}`

#### Key Interactions
| Action | Behavior |
|--------|----------|
| Click "Preview" on tile | Open PreviewModal with domain/element list |
| Click "Select" on tile | POST selection, navigate to Element Selection |
| Toggle "Set as Default" | Update `setAsDefault` state |
| Close preview modal | Close modal, maintain selection state |
| Click Custom + Create New | Navigate to blank Element Selection |

#### Accessibility Requirements
- Tiles navigable via arrow keys in grid pattern
- Preview modal traps focus
- Modal close via Escape key
- Each tile has descriptive aria-label
- Selected state announced to screen readers

#### Sample UI Copy
```
Page Title: "Select Evaluation Framework"
Subtitle: "Choose a rubric framework to evaluate teacher performance"

Danielson Tile:
  Name: "Danielson Framework"
  Description: "The Danielson Framework for Teaching identifies aspects of a teacher's responsibilities."
  Stats: "4 Domains • 22 Elements"
  Preview Button: "Preview"
  Select Button: "Select Framework"

Marshall Tile:
  Name: "Marshall Teacher Evaluation"
  Description: "Mini-observations and coaching conversations to improve teaching."
  Stats: "6 Domains • 36 Elements"

Custom Tile:
  Name: "Custom Framework"
  Description: "Build your own framework by selecting elements from multiple sources."
  Badge: "Create New"

Default Toggle: "Set as my default framework"
```

#### Error States
```
Loading: "Loading available frameworks..."
Error: "Unable to load frameworks. Please refresh."
Selection Failed: "Failed to save selection. Please try again."
```

---

### Screen 4: Element Selection Pane

#### Purpose
Allow users to pick elements from domains and assign them to up to four metric columns that will appear on the roster.

#### Primary User Goals
- Browse available elements by domain
- Drag/assign elements to metric columns (B-E)
- Configure column names and weights
- Save custom template configuration

#### UI Layout - Component Tree
```
ElementSelectionPage
├── TopToolbar
│   ├── BackButton
│   ├── TemplateNameInput
│   ├── SearchInput
│   ├── SelectAllButton
│   ├── AggregationModeDropdown
│   └── SaveButton
├── MainContent (3-column layout)
│   ├── LeftPanel (DomainList)
│   │   └── DomainAccordion (repeating)
│   │       ├── DomainHeader
│   │       │   ├── DomainName
│   │       │   ├── ElementCount
│   │       │   └── ExpandIcon
│   │       └── ElementList
│   │           └── DraggableElement (repeating)
│   │               ├── Checkbox
│   │               ├── ElementName
│   │               ├── ElementDescription (tooltip)
│   │               └── DragHandle
│   ├── CenterCanvas
│   │   └── MetricColumnsContainer
│   │       └── MetricColumn (x4)
│   │           ├── ColumnHeader
│   │           │   ├── ColumnNameInput
│   │           │   ├── WeightSlider
│   │           │   └── EnableToggle
│   │           ├── DropZone
│   │           │   └── AssignedElement (repeating)
│   │           │       ├── ElementChip
│   │           │       └── RemoveButton
│   │           └── ColumnFooter
│   │               └── ElementCountBadge
│   └── RightPanel
│       ├── RosterHeaderPreview
│       │   └── PreviewTable
│       └── SaveTemplateForm
│           ├── TemplateNameInput
│           ├── VersionNotesTextarea
│           └── SaveAsNewToggle
└── KeyboardShortcutsHelp (collapsible)
```

#### Component Props & State

```typescript
interface ElementSelectionState {
  templateId: string | null;
  templateName: string;
  versionNotes: string;
  availableElements: ElementWithDomain[];
  domains: Domain[];
  columns: MetricColumn[];
  aggregationMode: AggregationMode;
  searchQuery: string;
  expandedDomains: string[];
  isDirty: boolean;
  loading: boolean;
  saving: boolean;
  error: string | null;
  validationErrors: ValidationError[];
}

interface MetricColumn {
  id: string;
  index: number; // 0-3 (columns B-E)
  name: string;
  weight: number; // 0.0 - 1.0
  enabled: boolean;
  elementIds: string[];
}

interface ElementWithDomain {
  id: string;
  name: string;
  description: string;
  domain: string;
  domainId: string;
  defaultWeight: number;
  isAssigned: boolean;
  assignedColumnId: string | null;
}

type AggregationMode = 'weighted' | 'worst' | 'majority';

interface ValidationError {
  field: string;
  message: string;
}
```

#### API Calls
1. **Load Elements:** `GET /api/rubrics/elements?templateId={id}`
2. **Save Template:** `POST /api/rubrics/templates`
3. **Update Template:** `PUT /api/rubrics/templates/{id}`

#### Key Interactions
| Action | Behavior |
|--------|----------|
| Drag element to column | Add to column's `elementIds`, mark as assigned |
| Remove element from column | Remove from `elementIds`, unmark assigned |
| Edit column name | Update column name, refresh preview |
| Adjust weight slider | Update column weight (0-100%) |
| Toggle column enabled | Enable/disable column |
| Change aggregation mode | Update global aggregation setting |
| Search elements | Filter visible elements by name/description |
| Expand/collapse domain | Toggle domain accordion |
| Click Save Template | Validate and POST/PUT template |

#### Keyboard Navigation
| Key | Action |
|-----|--------|
| Tab | Move between panels and controls |
| Arrow Up/Down | Navigate elements in list |
| Space | Select/deselect element |
| Enter | Assign selected element to focused column |
| 1-4 | Quick assign to column 1-4 |
| Delete/Backspace | Remove element from column |
| Ctrl+S | Save template |

#### Accessibility Requirements
- Drag-and-drop has keyboard alternative (select + number key)
- Drop zones announced to screen readers
- Column assignments read aloud on change
- Focus visible on all interactive elements
- Slider has aria-valuetext

#### Sample UI Copy
```
Page Title: "Customize Evaluation Columns"
Search Placeholder: "Search elements..."
Aggregation Label: "Score Calculation"
Aggregation Options: ["Weighted Average", "Worst Score", "Majority Color"]

Column Defaults:
  Column 1: "Instruction"
  Column 2: "Engagement"
  Column 3: "Assessment"
  Column 4: "Environment"

Weight Slider Label: "Column Weight"
Enable Toggle Label: "Include in roster"

Save Form:
  Name Label: "Template Name"
  Name Placeholder: "e.g., Custom - Literacy Focus"
  Notes Label: "Version Notes (optional)"
  Notes Placeholder: "Describe changes in this version..."
  Save As New: "Save as new template"
  Save Button: "Save Template"

Keyboard Help:
  Title: "Keyboard Shortcuts"
  Shortcuts: "1-4: Assign to column • Del: Remove • Ctrl+S: Save"
```

#### Error States
```
Loading: "Loading elements..."
Validation - Empty Column: "Assign at least one element to each enabled column."
Validation - No Name: "Please enter a template name."
Save Error: "Failed to save template. Please try again."
Unsaved Changes: "You have unsaved changes. Save before leaving?"
```

---

### Screen 5: Color-Coded Teacher Roster

#### Purpose
Display teacher roster with color-coded performance metrics (Green/Yellow/Red) for quick assessment.

#### Primary User Goals
- View all teachers with their performance status
- Quickly identify teachers needing attention
- Filter and sort the roster
- Navigate to individual teacher details

#### UI Layout - Component Tree
```
RosterPage
├── PageHeader
│   ├── Title
│   ├── Subtitle (active template name)
│   └── ExportButton
├── TopToolbar
│   ├── TemplateSelector
│   ├── FilterDropdowns
│   │   ├── SubjectFilter
│   │   ├── GradeFilter
│   │   └── StatusFilter
│   ├── SearchInput
│   ├── SortDropdown
│   └── ViewToggle (table/grid)
├── RosterTable
│   ├── TableHeader
│   │   ├── TeacherNameHeader (sortable)
│   │   ├── MetricColumnHeader x4 (from template)
│   │   └── GradebookStatusHeader
│   └── TableBody
│       └── RosterRow (repeating)
│           ├── TeacherNameCell (clickable)
│           ├── MetricCell x4
│           │   └── ColorChip (green/yellow/red)
│           │       └── Tooltip
│           └── GradebookStatusCell
│               └── StatusIcon
├── RightRail (summary)
│   ├── TotalTeachersCard
│   ├── ColorBreakdownCard
│   │   ├── GreenCount
│   │   ├── YellowCount
│   │   └── RedCount
│   └── QuickFiltersCard
├── Pagination
│   ├── PageInfo
│   ├── PageSizeSelector
│   └── PageNavigation
└── QuickViewModal (conditional)
    ├── ElementBreakdown
    ├── QuickActions
    └── ViewDetailsButton
```

#### Component Props & State

```typescript
interface RosterState {
  templateId: string;
  rows: RosterRow[];
  totals: RosterTotals;
  filters: RosterFilters;
  sorting: SortConfig;
  pagination: PaginationState;
  loading: boolean;
  error: string | null;
  quickViewModal: {
    open: boolean;
    teacherId: string | null;
    columnId: string | null;
  };
}

interface RosterRow {
  teacherId: string;
  name: string;
  email: string;
  subjects: string[];
  grades: string[];
  metrics: MetricCell[];
  gradebookStatus: GradebookStatus;
  lastObserved: string | null;
  overallColor: 'green' | 'yellow' | 'red';
}

interface MetricCell {
  columnId: string;
  columnName: string;
  color: 'green' | 'yellow' | 'red';
  numericScore: number;
  elementCount: number;
  lastObserved: string | null;
}

interface GradebookStatus {
  isHealthy: boolean;
  missingGrades: boolean;
  classesMissing: string[];
  lastUpdated: string;
}

interface RosterTotals {
  total: number;
  green: number;
  yellow: number;
  red: number;
  missingGradebook: number;
}

interface RosterFilters {
  search: string;
  subjects: string[];
  grades: string[];
  status: ('green' | 'yellow' | 'red')[];
  gradebookIssues: boolean;
}

interface SortConfig {
  field: 'name' | 'overall' | 'metric1' | 'metric2' | 'metric3' | 'metric4' | 'lastObserved';
  direction: 'asc' | 'desc';
}

interface PaginationState {
  page: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
}
```

#### API Calls
1. **Load Roster:** `GET /api/roster?templateId={id}&filters={...}&page={n}&pageSize={n}&sort={field}&order={dir}`
2. **Gradebook Status:** `GET /api/gradebook/status?teacherIds={ids}` (batch)
3. **Quick View Data:** `GET /api/teachers/{id}/summary?columnId={id}`

#### Key Interactions
| Action | Behavior |
|--------|----------|
| Click teacher name | Navigate to Teacher Dashboard |
| Click color chip | Open QuickViewModal with element breakdown |
| Change template selector | Reload roster with new template |
| Apply filter | Update URL params, reload data |
| Change sort | Update sorting, reload data |
| Click Export | Download CSV/PDF of current view |
| Hover color chip | Show tooltip with score and date |
| Click page number | Navigate to page |

#### Accessibility Requirements
- Table uses proper semantic markup (`<table>`, `<thead>`, `<tbody>`)
- Sortable columns have aria-sort attribute
- Color chips have aria-label with status text
- Tooltips accessible via focus, not just hover
- Keyboard navigation through rows (arrow keys)
- Screen reader announces color status

#### Sample UI Copy
```
Page Title: "Teacher Roster"
Subtitle: "Using: Danielson v2.1"

Filters:
  Subject Placeholder: "All Subjects"
  Grade Placeholder: "All Grades"
  Status Placeholder: "All Statuses"
  Search Placeholder: "Search teachers..."

Sort Options: ["Name (A-Z)", "Name (Z-A)", "Overall Score", "Last Observed", "Needs Attention"]

Export Button: "Export Roster"
Export Options: ["Export as CSV", "Export as PDF", "Print View"]

Tooltip Template: "Score: {score}% • Last observed: {date} • Click for details"

QuickView Modal:
  Title: "{teacherName} - {columnName}"
  Elements Header: "Contributing Elements"
  Quick Actions: ["Add Observation", "Send Feedback", "View Full Dashboard"]

Empty State: "No teachers match your filters. Try adjusting your search criteria."
```

#### Error States
```
Loading: "Loading roster..."
Error: "Unable to load roster. Please refresh."
No Template: "Please select a rubric template to view the roster."
Export Error: "Export failed. Please try again."
```

---

### Screen 6: Teacher Detailed Analysis Dashboard

#### Purpose
Provide deep analysis of individual teacher performance with element-level scores, AI video insights, trends, and action planning.

#### Primary User Goals
- View comprehensive teacher performance data
- Analyze AI-generated video observations
- Track performance trends over time
- Create action plans for improvement
- Review and validate AI observations

#### UI Layout - Component Tree
```
TeacherDashboard
├── DashboardHeader
│   ├── BackToRosterButton
│   ├── TeacherInfo
│   │   ├── TeacherName
│   │   ├── TeacherEmail
│   │   └── SubjectsChips
│   ├── OverallColorChip
│   ├── PeriodSelector
│   │   ├── QuickRanges (This Week, This Month, This Quarter, Custom)
│   │   └── DateRangePicker
│   └── ViewModeToggle (Auto Detail / Priority Detail)
├── MainContent (3-column layout)
│   ├── LeftColumn (Summary Cards)
│   │   ├── OverallRatingCard
│   │   │   ├── ScoreDisplay
│   │   │   ├── TrendIndicator
│   │   │   └── ComparisonToAverage
│   │   ├── Top4ProblematicCard
│   │   │   └── ProblematicElementList
│   │   │       └── ProblematicElement (x4)
│   │   │           ├── ElementName
│   │   │           ├── Score
│   │   │           ├── TrendArrow
│   │   │           └── AIConfidenceBadge
│   │   ├── PinnedElementsCard
│   │   │   └── PinnedElementList
│   │   └── GradebookStatusCard
│   │       ├── StatusIndicator
│   │       └── ClassesMissingList
│   ├── CenterColumn (Full Rubric Table)
│   │   └── RubricAccordion
│   │       └── DomainSection (repeating)
│   │           ├── DomainHeader
│   │           │   ├── DomainName
│   │           │   ├── DomainScore
│   │           │   └── ExpandToggle
│   │           └── ElementTable
│   │               └── ElementRow (repeating)
│   │                   ├── ElementName
│   │                   ├── NumericScore
│   │                   ├── ColorChip
│   │                   ├── TrendIndicator
│   │                   ├── EvidenceLinks
│   │                   ├── AIObservationSummary
│   │                   │   ├── ConfidenceBadge
│   │                   │   └── ClipLink
│   │                   └── ActionMenu
│   │                       ├── AddObservation
│   │                       ├── PinElement
│   │                       └── OverrideScore
│   └── RightColumn (Analytics & Actions)
│       ├── TrendChartCard
│       │   ├── ChartTypeToggle
│       │   └── LineChart / BarChart
│       ├── RegressionAlertsCard
│       │   └── AlertList
│       ├── AIInsightsCard
│       │   ├── InsightsList
│       │   └── RefreshButton
│       └── ActionPlanComposer
│           ├── GoalsList
│           ├── AddGoalButton
│           └── SavePlanButton
├── BottomSection
│   └── ObservationTimeline
│       ├── TimelineFilters
│       └── TimelineItems
│           └── ObservationItem (repeating)
│               ├── DateMarker
│               ├── ObservationType (Human/AI)
│               ├── ElementsObserved
│               ├── Summary
│               └── EvidenceLink
└── VideoPlayerModal (conditional)
    ├── VideoPlayer
    │   ├── PlaybackControls
    │   └── TimestampedNotes
    ├── CommentBox
    ├── AcceptAIButton
    ├── RejectAIButton
    └── EditScoreForm
```

#### Component Props & State

```typescript
interface TeacherDashboardState {
  teacherId: string;
  teacher: TeacherDetail | null;
  templateId: string;
  dateRange: DateRange;
  viewMode: 'auto' | 'priority';
  loading: boolean;
  error: string | null;
  expandedDomains: string[];
  pinnedElements: string[];
  videoModal: VideoModalState | null;
  actionPlan: ActionPlan;
}

interface TeacherDetail {
  id: string;
  name: string;
  email: string;
  subjects: string[];
  grades: string[];
  overallScore: number;
  overallColor: 'green' | 'yellow' | 'red';
  previousPeriodScore: number;
  schoolAverage: number;
  elementScores: ElementScore[];
  aiObservations: AIObservation[];
  videoEvidence: VideoEvidence[];
  gradebookStatus: GradebookStatus;
  observationHistory: Observation[];
}

interface ElementScore {
  elementId: string;
  elementName: string;
  domain: string;
  numericScore: number;
  color: 'green' | 'yellow' | 'red';
  previousScore: number | null;
  trend: 'up' | 'down' | 'stable';
  lastObserved: string | null;
  observationCount: number;
  evidenceIds: string[];
  aiObservationIds: string[];
  isPinned: boolean;
  problemScore: number; // for top 4 ranking
}

interface AIObservation {
  id: string;
  videoId: string;
  elementId: string;
  elementName: string;
  confidence: number; // 0.0 - 1.0
  scoreEstimate: number;
  timestamp: string;
  startTs: string;
  endTs: string;
  clipUrl: string;
  summary: string;
  status: 'pending' | 'accepted' | 'rejected' | 'edited';
  humanReview: HumanReview | null;
}

interface VideoEvidence {
  id: string;
  clipUrl: string;
  thumbnailUrl: string;
  startTs: string;
  endTs: string;
  duration: number;
  anonymized: boolean;
  uploadedAt: string;
  uploadedBy: string;
}

interface HumanReview {
  reviewerId: string;
  reviewerName: string;
  action: 'accept' | 'reject' | 'edit';
  editedScore?: number;
  notes?: string;
  reviewedAt: string;
}

interface DateRange {
  start: string;
  end: string;
  preset: 'week' | 'month' | 'quarter' | 'year' | 'custom';
}

interface ActionPlan {
  id: string | null;
  goals: ActionGoal[];
  isDirty: boolean;
}

interface ActionGoal {
  id: string;
  elementId: string;
  description: string;
  targetScore: number;
  targetDate: string;
  status: 'pending' | 'in_progress' | 'completed';
}

interface VideoModalState {
  videoId: string;
  clipUrl: string;
  observationId: string | null;
  elementId: string;
  startTime: number;
  notes: Note[];
}
```

#### API Calls
1. **Load Teacher Detail:** `GET /api/teachers/{id}/detail?templateId={id}&start={date}&end={date}`
2. **Override Score:** `POST /api/assessments/{assessmentId}/override`
3. **AI Review:** `POST /api/ai/review`
4. **Pin Element:** `POST /api/users/{userId}/pinned-elements`
5. **Save Action Plan:** `POST /api/teachers/{id}/action-plan`
6. **Get Video Clip:** `GET /api/video/{videoId}/clip?start={ts}&end={ts}`

#### Key Interactions
| Action | Behavior |
|--------|----------|
| Change period selector | Reload data for new date range |
| Toggle view mode | Reorder element display (auto vs priority) |
| Expand domain accordion | Show/hide elements in domain |
| Click evidence link | Open VideoPlayerModal at timestamp |
| Click Accept AI | POST /api/ai/review with action: 'accept' |
| Click Reject AI | POST /api/ai/review with action: 'reject' |
| Edit AI score | Open edit form, POST with edited score |
| Pin element | Add to pinned list, POST preference |
| Override score | Open override form, POST new score |
| Add goal | Add to action plan, show goal form |
| Save action plan | POST action plan to server |

#### Top 4 Problematic Elements Algorithm
```typescript
function calculateProblematicElements(elementScores: ElementScore[]): ElementScore[] {
  return elementScores
    .map(element => {
      const current = element.numericScore;
      const previous = element.previousScore ?? current;
      const delta = previous - current; // positive = regression
      const deficit = (100 - current) * (element.weight || 1);
      const freq = element.observationCount;
      const confidence = element.avgAiConfidence ?? 0;

      // Problem score formula
      const problemScore =
        deficit * 1.2 +           // Current gap from perfect
        delta * 2 +               // Regression penalty
        Math.log(1 + freq) * 5 +  // Frequency factor
        confidence * 0.2;         // AI confidence boost

      return { ...element, problemScore };
    })
    .sort((a, b) => b.problemScore - a.problemScore)
    .slice(0, 4);
}
```

#### Accessibility Requirements
- Charts have text alternatives and data tables
- Video player has keyboard controls
- Timeline navigable via keyboard
- AI confidence badges have descriptive labels
- Modal focus management
- Trend indicators have text descriptions

#### Sample UI Copy
```
Page Title: "{teacherName}'s Dashboard"
Back Button: "← Back to Roster"

Period Selector:
  Options: ["This Week", "This Month", "This Quarter", "This Year", "Custom Range"]

View Mode:
  Auto: "Auto Detail" - "Shows elements ranked by algorithm"
  Priority: "Priority Detail" - "Shows your pinned elements first"

Overall Rating Card:
  Title: "Overall Performance"
  Score: "{score}%"
  Trend: "↑ {delta}% from last period" / "↓ {delta}% from last period"
  Comparison: "{diff}% above school average" / "{diff}% below school average"

Top 4 Card:
  Title: "Areas Needing Attention"
  Empty: "Great job! No critical areas identified."

AI Observation:
  Confidence: "AI Confidence: {pct}%"
  Summary: "{AI-generated summary}"
  Actions: ["Accept", "Edit", "Reject"]

Video Modal:
  Accept Button: "Accept AI Score"
  Reject Button: "Reject Observation"
  Edit Button: "Edit Score"
  Comment Placeholder: "Add notes about this observation..."

Action Plan:
  Title: "Improvement Plan"
  Add Goal: "+ Add Goal"
  Save: "Save Plan"
  Goal Fields: ["Target Element", "Description", "Target Score", "Target Date"]
```

#### Error States
```
Loading: "Loading teacher data..."
Error: "Unable to load teacher dashboard. Please refresh."
Video Error: "Unable to load video. The clip may have been removed."
AI Review Error: "Failed to save review. Please try again."
Save Plan Error: "Failed to save action plan. Please try again."
```

---

## 2. Frontend Component Map

### Core TypeScript Interfaces

```typescript
// ============================================
// CORE DOMAIN TYPES
// ============================================

// User & Authentication
interface User {
  id: string;
  email: string;
  name: string;
  roles: UserRole[];
  activeRole: string;
  schoolId: string;
  schoolName: string;
  preferences: UserPreferences;
  createdAt: string;
}

type UserRole = 'admin' | 'principal' | 'department_head' | 'teacher' | 'observer';

interface UserPreferences {
  defaultTemplateId: string | null;
  pinnedElementIds: string[];
  dashboardLayout: 'compact' | 'expanded';
  colorThresholds: ColorThresholds;
}

interface ColorThresholds {
  greenMin: number;  // default: 80
  yellowMin: number; // default: 60
  // red is below yellowMin
}

// Teacher
interface Teacher {
  id: string;
  name: string;
  email: string;
  schoolId: string;
  subjects: string[];
  grades: string[];
  hireDate: string;
  status: 'active' | 'inactive' | 'on_leave';
  createdAt: string;
  updatedAt: string;
}

// Rubric & Elements
interface RubricTemplate {
  id: string;
  name: string;
  source: 'danielson' | 'marshall' | 'custom';
  version: string;
  description: string;
  aggregationMode: AggregationMode;
  columns: TemplateColumn[];
  domainsCount: number;
  elementsCount: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  isDefault: boolean;
}

interface TemplateColumn {
  id: string;
  index: number;
  name: string;
  weight: number;
  enabled: boolean;
  elementIds: string[];
}

interface Domain {
  id: string;
  templateId: string;
  name: string;
  description: string;
  sortOrder: number;
  elements: Element[];
}

interface Element {
  id: string;
  domainId: string;
  name: string;
  description: string;
  indicators: string[];
  defaultWeight: number;
  sortOrder: number;
}

type AggregationMode = 'weighted' | 'worst' | 'majority';

// Assessment & Scores
interface Assessment {
  id: string;
  teacherId: string;
  templateId: string;
  observerId: string;
  overallScore: number;
  elementScores: AssessmentElementScore[];
  videoEvidenceIds: string[];
  notes: string;
  status: 'draft' | 'completed' | 'reviewed';
  createdAt: string;
  completedAt: string | null;
}

interface AssessmentElementScore {
  elementId: string;
  score: number;
  notes: string;
  evidenceIds: string[];
  isOverridden: boolean;
  overrideReason: string | null;
}

// AI & Video
interface VideoEvidence {
  id: string;
  teacherId: string;
  classId: string | null;
  clipUrl: string;
  thumbnailUrl: string;
  startTs: string;
  endTs: string;
  duration: number;
  anonymized: boolean;
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  uploadedBy: string;
  uploadedAt: string;
}

interface AIObservation {
  id: string;
  videoId: string;
  elementId: string;
  confidence: number;
  scoreEstimate: number;
  startTs: string;
  endTs: string;
  summary: string;
  keyMoments: KeyMoment[];
  status: 'pending' | 'accepted' | 'rejected' | 'edited';
  humanReview: HumanReview | null;
  createdAt: string;
}

interface KeyMoment {
  timestamp: string;
  description: string;
  sentiment: 'positive' | 'negative' | 'neutral';
}

interface HumanReview {
  reviewerId: string;
  reviewerName: string;
  action: 'accept' | 'reject' | 'edit';
  editedScore: number | null;
  notes: string | null;
  reviewedAt: string;
}

// Roster
interface RosterRow {
  teacherId: string;
  teacherName: string;
  email: string;
  subjects: string[];
  grades: string[];
  metrics: MetricCell[];
  gradebookStatus: GradebookStatus;
  lastObserved: string | null;
  overallScore: number;
  overallColor: StatusColor;
}

interface MetricCell {
  columnId: string;
  columnName: string;
  color: StatusColor;
  numericScore: number;
  elementCount: number;
  lastObserved: string | null;
}

type StatusColor = 'green' | 'yellow' | 'red';

interface GradebookStatus {
  isHealthy: boolean;
  missingGrades: boolean;
  classesMissing: string[];
  lastUpdated: string;
}

// ============================================
// COMPONENT DEFINITIONS
// ============================================
```

### Component Hierarchy

```
App
├── AuthProvider
├── ThemeProvider
├── ToastProvider
└── Router
    ├── PublicRoutes
    │   ├── LoginPage
    │   └── ForgotPasswordPage
    └── ProtectedRoutes
        ├── Layout
        │   ├── TopNav
        │   ├── Sidebar (optional)
        │   └── MainContent
        │       ├── Homepage
        │       ├── FrameworkSelection
        │       ├── ElementSelectionPage
        │       ├── RosterPage
        │       └── TeacherDashboard
        └── Modals
            ├── RoleSelectionModal
            ├── PreviewModal
            ├── QuickViewModal
            └── VideoPlayerModal
```

### Component Specifications

#### Shared Components

```typescript
// TopNav
interface TopNavProps {
  user: User;
  onSearch: (query: string) => void;
  onLogout: () => void;
}

// ColorChip
interface ColorChipProps {
  color: StatusColor;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
  tooltipContent?: string;
  onClick?: () => void;
}

// PeriodSelector
interface PeriodSelectorProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  presets?: PresetOption[];
}

interface PresetOption {
  label: string;
  value: DateRange;
}

// DataTable (generic)
interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  sorting?: SortingState;
  onSortingChange?: (sorting: SortingState) => void;
  pagination?: PaginationState;
  onPaginationChange?: (pagination: PaginationState) => void;
  onRowClick?: (row: T) => void;
  loading?: boolean;
  emptyMessage?: string;
}
```

#### Screen-Specific Components

```typescript
// Homepage Components
interface QuickCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  loading?: boolean;
}

interface ActiveRubricCardProps extends QuickCardProps {
  rubricName: string;
  lastEdited: string;
  lastEditedBy: string;
  onEdit: () => void;
}

interface RosterSnapshotCardProps extends QuickCardProps {
  totalTeachers: number;
  greenCount: number;
  yellowCount: number;
  redCount: number;
}

// Login Components
interface AuthFormProps {
  onSubmit: (credentials: LoginCredentials) => Promise<void>;
  loading: boolean;
  error: string | null;
}

interface LoginCredentials {
  email: string;
  password: string;
  rememberMe: boolean;
}

interface SSOButtonProps {
  provider: 'microsoft' | 'google' | 'school';
  onClick: () => void;
  loading?: boolean;
}

interface RoleSelectionModalProps {
  open: boolean;
  roles: UserRole[];
  onSelect: (role: string) => void;
  onClose: () => void;
}

// Framework Selection Components
interface RubricTileProps {
  template: RubricTemplate;
  isSelected: boolean;
  onSelect: () => void;
  onPreview: () => void;
}

interface PreviewModalProps {
  open: boolean;
  template: RubricTemplate | null;
  domains: Domain[];
  onClose: () => void;
}

// Element Selection Components
interface DomainAccordionProps {
  domain: Domain;
  expanded: boolean;
  onToggle: () => void;
  selectedElementIds: string[];
  onElementSelect: (elementId: string) => void;
  onElementDragStart: (element: Element) => void;
}

interface MetricColumnProps {
  column: TemplateColumn;
  elements: Element[];
  onDrop: (elementId: string) => void;
  onRemove: (elementId: string) => void;
  onNameChange: (name: string) => void;
  onWeightChange: (weight: number) => void;
  onToggleEnabled: () => void;
}

interface DraggableElementProps {
  element: Element;
  isAssigned: boolean;
  onDragStart: () => void;
  onSelect: () => void;
}

// Roster Components
interface RosterTableProps {
  rows: RosterRow[];
  columns: TemplateColumn[];
  sorting: SortConfig;
  onSortChange: (sort: SortConfig) => void;
  onRowClick: (teacherId: string) => void;
  onChipClick: (teacherId: string, columnId: string) => void;
  loading: boolean;
}

interface RosterFiltersProps {
  filters: RosterFilters;
  onChange: (filters: RosterFilters) => void;
  subjectOptions: string[];
  gradeOptions: string[];
}

interface QuickViewModalProps {
  open: boolean;
  teacherId: string;
  columnId: string;
  data: QuickViewData | null;
  onClose: () => void;
  onViewDetails: () => void;
  onAddObservation: () => void;
}

interface QuickViewData {
  teacherName: string;
  columnName: string;
  overallScore: number;
  color: StatusColor;
  elements: {
    id: string;
    name: string;
    score: number;
    color: StatusColor;
  }[];
}

// Teacher Dashboard Components
interface TeacherHeaderProps {
  teacher: Teacher;
  overallScore: number;
  overallColor: StatusColor;
  dateRange: DateRange;
  viewMode: 'auto' | 'priority';
  onDateRangeChange: (range: DateRange) => void;
  onViewModeChange: (mode: 'auto' | 'priority') => void;
  onBack: () => void;
}

interface Top4ProblematicCardProps {
  elements: ElementScore[];
  onElementClick: (elementId: string) => void;
}

interface RubricAccordionProps {
  domains: DomainWithScores[];
  expandedDomains: string[];
  onToggleDomain: (domainId: string) => void;
  onElementAction: (elementId: string, action: ElementAction) => void;
  onEvidenceClick: (evidenceId: string) => void;
}

interface DomainWithScores extends Domain {
  averageScore: number;
  color: StatusColor;
  elementScores: ElementScore[];
}

type ElementAction = 'pin' | 'unpin' | 'override' | 'add_observation';

interface AIObservationCardProps {
  observation: AIObservation;
  onAccept: () => void;
  onReject: () => void;
  onEdit: () => void;
  onViewClip: () => void;
}

interface VideoPlayerModalProps {
  open: boolean;
  video: VideoEvidence | null;
  observation: AIObservation | null;
  onClose: () => void;
  onAccept: () => void;
  onReject: () => void;
  onEdit: (score: number, notes: string) => void;
  onAddComment: (comment: string, timestamp: number) => void;
}

interface TrendChartProps {
  data: TrendDataPoint[];
  type: 'line' | 'bar';
  onTypeChange: (type: 'line' | 'bar') => void;
}

interface TrendDataPoint {
  date: string;
  score: number;
  label?: string;
}

interface ActionPlanComposerProps {
  plan: ActionPlan;
  elements: Element[];
  onChange: (plan: ActionPlan) => void;
  onSave: () => void;
  saving: boolean;
}

interface ObservationTimelineProps {
  observations: Observation[];
  filters: TimelineFilters;
  onFilterChange: (filters: TimelineFilters) => void;
  onObservationClick: (observationId: string) => void;
}

interface TimelineFilters {
  type: 'all' | 'human' | 'ai';
  elements: string[];
}
```

### State Management (Zustand/Redux)

```typescript
// Auth Store
interface AuthStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  loginSSO: (provider: string) => Promise<void>;
  selectRole: (role: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
}

// Template Store
interface TemplateStore {
  templates: RubricTemplate[];
  activeTemplate: RubricTemplate | null;
  elements: Map<string, Element[]>;
  loading: boolean;
  fetchTemplates: () => Promise<void>;
  fetchElements: (templateId: string) => Promise<void>;
  selectTemplate: (templateId: string) => Promise<void>;
  saveTemplate: (template: CreateTemplateRequest) => Promise<RubricTemplate>;
}

// Roster Store
interface RosterStore {
  rows: RosterRow[];
  totals: RosterTotals;
  filters: RosterFilters;
  sorting: SortConfig;
  pagination: PaginationState;
  loading: boolean;
  fetchRoster: (params: RosterParams) => Promise<void>;
  setFilters: (filters: Partial<RosterFilters>) => void;
  setSorting: (sorting: SortConfig) => void;
  setPage: (page: number) => void;
}

// Teacher Dashboard Store
interface TeacherDashboardStore {
  teacher: TeacherDetail | null;
  dateRange: DateRange;
  viewMode: 'auto' | 'priority';
  loading: boolean;
  fetchTeacherDetail: (teacherId: string, params: DetailParams) => Promise<void>;
  setDateRange: (range: DateRange) => void;
  setViewMode: (mode: 'auto' | 'priority') => void;
  reviewAIObservation: (observationId: string, action: ReviewAction) => Promise<void>;
  overrideScore: (assessmentId: string, elementId: string, score: number) => Promise<void>;
  saveActionPlan: (plan: ActionPlan) => Promise<void>;
}
```

### Custom Hooks

```typescript
// useAuth - Authentication state and methods
function useAuth(): AuthStore;

// useDashboardSummary - Homepage data
function useDashboardSummary(): {
  summary: DashboardSummary | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
};

// useTemplates - Rubric templates
function useTemplates(): {
  templates: RubricTemplate[];
  loading: boolean;
  error: string | null;
};

// useElements - Elements for a template
function useElements(templateId: string): {
  domains: Domain[];
  elements: Element[];
  loading: boolean;
  error: string | null;
};

// useRoster - Roster data with filters
function useRoster(templateId: string, filters: RosterFilters): {
  rows: RosterRow[];
  totals: RosterTotals;
  loading: boolean;
  error: string | null;
  refetch: () => void;
};

// useTeacherDetail - Teacher dashboard data
function useTeacherDetail(teacherId: string, dateRange: DateRange): {
  teacher: TeacherDetail | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
};

// useAIReview - AI observation review actions
function useAIReview(): {
  reviewObservation: (id: string, action: ReviewAction) => Promise<void>;
  loading: boolean;
  error: string | null;
};

// useDragAndDrop - Element drag and drop
function useDragAndDrop(columns: TemplateColumn[]): {
  draggedElement: Element | null;
  dropTarget: string | null;
  handleDragStart: (element: Element) => void;
  handleDragOver: (columnId: string) => void;
  handleDrop: (columnId: string) => void;
  handleDragEnd: () => void;
};

// useColorMapping - Score to color conversion
function useColorMapping(thresholds?: ColorThresholds): {
  getColor: (score: number) => StatusColor;
  thresholds: ColorThresholds;
};
```

---

## 3. API Contract

### Authentication

#### Base URL
```
Production: https://api.cognivio.com/api
Development: http://localhost:8000/api
```

### Standard Response Format

```typescript
// Success Response
interface ApiResponse<T> {
  success: true;
  data: T;
  meta?: {
    page?: number;
    pageSize?: number;
    totalPages?: number;
    totalItems?: number;
  };
}

// Error Response
interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}
```

### Standard Error Codes

| HTTP Status | Code | Description |
|-------------|------|-------------|
| 400 | `VALIDATION_ERROR` | Request validation failed |
| 401 | `UNAUTHORIZED` | Authentication required |
| 403 | `FORBIDDEN` | Insufficient permissions |
| 404 | `NOT_FOUND` | Resource not found |
| 409 | `CONFLICT` | Resource conflict |
| 422 | `UNPROCESSABLE_ENTITY` | Business logic error |
| 500 | `INTERNAL_ERROR` | Server error |

---

### Authentication Endpoints

#### POST /api/auth/login

Authenticate user with email and password.

**Request:**
```json
{
  "email": "principal@school.edu",
  "password": "securePassword123"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "dGhpcyBpcyBhIHJlZnJlc2ggdG9rZW4...",
    "expiresIn": 86400,
    "user": {
      "id": "usr_abc123",
      "email": "principal@school.edu",
      "name": "Dr. Sarah Anderson",
      "roles": ["principal", "observer"],
      "activeRole": "principal",
      "schoolId": "sch_xyz789",
      "schoolName": "Lincoln High School",
      "defaultRoute": "/dashboard",
      "preferences": {
        "defaultTemplateId": "tpl_danielson_v2",
        "pinnedElementIds": ["elem_1a", "elem_3c"],
        "dashboardLayout": "expanded",
        "colorThresholds": {
          "greenMin": 80,
          "yellowMin": 60
        }
      }
    }
  }
}
```

**Error Response (401):**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid email or password"
  }
}
```

#### POST /api/auth/sso

Initiate SSO authentication flow.

**Request:**
```json
{
  "provider": "microsoft",
  "redirectUrl": "https://app.cognivio.com/auth/callback"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "authUrl": "https://login.microsoftonline.com/...",
    "state": "state_token_for_csrf"
  }
}
```

#### POST /api/auth/role/select

Select active role for users with multiple roles.

**Request:**
```json
{
  "role": "principal"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "activeRole": "principal",
    "defaultRoute": "/dashboard",
    "permissions": ["view_roster", "edit_rubric", "review_ai", "override_scores"]
  }
}
```

#### POST /api/auth/refresh

Refresh access token.

**Request:**
```json
{
  "refreshToken": "dGhpcyBpcyBhIHJlZnJlc2ggdG9rZW4..."
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "token": "new_jwt_token...",
    "expiresIn": 86400
  }
}
```

---

### Dashboard Endpoints

#### GET /api/dashboard/summary

Get homepage dashboard summary data.

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "activeRubricId": "tpl_danielson_v2",
    "activeRubricName": "Danielson v2.1",
    "activeRubricVersion": "v2.1",
    "lastEditedAt": "2026-01-25T14:30:00Z",
    "lastEditedBy": "Dr. Sarah Anderson",
    "totalTeachers": 47,
    "greenTeachers": 28,
    "yellowTeachers": 11,
    "redTeachers": 8,
    "missingGradesCount": 12,
    "recentReports": [
      {
        "id": "rpt_001",
        "title": "Q1 Performance Summary",
        "lastSent": "2026-01-20T09:00:00Z",
        "recipientCount": 47
      },
      {
        "id": "rpt_002",
        "title": "Department Head Review",
        "lastSent": "2026-01-18T15:30:00Z",
        "recipientCount": 5
      }
    ]
  }
}
```

---

### Rubric Templates Endpoints

#### GET /api/rubrics/templates

List available rubric templates.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| source | string | Filter by source: `danielson`, `marshall`, `custom` |
| includeShared | boolean | Include templates shared by other users |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "tpl_danielson_v2",
      "name": "Danielson Framework for Teaching",
      "source": "danielson",
      "version": "v2.1",
      "description": "The Danielson Framework identifies aspects of a teacher's responsibilities.",
      "aggregationMode": "weighted",
      "domainsCount": 4,
      "elementsCount": 22,
      "createdBy": "system",
      "createdAt": "2025-01-01T00:00:00Z",
      "updatedAt": "2026-01-15T00:00:00Z",
      "isDefault": true
    },
    {
      "id": "tpl_marshall_v1",
      "name": "Marshall Teacher Evaluation",
      "source": "marshall",
      "version": "v1.0",
      "description": "Mini-observations and coaching for improved teaching.",
      "aggregationMode": "weighted",
      "domainsCount": 6,
      "elementsCount": 36,
      "createdBy": "system",
      "createdAt": "2025-01-01T00:00:00Z",
      "updatedAt": "2025-06-01T00:00:00Z",
      "isDefault": false
    }
  ]
}
```

#### GET /api/rubrics/elements

Get elements for a specific template, organized by domain.

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| templateId | string | Yes | Template ID |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "templateId": "tpl_danielson_v2",
    "domains": [
      {
        "id": "dom_1",
        "name": "Domain 1: Planning and Preparation",
        "description": "Demonstrating knowledge of content and pedagogy",
        "sortOrder": 1,
        "elements": [
          {
            "id": "elem_1a",
            "name": "1a: Demonstrating Knowledge of Content and Pedagogy",
            "description": "Teacher displays solid knowledge of the important concepts...",
            "indicators": [
              "Knowledge of content and structure of the discipline",
              "Knowledge of prerequisite relationships",
              "Knowledge of content-related pedagogy"
            ],
            "defaultWeight": 1.0,
            "sortOrder": 1
          },
          {
            "id": "elem_1b",
            "name": "1b: Demonstrating Knowledge of Students",
            "description": "Teacher understands the active nature of student learning...",
            "indicators": [
              "Knowledge of child and adolescent development",
              "Knowledge of the learning process",
              "Knowledge of students' interests and cultural heritage"
            ],
            "defaultWeight": 1.0,
            "sortOrder": 2
          }
        ]
      },
      {
        "id": "dom_2",
        "name": "Domain 2: The Classroom Environment",
        "description": "Creating an environment of respect and rapport",
        "sortOrder": 2,
        "elements": []
      }
    ]
  }
}
```

#### POST /api/rubrics/select

Select a template as active for the current user.

**Request:**
```json
{
  "templateId": "tpl_danielson_v2",
  "setAsDefault": true
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "templateId": "tpl_danielson_v2",
    "elementsCount": 22,
    "message": "Template selected successfully"
  }
}
```

#### POST /api/rubrics/templates

Create a new custom template.

**Request:**
```json
{
  "name": "Custom - Literacy Focus",
  "source": "custom",
  "description": "Customized framework focusing on literacy instruction",
  "aggregationMode": "weighted",
  "columns": [
    {
      "name": "Instruction",
      "weight": 1.0,
      "enabled": true,
      "elementIds": ["elem_1a", "elem_1b", "elem_3a"]
    },
    {
      "name": "Engagement",
      "weight": 1.0,
      "enabled": true,
      "elementIds": ["elem_2a", "elem_2b"]
    },
    {
      "name": "Assessment",
      "weight": 0.8,
      "enabled": true,
      "elementIds": ["elem_1f", "elem_3d"]
    },
    {
      "name": "Environment",
      "weight": 0.6,
      "enabled": true,
      "elementIds": ["elem_2c", "elem_2d"]
    }
  ],
  "versionNotes": "Initial version with literacy focus"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "tpl_custom_abc123",
    "name": "Custom - Literacy Focus",
    "version": "v1.0",
    "createdAt": "2026-01-28T10:30:00Z"
  }
}
```

**Error Response (422):**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Template validation failed",
    "details": {
      "columns[2].elementIds": ["Column must have at least one element assigned"]
    }
  }
}
```

#### PUT /api/rubrics/templates/{templateId}

Update an existing template.

**Request:** Same as POST

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "tpl_custom_abc123",
    "version": "v1.1",
    "updatedAt": "2026-01-28T11:00:00Z"
  }
}
```

---

### Roster Endpoints

#### GET /api/roster

Get teacher roster with color-coded metrics.

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| templateId | string | required | Active template ID |
| page | number | 1 | Page number |
| pageSize | number | 25 | Items per page |
| sort | string | name | Sort field |
| order | string | asc | Sort direction |
| search | string | - | Search by teacher name |
| subjects | string[] | - | Filter by subjects |
| grades | string[] | - | Filter by grades |
| status | string[] | - | Filter by color status |
| gradebookIssues | boolean | - | Filter teachers with gradebook issues |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "rows": [
      {
        "teacherId": "tch_001",
        "teacherName": "John Smith",
        "email": "john.smith@school.edu",
        "subjects": ["Math", "Algebra"],
        "grades": ["9", "10"],
        "metrics": [
          {
            "columnId": "col_1",
            "columnName": "Instruction",
            "color": "green",
            "numericScore": 85,
            "elementCount": 3,
            "lastObserved": "2026-01-25T14:00:00Z"
          },
          {
            "columnId": "col_2",
            "columnName": "Engagement",
            "color": "yellow",
            "numericScore": 72,
            "elementCount": 2,
            "lastObserved": "2026-01-25T14:00:00Z"
          },
          {
            "columnId": "col_3",
            "columnName": "Assessment",
            "color": "green",
            "numericScore": 88,
            "elementCount": 2,
            "lastObserved": "2026-01-20T10:00:00Z"
          },
          {
            "columnId": "col_4",
            "columnName": "Environment",
            "color": "red",
            "numericScore": 55,
            "elementCount": 2,
            "lastObserved": "2026-01-15T09:00:00Z"
          }
        ],
        "gradebookStatus": {
          "isHealthy": false,
          "missingGrades": true,
          "classesMissing": ["Algebra 101", "Math 201"],
          "lastUpdated": "2026-01-27T08:00:00Z"
        },
        "lastObserved": "2026-01-25T14:00:00Z",
        "overallScore": 75,
        "overallColor": "yellow"
      }
    ],
    "totals": {
      "total": 47,
      "green": 28,
      "yellow": 11,
      "red": 8,
      "missingGradebook": 12
    }
  },
  "meta": {
    "page": 1,
    "pageSize": 25,
    "totalPages": 2,
    "totalItems": 47
  }
}
```

---

### Teacher Detail Endpoints

#### GET /api/teachers/{teacherId}/detail

Get comprehensive teacher dashboard data.

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| templateId | string | Yes | Active template ID |
| start | string | Yes | Start date (ISO 8601) |
| end | string | Yes | End date (ISO 8601) |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "teacher": {
      "id": "tch_001",
      "name": "John Smith",
      "email": "john.smith@school.edu",
      "subjects": ["Math", "Algebra"],
      "grades": ["9", "10"],
      "hireDate": "2020-08-15",
      "status": "active"
    },
    "overallScore": 75,
    "overallColor": "yellow",
    "previousPeriodScore": 72,
    "schoolAverage": 78,
    "elementScores": [
      {
        "elementId": "elem_1a",
        "elementName": "1a: Demonstrating Knowledge of Content",
        "domain": "Planning and Preparation",
        "numericScore": 82,
        "color": "green",
        "previousScore": 78,
        "trend": "up",
        "lastObserved": "2026-01-25T14:00:00Z",
        "observationCount": 5,
        "evidenceIds": ["vid_001", "vid_003"],
        "aiObservationIds": ["ai_001", "ai_002"],
        "isPinned": false,
        "problemScore": 12.5
      },
      {
        "elementId": "elem_2c",
        "elementName": "2c: Managing Classroom Procedures",
        "domain": "Classroom Environment",
        "numericScore": 55,
        "color": "red",
        "previousScore": 62,
        "trend": "down",
        "lastObserved": "2026-01-20T10:00:00Z",
        "observationCount": 4,
        "evidenceIds": ["vid_002"],
        "aiObservationIds": ["ai_003"],
        "isPinned": true,
        "problemScore": 85.3
      }
    ],
    "aiObservations": [
      {
        "id": "ai_001",
        "videoId": "vid_001",
        "elementId": "elem_1a",
        "confidence": 0.87,
        "scoreEstimate": 85,
        "timestamp": "2026-01-25T14:15:00Z",
        "startTs": "2026-01-25T14:12:30Z",
        "endTs": "2026-01-25T14:18:45Z",
        "clipUrl": "https://cdn.cognivio.com/clips/vid_001_clip_1.mp4",
        "summary": "Teacher demonstrates strong content knowledge by accurately explaining quadratic formula derivation and connecting to real-world applications.",
        "keyMoments": [
          {
            "timestamp": "2026-01-25T14:14:20Z",
            "description": "Clear explanation of discriminant",
            "sentiment": "positive"
          }
        ],
        "status": "pending",
        "humanReview": null,
        "createdAt": "2026-01-25T15:00:00Z"
      }
    ],
    "videoEvidence": [
      {
        "id": "vid_001",
        "clipUrl": "https://cdn.cognivio.com/videos/vid_001.mp4",
        "thumbnailUrl": "https://cdn.cognivio.com/thumbs/vid_001.jpg",
        "startTs": "2026-01-25T14:00:00Z",
        "endTs": "2026-01-25T14:45:00Z",
        "duration": 2700,
        "anonymized": false,
        "uploadedAt": "2026-01-25T15:00:00Z",
        "uploadedBy": "Principal Anderson"
      }
    ],
    "gradebookStatus": {
      "isHealthy": false,
      "missingGrades": true,
      "classesMissing": ["Algebra 101", "Math 201"],
      "lastUpdated": "2026-01-27T08:00:00Z"
    },
    "observationHistory": [
      {
        "id": "obs_001",
        "type": "human",
        "observerId": "usr_principal",
        "observerName": "Dr. Sarah Anderson",
        "date": "2026-01-25T14:00:00Z",
        "elementsObserved": ["elem_1a", "elem_2a", "elem_3a"],
        "summary": "Full classroom observation - Algebra 101",
        "evidenceId": "vid_001"
      },
      {
        "id": "obs_002",
        "type": "ai",
        "date": "2026-01-25T15:00:00Z",
        "elementsObserved": ["elem_1a", "elem_2c"],
        "summary": "AI analysis of classroom video",
        "evidenceId": "vid_001"
      }
    ]
  }
}
```

---

### Assessment Endpoints

#### POST /api/assessments/{assessmentId}/override

Override an element score (principal only).

**Request:**
```json
{
  "elementId": "elem_2c",
  "newScore": 65,
  "reason": "Observed improvement in follow-up visit not captured in AI analysis"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "assessmentId": "asmt_001",
    "elementId": "elem_2c",
    "previousScore": 55,
    "newScore": 65,
    "overriddenAt": "2026-01-28T10:00:00Z",
    "overriddenBy": "Dr. Sarah Anderson"
  }
}
```

---

### AI Review Endpoints

#### POST /api/ai/review

Review an AI observation (accept, reject, or edit).

**Request:**
```json
{
  "observationId": "ai_001",
  "action": "edit",
  "edits": {
    "score": 80,
    "notes": "Score adjusted - missed key teaching moment at 14:16"
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "observationId": "ai_001",
    "status": "edited",
    "reviewedAt": "2026-01-28T10:30:00Z",
    "reviewedBy": "Dr. Sarah Anderson",
    "auditLogId": "audit_123"
  }
}
```

---

### Video Endpoints

#### POST /api/video/upload

Upload a video for AI analysis.

**Request (multipart/form-data):**
```
teacherId: tch_001
classId: class_algebra101
file: [binary video data]
anonymize: false
```

**Response (202):**
```json
{
  "success": true,
  "data": {
    "videoId": "vid_002",
    "status": "processing",
    "estimatedCompletion": "2026-01-28T11:00:00Z",
    "uploadedAt": "2026-01-28T10:45:00Z"
  }
}
```

#### GET /api/video/{videoId}/status

Check video processing status.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "videoId": "vid_002",
    "status": "completed",
    "clipUrl": "https://cdn.cognivio.com/videos/vid_002.mp4",
    "aiObservationCount": 5,
    "completedAt": "2026-01-28T11:05:00Z"
  }
}
```

---

### Gradebook Endpoints

#### GET /api/gradebook/status

Get gradebook status for multiple teachers.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| teacherIds | string[] | Comma-separated teacher IDs |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "teacherId": "tch_001",
      "isHealthy": false,
      "missingGrades": true,
      "classesMissing": ["Algebra 101", "Math 201"],
      "lastUpdated": "2026-01-27T08:00:00Z"
    },
    {
      "teacherId": "tch_002",
      "isHealthy": true,
      "missingGrades": false,
      "classesMissing": [],
      "lastUpdated": "2026-01-28T08:00:00Z"
    }
  ]
}
```

---

### User Preferences Endpoints

#### PUT /api/users/{userId}/preferences

Update user preferences.

**Request:**
```json
{
  "defaultTemplateId": "tpl_custom_abc123",
  "pinnedElementIds": ["elem_1a", "elem_2c", "elem_3a"],
  "dashboardLayout": "compact",
  "colorThresholds": {
    "greenMin": 85,
    "yellowMin": 65
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "updatedAt": "2026-01-28T10:00:00Z"
  }
}
```

---

### Settings Endpoints

#### PUT /api/settings/thresholds

Update color thresholds (admin only).

**Request:**
```json
{
  "greenMin": 80,
  "yellowMin": 60
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "greenMin": 80,
    "yellowMin": 60,
    "updatedAt": "2026-01-28T10:00:00Z",
    "updatedBy": "Dr. Sarah Anderson"
  }
}
```

---

### Audit Log Endpoints

#### GET /api/audit

Get audit log entries.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| targetType | string | Filter by type: `teacher`, `assessment`, `template` |
| targetId | string | Filter by target ID |
| action | string | Filter by action type |
| startDate | string | Start date filter |
| endDate | string | End date filter |
| page | number | Page number |
| pageSize | number | Items per page |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "audit_123",
      "userId": "usr_principal",
      "userName": "Dr. Sarah Anderson",
      "action": "ai_review_edit",
      "targetType": "ai_observation",
      "targetId": "ai_001",
      "details": {
        "previousScore": 85,
        "newScore": 80,
        "notes": "Score adjusted"
      },
      "timestamp": "2026-01-28T10:30:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 50,
    "totalItems": 156
  }
}
```

---

## 4. Database Schema

### PostgreSQL DDL

```sql
-- ============================================
-- EXTENSIONS
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- ENUMS
-- ============================================
CREATE TYPE user_role AS ENUM ('admin', 'principal', 'department_head', 'teacher', 'observer');
CREATE TYPE template_source AS ENUM ('danielson', 'marshall', 'custom');
CREATE TYPE aggregation_mode AS ENUM ('weighted', 'worst', 'majority');
CREATE TYPE status_color AS ENUM ('green', 'yellow', 'red');
CREATE TYPE video_status AS ENUM ('pending', 'processing', 'completed', 'failed');
CREATE TYPE ai_observation_status AS ENUM ('pending', 'accepted', 'rejected', 'edited');
CREATE TYPE review_action AS ENUM ('accept', 'reject', 'edit');
CREATE TYPE assessment_status AS ENUM ('draft', 'completed', 'reviewed');
CREATE TYPE teacher_status AS ENUM ('active', 'inactive', 'on_leave');
CREATE TYPE trend_direction AS ENUM ('up', 'down', 'stable');

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255), -- NULL for SSO-only users
    name VARCHAR(255) NOT NULL,
    roles user_role[] NOT NULL DEFAULT '{teacher}',
    active_role user_role,
    school_id UUID NOT NULL,
    avatar_url VARCHAR(500),
    sso_provider VARCHAR(50), -- 'microsoft', 'google', 'school'
    sso_id VARCHAR(255),
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT users_sso_unique UNIQUE (sso_provider, sso_id)
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_school ON users(school_id);

-- ============================================
-- USER PREFERENCES TABLE
-- ============================================
CREATE TABLE user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    default_template_id UUID,
    pinned_element_ids UUID[] DEFAULT '{}',
    dashboard_layout VARCHAR(20) DEFAULT 'expanded',
    color_threshold_green INT DEFAULT 80,
    color_threshold_yellow INT DEFAULT 60,
    notification_settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT user_preferences_user_unique UNIQUE (user_id)
);

-- ============================================
-- SCHOOLS TABLE
-- ============================================
CREATE TABLE schools (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    district_id UUID,
    address JSONB,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TEACHERS TABLE
-- ============================================
CREATE TABLE teachers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id), -- Optional link to user account
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    school_id UUID NOT NULL REFERENCES schools(id),
    subjects TEXT[] DEFAULT '{}',
    grades TEXT[] DEFAULT '{}',
    department VARCHAR(100),
    hire_date DATE,
    status teacher_status DEFAULT 'active',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_teachers_school ON teachers(school_id);
CREATE INDEX idx_teachers_status ON teachers(status);
CREATE INDEX idx_teachers_name ON teachers(name);

-- ============================================
-- RUBRIC TEMPLATES TABLE
-- ============================================
CREATE TABLE rubric_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    source template_source NOT NULL,
    version VARCHAR(50) DEFAULT 'v1.0',
    description TEXT,
    aggregation_mode aggregation_mode DEFAULT 'weighted',
    school_id UUID REFERENCES schools(id), -- NULL for system templates
    created_by UUID REFERENCES users(id),
    is_system_template BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    config JSONB DEFAULT '{}', -- Additional configuration
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_rubric_templates_school ON rubric_templates(school_id);
CREATE INDEX idx_rubric_templates_source ON rubric_templates(source);

-- ============================================
-- RUBRIC DOMAINS TABLE
-- ============================================
CREATE TABLE rubric_domains (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID NOT NULL REFERENCES rubric_templates(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_rubric_domains_template ON rubric_domains(template_id);

-- ============================================
-- RUBRIC ELEMENTS TABLE
-- ============================================
CREATE TABLE rubric_elements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    domain_id UUID NOT NULL REFERENCES rubric_domains(id) ON DELETE CASCADE,
    template_id UUID NOT NULL REFERENCES rubric_templates(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    indicators TEXT[] DEFAULT '{}',
    default_weight NUMERIC(3,2) DEFAULT 1.0,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_rubric_elements_domain ON rubric_elements(domain_id);
CREATE INDEX idx_rubric_elements_template ON rubric_elements(template_id);

-- ============================================
-- TEMPLATE COLUMNS TABLE
-- ============================================
CREATE TABLE template_columns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID NOT NULL REFERENCES rubric_templates(id) ON DELETE CASCADE,
    column_index INT NOT NULL CHECK (column_index >= 0 AND column_index <= 3),
    name VARCHAR(100) NOT NULL,
    weight NUMERIC(3,2) DEFAULT 1.0,
    enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT template_columns_unique UNIQUE (template_id, column_index)
);

-- ============================================
-- TEMPLATE COLUMN ASSIGNMENTS TABLE
-- ============================================
CREATE TABLE template_column_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    column_id UUID NOT NULL REFERENCES template_columns(id) ON DELETE CASCADE,
    element_id UUID NOT NULL REFERENCES rubric_elements(id) ON DELETE CASCADE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT template_column_assignments_unique UNIQUE (column_id, element_id)
);

CREATE INDEX idx_column_assignments_column ON template_column_assignments(column_id);
CREATE INDEX idx_column_assignments_element ON template_column_assignments(element_id);

-- ============================================
-- ASSESSMENTS TABLE
-- ============================================
CREATE TABLE assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    template_id UUID NOT NULL REFERENCES rubric_templates(id),
    observer_id UUID REFERENCES users(id),
    overall_score NUMERIC(5,2),
    status assessment_status DEFAULT 'draft',
    notes TEXT,
    observation_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_assessments_teacher ON assessments(teacher_id);
CREATE INDEX idx_assessments_template ON assessments(template_id);
CREATE INDEX idx_assessments_date ON assessments(observation_date);
CREATE INDEX idx_assessments_status ON assessments(status);

-- ============================================
-- ASSESSMENT ELEMENTS TABLE
-- ============================================
CREATE TABLE assessment_elements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    element_id UUID NOT NULL REFERENCES rubric_elements(id),
    score NUMERIC(5,2) NOT NULL CHECK (score >= 0 AND score <= 100),
    notes TEXT,
    evidence_ids UUID[] DEFAULT '{}',
    is_overridden BOOLEAN DEFAULT FALSE,
    override_reason TEXT,
    overridden_by UUID REFERENCES users(id),
    overridden_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT assessment_elements_unique UNIQUE (assessment_id, element_id)
);

CREATE INDEX idx_assessment_elements_assessment ON assessment_elements(assessment_id);
CREATE INDEX idx_assessment_elements_element ON assessment_elements(element_id);

-- ============================================
-- VIDEO EVIDENCE TABLE
-- ============================================
CREATE TABLE video_evidence (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    class_id VARCHAR(100),
    original_filename VARCHAR(255),
    clip_url VARCHAR(500),
    thumbnail_url VARCHAR(500),
    storage_path VARCHAR(500),
    start_ts TIMESTAMPTZ,
    end_ts TIMESTAMPTZ,
    duration_seconds INT,
    file_size_bytes BIGINT,
    mime_type VARCHAR(100),
    anonymized BOOLEAN DEFAULT FALSE,
    processing_status video_status DEFAULT 'pending',
    processing_error TEXT,
    uploaded_by UUID REFERENCES users(id),
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_video_evidence_teacher ON video_evidence(teacher_id);
CREATE INDEX idx_video_evidence_status ON video_evidence(processing_status);
CREATE INDEX idx_video_evidence_uploaded ON video_evidence(uploaded_at);

-- ============================================
-- AI OBSERVATIONS TABLE
-- ============================================
CREATE TABLE ai_observations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id UUID NOT NULL REFERENCES video_evidence(id) ON DELETE CASCADE,
    element_id UUID NOT NULL REFERENCES rubric_elements(id),
    confidence NUMERIC(3,2) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    score_estimate NUMERIC(5,2) CHECK (score_estimate >= 0 AND score_estimate <= 100),
    start_ts TIMESTAMPTZ,
    end_ts TIMESTAMPTZ,
    summary TEXT,
    key_moments JSONB DEFAULT '[]',
    status ai_observation_status DEFAULT 'pending',
    model_version VARCHAR(50),
    raw_response JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ai_observations_video ON ai_observations(video_id);
CREATE INDEX idx_ai_observations_element ON ai_observations(element_id);
CREATE INDEX idx_ai_observations_status ON ai_observations(status);

-- ============================================
-- AI OBSERVATION REVIEWS TABLE
-- ============================================
CREATE TABLE ai_observation_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    observation_id UUID NOT NULL REFERENCES ai_observations(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES users(id),
    action review_action NOT NULL,
    edited_score NUMERIC(5,2),
    notes TEXT,
    reviewed_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT ai_observation_reviews_unique UNIQUE (observation_id)
);

CREATE INDEX idx_ai_reviews_observation ON ai_observation_reviews(observation_id);
CREATE INDEX idx_ai_reviews_reviewer ON ai_observation_reviews(reviewer_id);

-- ============================================
-- GRADEBOOK STATUS TABLE
-- ============================================
CREATE TABLE gradebook_status (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    is_healthy BOOLEAN DEFAULT TRUE,
    missing_grades BOOLEAN DEFAULT FALSE,
    classes_missing TEXT[] DEFAULT '{}',
    total_students INT,
    graded_students INT,
    last_grade_entry TIMESTAMPTZ,
    sync_source VARCHAR(100), -- 'powerschool', 'canvas', etc.
    last_synced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT gradebook_status_teacher_unique UNIQUE (teacher_id)
);

CREATE INDEX idx_gradebook_teacher ON gradebook_status(teacher_id);
CREATE INDEX idx_gradebook_health ON gradebook_status(is_healthy);

-- ============================================
-- ACTION PLANS TABLE
-- ============================================
CREATE TABLE action_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id),
    status VARCHAR(50) DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE action_plan_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_id UUID NOT NULL REFERENCES action_plans(id) ON DELETE CASCADE,
    element_id UUID REFERENCES rubric_elements(id),
    description TEXT NOT NULL,
    target_score NUMERIC(5,2),
    target_date DATE,
    status VARCHAR(50) DEFAULT 'pending',
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- AUDIT LOG TABLE
-- ============================================
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    user_name VARCHAR(255),
    action VARCHAR(100) NOT NULL,
    target_type VARCHAR(50) NOT NULL,
    target_id UUID,
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_log_user ON audit_log(user_id);
CREATE INDEX idx_audit_log_target ON audit_log(target_type, target_id);
CREATE INDEX idx_audit_log_action ON audit_log(action);
CREATE INDEX idx_audit_log_created ON audit_log(created_at);

-- ============================================
-- REFRESH TOKENS TABLE
-- ============================================
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    revoked_at TIMESTAMPTZ
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_expires ON refresh_tokens(expires_at);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teachers_updated_at BEFORE UPDATE ON teachers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rubric_templates_updated_at BEFORE UPDATE ON rubric_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assessments_updated_at BEFORE UPDATE ON assessments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gradebook_status_updated_at BEFORE UPDATE ON gradebook_status
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Sample Data Records

#### Users
```json
{
  "id": "usr_abc123",
  "email": "principal@lincoln.edu",
  "name": "Dr. Sarah Anderson",
  "roles": ["principal", "observer"],
  "active_role": "principal",
  "school_id": "sch_xyz789",
  "created_at": "2025-08-15T00:00:00Z"
}
```

#### Teachers
```json
{
  "id": "tch_001",
  "name": "John Smith",
  "email": "john.smith@lincoln.edu",
  "school_id": "sch_xyz789",
  "subjects": ["Math", "Algebra"],
  "grades": ["9", "10"],
  "department": "Mathematics",
  "hire_date": "2020-08-15",
  "status": "active"
}
```

#### Rubric Templates
```json
{
  "id": "tpl_danielson_v2",
  "name": "Danielson Framework for Teaching",
  "source": "danielson",
  "version": "v2.1",
  "description": "The Danielson Framework identifies aspects of teacher responsibilities.",
  "aggregation_mode": "weighted",
  "is_system_template": true,
  "created_at": "2025-01-01T00:00:00Z"
}
```

#### Rubric Elements
```json
{
  "id": "elem_1a",
  "domain_id": "dom_1",
  "template_id": "tpl_danielson_v2",
  "name": "1a: Demonstrating Knowledge of Content and Pedagogy",
  "description": "Teacher displays solid knowledge of the important concepts in the discipline.",
  "indicators": [
    "Knowledge of content and structure of the discipline",
    "Knowledge of prerequisite relationships",
    "Knowledge of content-related pedagogy"
  ],
  "default_weight": 1.0,
  "sort_order": 1
}
```

#### Assessments
```json
{
  "id": "asmt_001",
  "teacher_id": "tch_001",
  "template_id": "tpl_danielson_v2",
  "observer_id": "usr_abc123",
  "overall_score": 75.5,
  "status": "completed",
  "observation_date": "2026-01-25T14:00:00Z",
  "completed_at": "2026-01-25T15:30:00Z"
}
```

#### Assessment Elements
```json
{
  "id": "ae_001",
  "assessment_id": "asmt_001",
  "element_id": "elem_1a",
  "score": 82,
  "notes": "Strong content knowledge demonstrated during math lesson.",
  "evidence_ids": ["vid_001"],
  "is_overridden": false
}
```

#### Video Evidence
```json
{
  "id": "vid_001",
  "teacher_id": "tch_001",
  "class_id": "algebra_101",
  "clip_url": "https://cdn.cognivio.com/videos/vid_001.mp4",
  "thumbnail_url": "https://cdn.cognivio.com/thumbs/vid_001.jpg",
  "start_ts": "2026-01-25T14:00:00Z",
  "end_ts": "2026-01-25T14:45:00Z",
  "duration_seconds": 2700,
  "anonymized": false,
  "processing_status": "completed",
  "uploaded_by": "usr_abc123",
  "uploaded_at": "2026-01-25T15:00:00Z"
}
```

#### AI Observations
```json
{
  "id": "ai_001",
  "video_id": "vid_001",
  "element_id": "elem_1a",
  "confidence": 0.87,
  "score_estimate": 85,
  "start_ts": "2026-01-25T14:12:30Z",
  "end_ts": "2026-01-25T14:18:45Z",
  "summary": "Teacher demonstrates strong content knowledge by accurately explaining quadratic formula.",
  "key_moments": [
    {
      "timestamp": "2026-01-25T14:14:20Z",
      "description": "Clear explanation of discriminant",
      "sentiment": "positive"
    }
  ],
  "status": "pending",
  "model_version": "gpt-5.2-vision"
}
```

#### Gradebook Status
```json
{
  "id": "gb_001",
  "teacher_id": "tch_001",
  "is_healthy": false,
  "missing_grades": true,
  "classes_missing": ["Algebra 101", "Math 201"],
  "total_students": 120,
  "graded_students": 95,
  "last_grade_entry": "2026-01-20T10:00:00Z",
  "sync_source": "powerschool",
  "last_synced_at": "2026-01-27T08:00:00Z"
}
```

---

## 5. Client-Server Interaction Flows

### Flow 1: Login → Homepage

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Browser   │    │   Client    │    │   Server    │    │  Database   │
└──────┬──────┘    └──────┬──────┘    └──────┬──────┘    └──────┬──────┘
       │                  │                  │                  │
       │ Submit Login Form│                  │                  │
       │─────────────────>│                  │                  │
       │                  │                  │                  │
       │                  │ POST /api/auth/login               │
       │                  │─────────────────>│                  │
       │                  │                  │                  │
       │                  │                  │ SELECT user      │
       │                  │                  │─────────────────>│
       │                  │                  │                  │
       │                  │                  │ user record      │
       │                  │                  │<─────────────────│
       │                  │                  │                  │
       │                  │                  │ Verify password  │
       │                  │                  │ Generate JWT     │
       │                  │                  │                  │
       │                  │ {token, user}    │                  │
       │                  │<─────────────────│                  │
       │                  │                  │                  │
       │                  │ Store token in   │                  │
       │                  │ localStorage     │                  │
       │                  │                  │                  │
       │                  │ GET /api/dashboard/summary         │
       │                  │─────────────────>│                  │
       │                  │                  │                  │
       │                  │                  │ Aggregate data   │
       │                  │                  │─────────────────>│
       │                  │                  │                  │
       │                  │                  │ summary data     │
       │                  │                  │<─────────────────│
       │                  │                  │                  │
       │                  │ {summary}        │                  │
       │                  │<─────────────────│                  │
       │                  │                  │                  │
       │ Render Homepage  │                  │                  │
       │<─────────────────│                  │                  │
       │                  │                  │                  │
```

**Sequence Steps:**
1. User submits email/password on LoginPage
2. Client sends `POST /api/auth/login` with credentials
3. Server validates credentials against `users` table
4. Server generates JWT token and returns with user data
5. Client stores token in localStorage/sessionStorage
6. Client checks if user has multiple roles
   - If yes: Show RoleSelectionModal
   - If no: Continue to step 7
7. Client fetches `GET /api/dashboard/summary` with Bearer token
8. Server aggregates data from multiple tables
9. Client renders Homepage with summary data
10. Client redirects to `user.defaultRoute`

---

### Flow 2: Select Framework → Element Selection → Save Template → Roster

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Client    │    │   Server    │    │  Database   │
└──────┬──────┘    └──────┬──────┘    └──────┬──────┘
       │                  │                  │
       │ GET /api/rubrics/templates         │
       │─────────────────>│                  │
       │                  │                  │
       │                  │ SELECT templates │
       │                  │─────────────────>│
       │                  │                  │
       │ {templates[]}    │                  │
       │<─────────────────│                  │
       │                  │                  │
       │ User clicks "Select Danielson"     │
       │                  │                  │
       │ POST /api/rubrics/select           │
       │─────────────────>│                  │
       │                  │                  │
       │                  │ UPDATE user_prefs│
       │                  │─────────────────>│
       │                  │                  │
       │ {success}        │                  │
       │<─────────────────│                  │
       │                  │                  │
       │ Navigate to ElementSelectionPage   │
       │                  │                  │
       │ GET /api/rubrics/elements?templateId=...
       │─────────────────>│                  │
       │                  │                  │
       │                  │ SELECT domains,  │
       │                  │ elements         │
       │                  │─────────────────>│
       │                  │                  │
       │ {domains, elements}                 │
       │<─────────────────│                  │
       │                  │                  │
       │ User drags elements to columns     │
       │ User configures column names/weights│
       │                  │                  │
       │ POST /api/rubrics/templates        │
       │─────────────────>│                  │
       │                  │                  │
       │                  │ BEGIN TRANSACTION│
       │                  │ INSERT template  │
       │                  │ INSERT columns   │
       │                  │ INSERT assignments│
       │                  │ COMMIT           │
       │                  │─────────────────>│
       │                  │                  │
       │ {templateId, version}              │
       │<─────────────────│                  │
       │                  │                  │
       │ Navigate to RosterPage             │
       │                  │                  │
       │ GET /api/roster?templateId=...     │
       │─────────────────>│                  │
       │                  │                  │
       │                  │ Complex query:   │
       │                  │ - teachers       │
       │                  │ - assessments    │
       │                  │ - elements       │
       │                  │ - gradebook      │
       │                  │─────────────────>│
       │                  │                  │
       │ {rows[], totals} │                  │
       │<─────────────────│                  │
       │                  │                  │
```

**Sequence Steps:**
1. User lands on FrameworkSelection page
2. Client fetches available templates
3. User clicks "Select" on a framework (e.g., Danielson)
4. Client posts selection to save user preference
5. Navigate to ElementSelectionPage with templateId
6. Client fetches elements organized by domain
7. User drags elements into metric columns (up to 4)
8. User configures column names and weights
9. User clicks "Save Template"
10. Client validates: all enabled columns have elements
11. Client posts template configuration
12. Server creates template, columns, and assignments in transaction
13. Navigate to RosterPage with new templateId
14. Client fetches roster data with aggregated scores

---

### Flow 3: Click Teacher → Load Teacher Dashboard

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Client    │    │   Server    │    │  Database   │
└──────┬──────┘    └──────┬──────┘    └──────┬──────┘
       │                  │                  │
       │ User clicks teacher row on Roster  │
       │                  │                  │
       │ Navigate to /teachers/{id}/dashboard│
       │                  │                  │
       │ GET /api/teachers/{id}/detail      │
       │     ?templateId=...                │
       │     &start=2026-01-01              │
       │     &end=2026-01-31                │
       │─────────────────>│                  │
       │                  │                  │
       │                  │ SELECT teacher   │
       │                  │─────────────────>│
       │                  │                  │
       │                  │ SELECT assessments│
       │                  │ for date range   │
       │                  │─────────────────>│
       │                  │                  │
       │                  │ SELECT elements  │
       │                  │ with scores      │
       │                  │─────────────────>│
       │                  │                  │
       │                  │ SELECT ai_obs    │
       │                  │ for videos       │
       │                  │─────────────────>│
       │                  │                  │
       │                  │ SELECT videos    │
       │                  │─────────────────>│
       │                  │                  │
       │                  │ SELECT gradebook │
       │                  │─────────────────>│
       │                  │                  │
       │                  │ Calculate:       │
       │                  │ - overall score  │
       │                  │ - trends         │
       │                  │ - top 4 problems │
       │                  │                  │
       │ {teacher, scores, ai, videos, ...} │
       │<─────────────────│                  │
       │                  │                  │
       │ Render Dashboard │                  │
       │ - Summary cards  │                  │
       │ - Element table  │                  │
       │ - AI insights    │                  │
       │ - Timeline       │                  │
       │                  │                  │
```

**Sequence Steps:**
1. User clicks teacher name/row on Roster
2. Navigate to TeacherDashboard with teacherId in URL
3. Client fetches comprehensive teacher detail with date range
4. Server performs multiple queries:
   - Teacher basic info
   - Assessments in date range
   - Element scores with historical comparison
   - AI observations with status
   - Video evidence links
   - Gradebook status
5. Server calculates derived values:
   - Overall weighted score
   - Trend direction per element
   - Top 4 problematic elements using algorithm
   - Previous period comparison
6. Client renders multi-panel dashboard

---

### Flow 4: Period Change on Teacher Dashboard

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Client    │    │   Server    │    │  Database   │
└──────┬──────┘    └──────┬──────┘    └──────┬──────┘
       │                  │                  │
       │ User selects "This Quarter"        │
       │                  │                  │
       │ Update dateRange state             │
       │                  │                  │
       │ GET /api/teachers/{id}/detail      │
       │     ?templateId=...                │
       │     &start=2025-10-01              │
       │     &end=2025-12-31                │
       │─────────────────>│                  │
       │                  │                  │
       │                  │ Re-query all data│
       │                  │ for new range   │
       │                  │─────────────────>│
       │                  │                  │
       │ {updated detail} │                  │
       │<─────────────────│                  │
       │                  │                  │
       │ Re-render with   │                  │
       │ new period data  │                  │
       │                  │                  │
```

---

### Flow 5: AI Video Analysis Refresh

```
┌─────────────┐    ┌─────────────┐    ┌───────────────┐    ┌─────────────┐
│   Client    │    │   Server    │    │  AI Worker    │    │  Database   │
└──────┬──────┘    └──────┬──────┘    └───────┬───────┘    └──────┬──────┘
       │                  │                   │                   │
       │ POST /api/video/upload              │                   │
       │ (multipart with video file)         │                   │
       │─────────────────>│                   │                   │
       │                  │                   │                   │
       │                  │ Store video file │                   │
       │                  │ INSERT video_evidence                │
       │                  │──────────────────────────────────────>│
       │                  │                   │                   │
       │                  │ Enqueue job       │                   │
       │                  │──────────────────>│                   │
       │                  │                   │                   │
       │ {videoId, status: processing}       │                   │
       │<─────────────────│                   │                   │
       │                  │                   │                   │
       │                  │                   │ Extract frames    │
       │                  │                   │                   │
       │                  │                   │ Send to GPT-5.2   │
       │                  │                   │ vision model      │
       │                  │                   │                   │
       │                  │                   │ Parse response    │
       │                  │                   │                   │
       │                  │                   │ INSERT ai_obs     │
       │                  │                   │──────────────────>│
       │                  │                   │                   │
       │                  │                   │ UPDATE video      │
       │                  │                   │ status=completed  │
       │                  │                   │──────────────────>│
       │                  │                   │                   │
       │ (polling or websocket)              │                   │
       │                  │                   │                   │
       │ GET /api/video/{id}/status          │                   │
       │─────────────────>│                   │                   │
       │                  │                   │                   │
       │ {status: completed, aiCount: 5}     │                   │
       │<─────────────────│                   │                   │
       │                  │                   │                   │
       │ Refresh teacher dashboard           │                   │
       │                  │                   │                   │
```

**Sequence Steps:**
1. Principal uploads video on TeacherDashboard
2. Server stores video, creates record, returns videoId
3. Server enqueues background processing job
4. Client receives immediate response with "processing" status
5. AI Worker (background):
   a. Downloads video from storage
   b. Extracts key frames (e.g., 5-10 frames)
   c. Converts frames to base64
   d. Sends to GPT-5.2 vision model with rubric context
   e. Parses structured JSON response
   f. Creates ai_observations records
   g. Updates video status to "completed"
6. Client polls video status (or receives websocket update)
7. On completion, client refreshes dashboard to show new AI observations

---

## 6. AI Video Analysis Integration Spec

### Overview

The AI video analysis system uses GPT-5.2 vision model to automatically analyze classroom videos and generate observations mapped to rubric elements.

### Input Formats

#### Video Upload Request
```typescript
interface VideoUploadRequest {
  teacherId: string;
  classId?: string;
  file: File; // MP4, MOV, AVI, MKV, WebM
  anonymize?: boolean; // Apply face anonymization
  metadata?: {
    subject?: string;
    gradeLevel?: string;
    lessonTopic?: string;
    recordingDate?: string;
  };
}
```

#### Video Requirements
- **Formats:** MP4, MOV, AVI, MKV, WebM
- **Max Size:** 2GB
- **Max Duration:** 90 minutes
- **Min Resolution:** 720p
- **Audio:** Optional but recommended

### Processing Pipeline

```typescript
// Pseudocode for video processing pipeline
async function processVideo(videoId: string): Promise<void> {
  const video = await db.videoEvidence.findById(videoId);

  try {
    // 1. Download video from storage
    const videoPath = await storage.download(video.storagePath);

    // 2. Extract key frames
    const frames = await extractFrames(videoPath, {
      count: 10,              // Number of frames
      interval: 'adaptive',    // Smart frame selection
      includeAudio: true       // Extract audio for context
    });

    // 3. Convert to base64 for API
    const frameData = frames.map(f => ({
      base64: f.toBase64(),
      timestamp: f.timestamp,
      audioContext: f.audioTranscript
    }));

    // 4. Get rubric elements for context
    const template = await db.rubricTemplates.findById(video.templateId);
    const elements = await db.rubricElements.findByTemplate(template.id);

    // 5. Build AI prompt
    const prompt = buildAnalysisPrompt(elements, video.metadata);

    // 6. Call GPT-5.2 vision model
    const response = await llm.analyze({
      model: 'gpt-5.2-vision',
      images: frameData,
      prompt: prompt,
      responseFormat: AI_OBSERVATION_SCHEMA
    });

    // 7. Parse and validate response
    const observations = parseAIResponse(response);

    // 8. Store observations
    for (const obs of observations) {
      await db.aiObservations.create({
        videoId: video.id,
        elementId: obs.elementId,
        confidence: obs.confidence,
        scoreEstimate: obs.score,
        startTs: obs.startTimestamp,
        endTs: obs.endTimestamp,
        summary: obs.summary,
        keyMoments: obs.keyMoments,
        status: 'pending',
        modelVersion: 'gpt-5.2-vision'
      });
    }

    // 9. Update video status
    await db.videoEvidence.update(videoId, {
      processingStatus: 'completed',
      processedAt: new Date()
    });

  } catch (error) {
    await db.videoEvidence.update(videoId, {
      processingStatus: 'failed',
      processingError: error.message
    });
    throw error;
  }
}
```

### Expected AI Output Schema

```typescript
interface AIAnalysisResponse {
  observations: AIObservationOutput[];
  overallSummary: string;
  processingMetadata: {
    framesAnalyzed: number;
    modelVersion: string;
    processingTimeMs: number;
  };
}

interface AIObservationOutput {
  elementId: string;
  elementName: string;
  confidence: number;        // 0.0 - 1.0
  score: number;             // 0 - 100
  startTimestamp: string;    // ISO 8601
  endTimestamp: string;      // ISO 8601
  summary: string;           // 1-3 sentences
  keyMoments: KeyMoment[];
  evidenceQuotes: string[];  // Specific observed behaviors
  suggestions: string[];     // Improvement suggestions
}

interface KeyMoment {
  timestamp: string;
  description: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  relatedIndicator?: string; // Which rubric indicator this maps to
}
```

### AI Prompt Template

```typescript
const buildAnalysisPrompt = (elements: Element[], metadata: VideoMetadata) => `
You are an expert educational evaluator analyzing classroom video footage.

CONTEXT:
- Subject: ${metadata.subject || 'Not specified'}
- Grade Level: ${metadata.gradeLevel || 'Not specified'}
- Lesson Topic: ${metadata.lessonTopic || 'Not specified'}

EVALUATION FRAMEWORK:
${elements.map(e => `
Element: ${e.name}
Description: ${e.description}
Indicators to look for:
${e.indicators.map(i => `  - ${i}`).join('\n')}
`).join('\n---\n')}

TASK:
Analyze the provided video frames and identify evidence related to each evaluation element.
For each element where you observe relevant behavior:
1. Rate the performance (0-100 scale)
2. Provide confidence level in your assessment (0.0-1.0)
3. Note specific timestamps and key moments
4. Summarize observed behaviors with specific examples

OUTPUT FORMAT:
Respond with valid JSON matching the schema provided.
Only include elements where you have sufficient evidence (confidence >= 0.5).
Be specific and cite observable behaviors, not assumptions.
`;
```

### Storage & Display

#### Storage
- Video files stored in cloud storage (S3/GCS) with encryption at rest
- AI observations stored in PostgreSQL with full audit trail
- Clips can be pre-generated for quick playback

#### Display Integration
- AI observations appear in ElementRow on TeacherDashboard
- Each observation shows:
  - Confidence badge (percentage)
  - Score estimate
  - Summary text
  - Link to video clip at timestamp
- Observations grouped by element for easy review

### Human Review Flow

```typescript
async function reviewAIObservation(
  observationId: string,
  reviewerId: string,
  action: 'accept' | 'reject' | 'edit',
  edits?: { score?: number; notes?: string }
): Promise<void> {
  const observation = await db.aiObservations.findById(observationId);

  // 1. Create review record
  await db.aiObservationReviews.create({
    observationId,
    reviewerId,
    action,
    editedScore: edits?.score,
    notes: edits?.notes,
    reviewedAt: new Date()
  });

  // 2. Update observation status
  await db.aiObservations.update(observationId, {
    status: action === 'accept' ? 'accepted' :
            action === 'reject' ? 'rejected' : 'edited'
  });

  // 3. If accepted or edited, update/create assessment element score
  if (action === 'accept' || action === 'edit') {
    const score = edits?.score ?? observation.scoreEstimate;
    await updateElementScore(
      observation.teacherId,
      observation.elementId,
      score,
      observation.videoId
    );
  }

  // 4. Create audit log entry
  await db.auditLog.create({
    userId: reviewerId,
    action: `ai_review_${action}`,
    targetType: 'ai_observation',
    targetId: observationId,
    details: { previousScore: observation.scoreEstimate, newScore: edits?.score }
  });
}
```

### Score Merging Algorithm

```typescript
// Pseudocode for merging AI and human scores
function calculateElementScore(
  teacherId: string,
  elementId: string,
  dateRange: DateRange
): number {
  // Get all observations for this element in the date range
  const humanObs = db.assessmentElements.find({
    teacherId,
    elementId,
    date: { $gte: dateRange.start, $lte: dateRange.end }
  });

  const aiObs = db.aiObservations.find({
    teacherId,
    elementId,
    status: { $in: ['accepted', 'edited'] },
    createdAt: { $gte: dateRange.start, $lte: dateRange.end }
  });

  // Priority: Human observations always override AI
  if (humanObs.length > 0) {
    // Use weighted average of human observations
    // More recent observations weighted higher
    return weightedAverageByRecency(humanObs);
  }

  // If no human observations, use AI with confidence weighting
  if (aiObs.length > 0) {
    // Weight by confidence and recency
    const weightedSum = aiObs.reduce((sum, obs) => {
      const recencyWeight = calculateRecencyWeight(obs.createdAt);
      return sum + (obs.scoreEstimate * obs.confidence * recencyWeight);
    }, 0);

    const totalWeight = aiObs.reduce((sum, obs) => {
      const recencyWeight = calculateRecencyWeight(obs.createdAt);
      return sum + (obs.confidence * recencyWeight);
    }, 0);

    return weightedSum / totalWeight;
  }

  // No observations - return null (no score)
  return null;
}

function calculateRecencyWeight(date: Date): number {
  const daysSince = daysBetween(date, new Date());
  // Exponential decay: recent observations weighted higher
  // Half-life of 30 days
  return Math.pow(0.5, daysSince / 30);
}
```

---

## 7. Aggregation & Color Mapping Rules

### Color Thresholds

```typescript
interface ColorThresholds {
  greenMin: number;   // Default: 80
  yellowMin: number;  // Default: 60
  // Red: score < yellowMin
}

function colorFromScore(score: number, thresholds: ColorThresholds): StatusColor {
  if (score >= thresholds.greenMin) return 'green';
  if (score >= thresholds.yellowMin) return 'yellow';
  return 'red';
}
```

### Aggregation Modes

#### 1. Weighted Average (Default)

```typescript
function weightedAverageAggregation(
  elementScores: { score: number; weight: number }[]
): number {
  if (elementScores.length === 0) return 0;

  const totalWeight = elementScores.reduce((sum, e) => sum + e.weight, 0);
  const weightedSum = elementScores.reduce(
    (sum, e) => sum + (e.score * e.weight),
    0
  );

  return weightedSum / totalWeight;
}

// Usage
const columnScore = weightedAverageAggregation([
  { score: 85, weight: 1.0 },
  { score: 72, weight: 1.0 },
  { score: 90, weight: 0.8 }
]);
// Result: (85*1 + 72*1 + 90*0.8) / (1 + 1 + 0.8) = 229 / 2.8 = 81.79
```

#### 2. Worst Score

```typescript
function worstScoreAggregation(
  elementScores: { score: number }[]
): number {
  if (elementScores.length === 0) return 0;
  return Math.min(...elementScores.map(e => e.score));
}

// Usage: If elements have scores [85, 72, 90], result is 72
```

#### 3. Majority Color

```typescript
function majorityColorAggregation(
  elementScores: { score: number }[],
  thresholds: ColorThresholds
): { color: StatusColor; score: number } {
  if (elementScores.length === 0) {
    return { color: 'red', score: 0 };
  }

  // Map each score to a color
  const colors = elementScores.map(e => colorFromScore(e.score, thresholds));

  // Count each color
  const counts = {
    green: colors.filter(c => c === 'green').length,
    yellow: colors.filter(c => c === 'yellow').length,
    red: colors.filter(c => c === 'red').length
  };

  // Find majority
  const majority = Object.entries(counts)
    .sort(([,a], [,b]) => b - a)[0][0] as StatusColor;

  // On tie, use weighted average to determine
  if (counts.green === counts.yellow ||
      counts.yellow === counts.red ||
      counts.green === counts.red) {
    const avgScore = elementScores.reduce((s, e) => s + e.score, 0) / elementScores.length;
    return {
      color: colorFromScore(avgScore, thresholds),
      score: avgScore
    };
  }

  // Return majority with average score
  const avgScore = elementScores.reduce((s, e) => s + e.score, 0) / elementScores.length;
  return { color: majority, score: avgScore };
}
```

### Column Score Calculation

```typescript
function computeColumnScore(
  column: TemplateColumn,
  elementScores: Map<string, ElementScore>,
  aggregationMode: AggregationMode,
  thresholds: ColorThresholds
): MetricCell {
  // Get scores for elements assigned to this column
  const columnElements = column.elementIds
    .map(id => elementScores.get(id))
    .filter(Boolean)
    .map(e => ({
      score: e.numericScore,
      weight: e.weight || 1.0
    }));

  if (columnElements.length === 0) {
    return {
      columnId: column.id,
      columnName: column.name,
      color: 'red',
      numericScore: 0,
      elementCount: 0,
      lastObserved: null
    };
  }

  let numericScore: number;
  let color: StatusColor;

  switch (aggregationMode) {
    case 'worst':
      numericScore = worstScoreAggregation(columnElements);
      color = colorFromScore(numericScore, thresholds);
      break;

    case 'majority':
      const result = majorityColorAggregation(columnElements, thresholds);
      numericScore = result.score;
      color = result.color;
      break;

    case 'weighted':
    default:
      numericScore = weightedAverageAggregation(columnElements);
      color = colorFromScore(numericScore, thresholds);
      break;
  }

  return {
    columnId: column.id,
    columnName: column.name,
    color,
    numericScore: Math.round(numericScore * 100) / 100,
    elementCount: columnElements.length,
    lastObserved: getLatestObservation(column.elementIds, elementScores)
  };
}
```

### Overall Teacher Score

```typescript
function computeOverallScore(
  metricCells: MetricCell[],
  columns: TemplateColumn[]
): { score: number; color: StatusColor } {
  // Weight each column by its configured weight
  const columnScores = metricCells
    .filter(c => c.elementCount > 0)
    .map(cell => {
      const column = columns.find(col => col.id === cell.columnId);
      return {
        score: cell.numericScore,
        weight: column?.weight || 1.0
      };
    });

  const overallScore = weightedAverageAggregation(columnScores);
  const thresholds = { greenMin: 80, yellowMin: 60 }; // Or from user prefs

  return {
    score: Math.round(overallScore * 100) / 100,
    color: colorFromScore(overallScore, thresholds)
  };
}
```

### Configuration Options

```typescript
// System-level defaults (can be overridden by admin)
const DEFAULT_CONFIG = {
  thresholds: {
    greenMin: 80,
    yellowMin: 60
  },
  aggregationMode: 'weighted' as AggregationMode,
  recencyHalfLifeDays: 30,
  minimumConfidenceForAI: 0.5,
  maximumAIWeight: 0.8  // AI score never counts more than 80%
};

// User can customize thresholds
interface UserThresholdOverride {
  userId: string;
  greenMin?: number;  // 0-100
  yellowMin?: number; // 0-100
}
```

---

## 8. Acceptance Tests

### Test 1: Login and Redirect to Homepage

```gherkin
Feature: User Authentication

Scenario: Successful login redirects to homepage with dashboard data
  Given a registered principal account with email "principal@lincoln.edu"
  And the account has password "SecurePass123!"
  And the account has role "principal" with default route "/dashboard"

  When the user navigates to the login page
  And enters email "principal@lincoln.edu"
  And enters password "SecurePass123!"
  And clicks the "Sign In" button

  Then the user should receive a valid JWT token
  And the user should be redirected to "/dashboard"
  And the Homepage should display the dashboard summary
  And the Active Rubric card should show the user's default template
  And the Roster Snapshot should show teacher counts
```

### Test 2: Select Danielson Framework and Open Element Selection

```gherkin
Feature: Framework Selection

Scenario: Selecting Danielson framework loads Element Selection with correct domains
  Given the user is logged in as a principal
  And the user is on the Framework Selection page
  And the Danielson Framework template exists with 4 domains and 22 elements

  When the user clicks "Preview" on the Danielson tile
  Then a modal should display all 4 domains with their elements

  When the user closes the preview modal
  And clicks "Select Framework" on the Danielson tile
  And toggles "Set as my default framework" to ON

  Then POST /api/rubrics/select should be called with templateId "danielson_v2"
  And the user should be redirected to Element Selection page
  And the left panel should display all 4 Danielson domains
  And all 22 elements should be available for assignment
```

### Test 3: Customize Template and Save

```gherkin
Feature: Template Customization

Scenario: Creating a custom template with elements assigned to columns
  Given the user is on Element Selection page with Danielson template loaded
  And the user has empty metric columns

  When the user drags element "1a: Knowledge of Content" to column "Instruction"
  And drags element "1b: Knowledge of Students" to column "Instruction"
  And drags element "2a: Environment of Respect" to column "Environment"
  And drags element "3a: Communicating with Students" to column "Engagement"
  And sets column "Instruction" weight to 100%
  And sets column "Engagement" weight to 80%
  And names the template "Custom - Literacy Focus"
  And clicks "Save Template"

  Then POST /api/rubrics/templates should be called with:
    | name      | Custom - Literacy Focus |
    | columns   | 4 columns with assigned elements |
  And the response should return a new templateId
  And a success toast should appear: "Template saved successfully"
  And the user should be redirected to the Roster page
```

### Test 4: Roster Displays Only Color Chips

```gherkin
Feature: Teacher Roster Display

Scenario: Roster shows color-coded chips with tooltips containing numeric scores
  Given the user is logged in as a principal
  And a saved template "Custom Template" exists with 4 metric columns
  And teacher "John Smith" has assessment scores:
    | Column       | Score | Color  |
    | Instruction  | 85    | green  |
    | Engagement   | 72    | yellow |
    | Assessment   | 88    | green  |
    | Environment  | 55    | red    |

  When the user navigates to the Roster page with templateId "custom_template"

  Then the roster table should display teacher "John Smith"
  And the Instruction cell should show only a green color chip
  And the Engagement cell should show only a yellow color chip
  And the Environment cell should show only a red color chip
  And numeric scores should NOT be visible in the cells

  When the user hovers over the Instruction chip
  Then a tooltip should appear with "Score: 85% • Last observed: [date]"
```

### Test 5: Click Teacher Opens Dashboard

```gherkin
Feature: Teacher Dashboard Navigation

Scenario: Clicking teacher name loads detailed dashboard with all data
  Given the user is on the Roster page
  And teacher "John Smith" is visible in the roster
  And John Smith has 5 assessments in the current period
  And John Smith has 3 AI observations pending review

  When the user clicks on "John Smith" in the roster

  Then the user should be redirected to "/teachers/tch_001/dashboard"
  And GET /api/teachers/tch_001/detail should be called
  And the dashboard should display:
    | Component              | Content                    |
    | Header                 | "John Smith's Dashboard"   |
    | Overall Rating         | Score with color chip      |
    | Top 4 Problematic      | 4 elements ranked by algorithm |
    | Element Table          | All elements with scores   |
    | AI Insights            | 3 pending observations     |
    | Observation Timeline   | 5 historical observations  |
```

### Test 6: Top 4 Problematic Elements Computed Correctly

```gherkin
Feature: Problematic Elements Algorithm

Scenario: Top 4 elements calculated using problem score formula
  Given teacher "Jane Doe" has the following element scores:
    | Element          | Current | Previous | Frequency | AI Confidence |
    | 2c: Procedures   | 55      | 62       | 4         | 0.85          |
    | 1a: Content      | 82      | 78       | 5         | 0.90          |
    | 3b: Questioning  | 48      | 55       | 3         | 0.75          |
    | 2a: Respect      | 70      | 72       | 2         | 0.60          |
    | 4a: Reflecting   | 90      | 88       | 1         | 0.95          |

  When the teacher dashboard loads for "Jane Doe"

  Then the Top 4 Problematic Elements should be calculated as:
    # Problem Score = deficit*1.2 + delta*2 + log(1+freq)*5 + confidence*0.2
    # 3b: (52)*1.2 + (7)*2 + log(4)*5 + 0.15 = 62.4 + 14 + 6.93 + 0.15 = 83.48
    # 2c: (45)*1.2 + (7)*2 + log(5)*5 + 0.17 = 54 + 14 + 8.05 + 0.17 = 76.22
  And the displayed order should be:
    | Rank | Element          |
    | 1    | 3b: Questioning  |
    | 2    | 2c: Procedures   |
    | 3    | 2a: Respect      |
    | 4    | 1a: Content      |
```

### Test 7: Principal Mode Override (Priority Detail)

```gherkin
Feature: Priority Detail View Mode

Scenario: Principal's pinned elements shown first in Priority mode
  Given principal has pinned elements ["elem_2c", "elem_4a"]
  And teacher dashboard is loaded with "Auto Detail" mode
  And elements are sorted by algorithm ranking

  When the principal toggles to "Priority Detail" mode

  Then element "2c: Procedures" should appear first in the rubric table
  And element "4a: Reflecting" should appear second
  And remaining elements should follow in algorithm order
  And pinned elements should have a visible "pinned" indicator
```

### Test 8: AI Observation Displayed with Video Clip

```gherkin
Feature: AI Observation Display

Scenario: AI observations show summary, confidence, and clip link
  Given video "vid_001" was processed by AI
  And AI generated observation for element "1a: Knowledge of Content":
    | Field       | Value                                    |
    | confidence  | 0.87                                     |
    | score       | 85                                       |
    | summary     | "Teacher demonstrates strong content..." |
    | clipUrl     | "https://cdn.cognivio.com/clips/..."     |
    | status      | pending                                  |

  When the teacher dashboard loads

  Then element "1a" row should show AI observation section
  And the observation should display:
    | Confidence badge | "AI Confidence: 87%"           |
    | Summary text     | "Teacher demonstrates strong..." |
    | Video link       | "View Clip" button              |
    | Action buttons   | "Accept", "Edit", "Reject"      |

  When the user clicks "View Clip"
  Then the VideoPlayerModal should open
  And video should start at the observation timestamp
```

### Test 9: Gradebook Missing Grades Flagged

```gherkin
Feature: Gradebook Health Indicator

Scenario: Teachers with missing grades flagged on roster
  Given teacher "Tom Wilson" has gradebook status:
    | isHealthy       | false                          |
    | missingGrades   | true                           |
    | classesMissing  | ["Algebra 101", "Geometry 201"]|
    | lastUpdated     | "2026-01-27T08:00:00Z"         |

  When the roster loads

  Then teacher "Tom Wilson" row should show gradebook warning icon
  And the GradebookStatus cell should display alert indicator

  When the user hovers over the gradebook icon
  Then tooltip should show "Missing grades in: Algebra 101, Geometry 201"

  When the user clicks on the gradebook icon
  Then a modal should list all classes with missing grades
```

### Test 10: Save Template Validation Error

```gherkin
Feature: Template Validation

Scenario: Prevent saving template with empty enabled columns
  Given the user is on Element Selection page
  And column "Instruction" has 2 elements assigned
  And column "Engagement" is enabled but has 0 elements
  And column "Assessment" has 1 element assigned
  And column "Environment" is disabled

  When the user enters template name "Incomplete Template"
  And clicks "Save Template"

  Then POST /api/rubrics/templates should NOT be called
  And a validation error should appear:
    | Field   | Message                                          |
    | columns | "Assign at least one element to each enabled column" |
  And column "Engagement" should be highlighted with error state
  And focus should move to the Engagement column

  When the user disables column "Engagement"
  And clicks "Save Template" again

  Then POST /api/rubrics/templates should be called
  And the template should save successfully
```

---

## 9. Implementation Notes & Priorities

### MVP Checklist (Phase 1)

**Week 1-2: Foundation**
- [ ] Project setup (React + TypeScript + Tailwind)
- [ ] Authentication system (JWT login/logout)
- [ ] Database schema creation and migrations
- [ ] Basic API structure with Express/Fastify
- [ ] Core TypeScript interfaces

**Week 3-4: Screens 1-3**
- [ ] LoginPage with email/password auth
- [ ] Homepage with dashboard summary API
- [ ] TopNav component with user menu
- [ ] FrameworkSelection page
- [ ] RubricTile component
- [ ] PreviewModal component
- [ ] GET /api/rubrics/templates endpoint
- [ ] POST /api/rubrics/select endpoint

**Week 5-6: Screen 4 - Element Selection**
- [ ] DomainAccordion component
- [ ] DraggableElement with keyboard support
- [ ] MetricColumn with drop zones
- [ ] Drag-and-drop library integration (dnd-kit)
- [ ] RosterHeaderPreview component
- [ ] SaveTemplateForm with validation
- [ ] GET /api/rubrics/elements endpoint
- [ ] POST /api/rubrics/templates endpoint

**Week 7-8: Screen 5 - Teacher Roster**
- [ ] RosterTable with sorting and filtering
- [ ] ColorChip component with tooltips
- [ ] Pagination component
- [ ] Filter dropdowns (subjects, grades, status)
- [ ] QuickViewModal
- [ ] GET /api/roster endpoint with aggregation
- [ ] Color mapping logic
- [ ] Export functionality (CSV)

**Week 9-10: Screen 6 - Teacher Dashboard**
- [ ] TeacherHeader with period selector
- [ ] OverallRatingCard
- [ ] Top4ProblematicCard with algorithm
- [ ] RubricAccordion with element rows
- [ ] TrendChart (use Recharts/Victory)
- [ ] ObservationTimeline
- [ ] GET /api/teachers/:id/detail endpoint
- [ ] Period filtering logic

### Phase 2 Enhancements

**Week 11-12: AI Integration Foundation**
- [ ] Video upload endpoint with presigned URLs
- [ ] Background job queue (Bull/BullMQ)
- [ ] Video processing worker
- [ ] Frame extraction with FFmpeg
- [ ] GPT-5.2 vision API integration
- [ ] AI observation storage
- [ ] VideoPlayerModal component

**Week 13-14: AI Review & Polish**
- [ ] Human review flow (accept/reject/edit)
- [ ] Score merging algorithm
- [ ] AIObservationCard component
- [ ] Audit logging
- [ ] POST /api/ai/review endpoint
- [ ] Confidence visualization
- [ ] Key moments display

**Week 15-16: SSO & Administration**
- [ ] Microsoft SSO integration
- [ ] Google SSO integration
- [ ] Role selection modal
- [ ] Admin settings page
- [ ] Threshold configuration
- [ ] User management

### Phase 3: AI/Analytics Improvements

**Future Enhancements**
- [ ] Real-time video processing status (WebSocket)
- [ ] Face anonymization pipeline
- [ ] Batch video upload
- [ ] Advanced trend analytics
- [ ] Predictive scoring models
- [ ] Comparative analytics (teacher vs school average)
- [ ] PDF report generation
- [ ] Email notification system
- [ ] Mobile-responsive optimization
- [ ] Offline support (PWA)
- [ ] Gradebook API integrations (PowerSchool, Canvas)
- [ ] Action plan tracking and reminders
- [ ] Custom rubric element creation
- [ ] Multi-school/district support

### Technical Debt & Quality

**Testing Requirements**
- Unit tests for all utility functions (aggregation, color mapping)
- Integration tests for API endpoints
- E2E tests for critical user flows (Playwright/Cypress)
- Component tests with React Testing Library
- Minimum 80% code coverage

**Performance Targets**
- Homepage load: < 1.5 seconds
- Roster load (100 teachers): < 2 seconds
- Dashboard load: < 2 seconds
- Video processing: < 5 minutes for 45-min video

**Accessibility Requirements**
- WCAG 2.1 AA compliance
- Keyboard navigation for all interactions
- Screen reader tested (VoiceOver, NVDA)
- Color contrast ratios met
- Focus management in modals

**Security Requirements**
- JWT with refresh token rotation
- Input validation on all endpoints
- SQL injection prevention (parameterized queries)
- XSS prevention (content sanitization)
- CORS properly configured
- Rate limiting on auth endpoints
- Encrypted video storage
- Audit logging for sensitive actions

### Team Allocation Suggestion

| Role | Focus Area |
|------|------------|
| Frontend Dev 1 | Screens 1-3, shared components |
| Frontend Dev 2 | Screens 4-6, drag-and-drop |
| Backend Dev 1 | Auth, templates, roster APIs |
| Backend Dev 2 | Teacher detail, AI integration |
| Full Stack | Video processing, DevOps |
| QA Engineer | Test automation, accessibility |

---

## Document Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2026-01-28 | Claude | Initial specification |

---

*End of Specification Document*

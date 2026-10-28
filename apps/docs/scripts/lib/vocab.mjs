// Vocabulary for the generated Acme documentation. Everything here is fictional.
//
// A "slot" such as {actor} in a template is replaced by a random entry of the
// list with that name. Lists written per section are added to the shared list
// of the same name. Entries may contain slots themselves.

export const COMPANY = 'Acme';
export const DOMAIN = 'acme.example';

export const SECTIONS = [
  {
    id: 'handbook',
    title: 'Handbook',
    count: 50,
    blurb: 'How we work together: everyday policies, routines and practicalities.',
    kinds: ['policy', 'guidelines', 'overview', 'FAQ', 'checklist'],
    subjects: [
      'remote work', 'expense reimbursement', 'travel booking', 'parental leave', 'team onboarding',
      'equipment request', 'office access', 'team offsite', 'holiday calendar', 'code of conduct',
      'vendor onboarding', 'procurement', 'meeting etiquette', 'internal communication', 'working hours',
      'learning budget', 'conference attendance', 'sabbatical', 'relocation', 'visitor access',
      'company swag', 'volunteer day', 'sick leave', 'public holiday cover', 'workspace booking',
      'mail and parcels', 'company card', 'document retention', 'all hands meeting', 'quarterly planning',
      'customer gift', 'press enquiry', 'social media', 'open source contribution', 'side project',
    ],
  },
  {
    id: 'engineering',
    title: 'Engineering',
    count: 60,
    blurb: 'Architecture, standards and tooling for the people who build the product.',
    kinds: ['architecture', 'guide', 'standards', 'design notes', 'reference'],
    subjects: [
      'service mesh', 'API gateway', 'authentication service', 'billing pipeline', 'event bus',
      'search indexing', 'data warehouse', 'feature flag', 'CI pipeline', 'release train',
      'code review', 'dependency update', 'observability stack', 'structured logging', 'metrics collection',
      'distributed tracing', 'database migration', 'schema design', 'caching layer', 'rate limiting',
      'mobile build', 'frontend framework', 'design token', 'testing strategy', 'load testing',
      'secrets management', 'infrastructure as code', 'container image', 'queue worker', 'cron job',
      'webhook delivery', 'file storage', 'email sending', 'background job', 'API versioning',
      'error budget', 'local development environment', 'monorepo tooling', 'pull request template',
    ],
  },
  {
    id: 'runbooks',
    title: 'Runbooks',
    count: 50,
    blurb: 'Step by step procedures for the on-call engineer when something breaks.',
    kinds: ['runbook', 'recovery steps', 'troubleshooting guide', 'checklist', 'escalation path'],
    subjects: [
      'database failover', 'cache eviction storm', 'certificate renewal', 'disk pressure', 'queue backlog',
      'elevated error rate', 'DNS outage', 'deploy rollback', 'payment provider timeout', 'search cluster red status',
      'memory leak', 'replication lag', 'login failure', 'email delivery delay', 'webhook retry storm',
      'CDN purge', 'node drain', 'backup restore', 'latency regression', 'credential rotation',
      'load balancer misconfiguration', 'stuck deployment', 'full table lock', 'runaway cron job', 'object storage outage',
      'API rate limit breach', 'log pipeline stall', 'feature flag misfire', 'expired token', 'data import failure',
    ],
  },
  {
    id: 'product',
    title: 'Product',
    count: 45,
    blurb: 'What we ship, why we ship it, and how each feature is meant to behave.',
    kinds: ['overview', 'specification', 'roadmap', 'release notes', 'FAQ'],
    subjects: [
      'workspace', 'dashboard', 'notification centre', 'billing portal', 'mobile app',
      'single sign-on', 'audit log', 'import wizard', 'public API', 'webhook',
      'template gallery', 'report builder', 'team and role', 'comment thread', 'global search',
      'integration marketplace', 'onboarding flow', 'usage limit', 'data export', 'custom field',
      'automation rule', 'calendar sync', 'offline mode', 'accessibility', 'localization',
      'saved view', 'bulk edit', 'public link', 'activity feed', 'approval flow',
    ],
  },
  {
    id: 'people',
    title: 'People',
    count: 45,
    blurb: 'Hiring, growth, feedback and everything else that concerns the team itself.',
    kinds: ['guide', 'process', 'playbook', 'overview', 'FAQ'],
    subjects: [
      'hiring', 'interview loop', 'compensation band', 'career ladder', 'promotion',
      'feedback cycle', 'onboarding buddy', 'manager training', 'team ritual', 'one to one meeting',
      'offboarding', 'remote hiring', 'internship', 'inclusion programme', 'wellbeing',
      'recognition', 'engagement survey', 'org chart', 'succession planning', 'contractor engagement',
      'payroll calendar', 'benefits enrolment', 'equity grant', 'learning path', 'mentorship',
      'performance review', 'team retrospective', 'return to work', 'probation period', 'referral bonus',
    ],
  },
  {
    id: 'security',
    title: 'Security',
    count: 50,
    blurb: 'Policies, controls and procedures that keep Acme and its customers safe.',
    kinds: ['standard', 'policy', 'procedure', 'guideline', 'control description'],
    subjects: [
      'access control', 'password management', 'multi-factor authentication', 'device encryption', 'vulnerability disclosure',
      'incident response', 'phishing awareness', 'vendor risk assessment', 'data classification', 'data retention',
      'key management', 'secure coding', 'penetration testing', 'audit preparation', 'security training',
      'network segmentation', 'endpoint protection', 'security monitoring', 'physical security', 'privacy request',
      'third-party access', 'backup protection', 'cloud posture review', 'secret scanning', 'bug bounty',
      'customer data handling', 'laptop loss', 'remote access', 'change approval', 'log retention',
    ],
  },
];

export const OWNERS = [
  'Maya Okafor', 'Jonas Lindqvist', 'Priya Raman', 'Tomas Herrera', 'Elena Petrova', 'Daniel Osei',
  'Hana Yoshida', 'Lucas Moreau', 'Ines Carvalho', 'Samir Haddad', 'Greta Novak', 'Owen Fitzgerald',
  'Amara Diallo', 'Felix Brandt', 'Noor Rahman', 'Chloe Marchand', 'Mateo Rossi', 'Zofia Kowalska',
];

export const TEAM_NAMES = [
  'Platform', 'Finance', 'People Operations', 'Security', 'Data', 'Support', 'Legal', 'Facilities',
  'Design', 'Infrastructure', 'Growth', 'Customer Success',
];

export const TAGS = {
  handbook: ['policy', 'everyday', 'office', 'finance', 'travel', 'communication', 'benefits', 'compliance'],
  engineering: ['architecture', 'tooling', 'backend', 'frontend', 'data', 'platform', 'quality', 'delivery'],
  runbooks: ['on-call', 'incident', 'database', 'network', 'recovery', 'monitoring', 'deploy', 'storage'],
  product: ['feature', 'roadmap', 'customer', 'api', 'design', 'pricing', 'mobile', 'research'],
  people: ['hiring', 'growth', 'feedback', 'culture', 'managers', 'compensation', 'learning', 'wellbeing'],
  security: ['policy', 'controls', 'audit', 'access', 'privacy', 'training', 'incident', 'encryption'],
};

// ---------------------------------------------------------------------------
// Shared slot lists

export const VOCAB = {
  company: [COMPANY],
  actor: [
    'the team', 'every engineer', 'the owning team', 'each manager', 'the requester', 'the reviewer',
    'the approver', 'new joiners', 'the on-call engineer', 'the project lead', 'anyone on the rota',
    'the department head', 'the service owner', 'each squad', 'the coordinator', 'all staff',
    'the account owner', 'contractors', 'team leads', 'the delegate',
  ],
  modal: ['should', 'must', 'can', 'will', 'may', 'should normally', 'must always', 'can also'],
  team: [
    'the platform team', 'the finance team', 'People Operations', 'the security team', 'the data group',
    'the support desk', 'the legal team', 'the facilities team', 'the design group', 'the infrastructure team',
    'the release managers', 'the customer success team',
  ],
  tool: [
    'the internal tracker', 'the shared wiki', 'the ticketing queue', 'the team calendar', 'the approvals form',
    'the chat workspace', 'the planning board', 'the reporting dashboard', 'the asset register', 'the expenses portal',
  ],
  artifact: [
    'summary', 'checklist', 'draft', 'template', 'report', 'request', 'plan', 'record', 'agenda',
    'proposal', 'change note', 'handover note', 'risk assessment', 'estimate', 'timeline',
  ],
  channel: [
    '`#ask-people`', '`#eng-help`', '`#oncall`', '`#security-questions`', '`#product-feedback`',
    '`#finance-requests`', '`#it-support`', '`#docs-feedback`',
  ],
  period: [
    'one working day', 'two working days', 'three working days', 'five working days', 'a week',
    'two weeks', '24 hours', '48 hours', 'thirty days',
  ],
  cycle: ['week', 'month', 'quarter', 'half year', 'year', 'sprint'],
  when: [
    'When the request is urgent,', 'If the owner is unavailable,', 'Once the review is complete,',
    'Before anything is shared outside the company,', 'At the start of every quarter,', 'After each major change,',
    'Whenever the situation changes,', 'For anything that touches customer data,', 'If the numbers do not match,',
    'In most cases,', 'As a rule,', 'During the first week,', 'When in doubt,', 'If a deadline is at risk,',
    'For work that spans several teams,', 'Where a form already exists,',
  ],
  adj: [
    'clear', 'consistent', 'lightweight', 'documented', 'auditable', 'predictable', 'reviewed',
    'repeatable', 'transparent', 'proportionate', 'straightforward', 'explicit',
  ],
  noun: [
    'ownership', 'visibility', 'accountability', 'consistency', 'traceability', 'predictability',
    'context', 'clarity', 'feedback',
  ],
  tail: [
    '', '', '', '', '', ', unless {team} says otherwise', ', which keeps the record {adj}',
    ', so that nothing gets lost', ' whenever it is practical', ' where possible', ', even when it feels unnecessary',
    ', and then move on',
  ],
  action: [
    'confirm the details with {team}', 'record the outcome in {tool}', 'review the {artifact} before it is shared',
    'share the {artifact} with {team}', 'update the {artifact} after every change', 'raise the issue in {channel}',
    'ask {team} for a second opinion', 'attach the {artifact} to the ticket', 'check {tool} before starting',
    'keep the {artifact} up to date', 'agree the next step with {actor}', 'notify {team} within {period}',
    'file the request through {tool}', 'link the {artifact} from the page for {topic}',
    'write a short {artifact} and store it in {tool}', 'walk through the {artifact} with {team}',
    'flag anything unusual to {team}', 'log the decision and the reason for it',
    'archive the {artifact} once the work is done', 'send a reminder in {channel} if nothing happens within {period}',
    'name a backup who can step in', 'prepare a {adj} {artifact} for the next review',
  ],
  noteKind: ['Note', 'Tip', 'Reminder', 'Good to know'],
  warningKind: ['Warning', 'Important', 'Caution'],
  listIntro: [
    'Before you start, gather the following:', 'A complete request includes:', 'The review looks at these points:',
    'Keep these in mind:', 'Typical examples include:', 'The main things to check are:',
    'The usual ingredients are:', 'Most cases involve some of these:',
  ],
  listItem: [
    'A {adj} {artifact} stored in {tool}', 'Confirmation from {team}', 'The name of the owner and a backup',
    'Dates, amounts and any deadlines that apply', 'Links to earlier discussions in {channel}',
    'A short note on what changed and why', 'Evidence that the {artifact} was reviewed',
    'A realistic estimate of the effort involved', 'Any exceptions that were agreed with {team}',
    'The current status in {tool}', 'A contact who can answer questions within {period}',
    'The {artifact} from the previous {cycle}', 'A list of people who need to be told',
  ],
  stepsIntro: [
    'The usual sequence is:', 'Follow these steps in order:', 'In practice, the work goes like this:',
    'The process has a few fixed steps:', 'To get it done:',
  ],
  tableIntro: [
    'The table below summarises the main points.', 'Use the table as a quick reference.',
    'These are the figures most people ask about.', 'The following table lists the usual values.',
  ],
  codeIntro: [
    'For example:', 'A typical case looks like this:', 'The snippet below shows the usual form:',
    'Here is a minimal example:', 'You can start from this:',
  ],
  noun_plain: ['review', 'handover', 'approval', 'audit', 'planning session', 'rollout'],
};

// ---------------------------------------------------------------------------
// Sentence templates. {Topic}, {Actor} and so on capitalise the first letter.

export const GENERAL_TEMPLATES = [
  '{When} {actor} {modal} {action}{tail}.',
  '{Actor} {modal} {action}, and {actor} {modal} {action}.',
  '{Topic} is meant to be {adj} and {adj}, so that nobody has to guess what happens next.',
  'The goal of {topic} is to keep work {adj} while the company grows.',
  'Most questions about {topic} are answered in {tool}, so check there before asking {team}.',
  'Owners {modal} review {topic} at least once per {cycle}, and {team} keeps a record of every change.',
  'A {adj} {artifact} makes {topic} easier to follow, especially for people who join part way through.',
  '{Noun} matters because it keeps {topic} {adj} as the number of teams grows.',
  'Changes to {topic} are announced in {channel} at least {period} before they take effect.',
  'If something is unclear, ask {team} or post in {channel}.',
  'Over the last {n} quarters, the number of exceptions to {topic} has dropped by {pct} percent.',
  'The {artifact} should be short enough to read in {n} minutes and clear enough for someone who was not in the discussion.',
  'Each request gets a named owner, a backup and a turnaround target of {period}.',
  'There is no single right answer for every case, so use judgement and write down the reasoning.',
  'Teams that follow {topic} closely report fewer surprises and faster handovers.',
  'If the {artifact} is incomplete, {team} will send it back with comments rather than guess.',
  'Keep the {artifact} in {tool} so that anyone with access can find it later.',
  'Nothing in this page replaces the advice of {team}; it only describes the usual path.',
  'A good rule of thumb: if it takes more than {n} minutes to explain, write it down.',
  'These rules are reviewed every {cycle}, and suggestions are welcome in {channel}.',
  'Anything that does not fit the usual pattern {modal} go to {team} first.',
  'The most common mistake is to skip the {artifact}, which then has to be rebuilt under pressure.',
  'Treat {topic} as a shared responsibility: {actor} {modal} do their part, and {team} step in when needed.',
  'We keep {topic} deliberately simple, because a {adj} process is one that people actually follow.',
  'In the last {noun_plain}, {n} out of {big} requests were resolved without any follow up.',
  'Do not wait for a perfect {artifact}; a {adj} first version in {tool} is better than none.',
  'If several people are involved, name one of them as the single point of contact.',
  'The numbers on this page are reviewed by {team} and were last confirmed in the previous {cycle}.',
];

export const SECTION_TEMPLATES = {
  handbook: [
    'Requests for {topic} go through {tool}, and {team} replies within {period}.',
    'Everyone at {company} is expected to read this page during their first month.',
    'The policy applies to employees and contractors in every office, with local differences noted where they exist.',
    'Questions about {topic} that are not covered here can be sent to {team}.',
    'Keep receipts and notes for {n} months in case {team} needs to check anything.',
    'Where local law is stricter than this page, local law wins.',
    'Approvals are handled by {actor}, with {team} acting as the backup.',
    'Spending above {big} euros needs a written approval before anything is booked.',
  ],
  engineering: [
    'The {component} talks to the {component} over {protocol}, and retries are capped at {n} attempts.',
    'Every change to the {component} goes through code review and must pass the {suite} before merging.',
    'Configuration for the {component} lives in the repository, next to the code that reads it.',
    'Prefer {practice} over {practice} unless there is a measured reason to do otherwise.',
    'Latency budgets are set per request path; the {component} gets {big} milliseconds at the 95th percentile.',
    'Deployments to the {environment} environment happen automatically after the {suite} pass.',
    'Document the reasons for a design in the repository, not only in chat.',
    'Ownership of the {component} is listed in the service catalogue, together with its on-call rota.',
    'A change that touches the {component} and the {component} in the same release needs a rollout plan.',
  ],
  runbooks: [
    'If {symptom}, {actor} {modal} {action}.',
    'Start by checking {dashboard}; a healthy {component} shows steady traffic and flat queue depth.',
    'The alert fires when {metric} stays above {threshold} for {n} minutes.',
    'Do not restart the {component} until the on-call engineer has confirmed that the {component} is healthy.',
    'When the incident is declared, open a channel named after the date and the {component}.',
    'Expect {symptom_noun} for up to {n} minutes after the change; if it lasts longer, move on to the next step.',
    'Write down every command you run in {tool}, with the time, so the review afterwards is easy.',
    'Once the service is healthy again, leave the incident open for {period} to watch for a repeat.',
    'If {symptom}, page the secondary on-call without waiting for the primary to react.',
  ],
  product: [
    'Users can {user_action} from the {ui_area}, and admins can {admin_action} for the whole workspace.',
    'Availability of {feature} starts with the {plan} plan, with a limit of {big} items per workspace.',
    'We measure the success of {topic} by {success_metric}.',
    'Early feedback on {topic} came mostly from {segment}, who asked for {request}.',
    'Release notes for {topic} are published to customers on the {weekday} after each release.',
    'Keep the copy short; every message about {topic} should fit on a single line on mobile.',
    'Admins can {admin_action}, and members can {user_action}.',
    'Requests for {feature} were the most common theme in the last {n} customer interviews.',
  ],
  people: [
    'Managers {modal} hold a {meeting} with each report every {cycle}.',
    'The {process} takes about {n} weeks from start to finish, and {people_role} tracks each step in {tool}.',
    'Feedback should be specific, timely and kind; focus on the {behaviour}, not the person.',
    '{People_role} {modal} be told about changes to {topic} before the wider company hears about them.',
    'Compensation decisions use the published bands and are reviewed by {team} for consistency.',
    'New joiners get a buddy for their first {n} weeks, and the buddy meets them at least once per week.',
    'Everyone is entitled to a {meeting} within {period} of asking for one.',
  ],
  security: [
    'Access to {data_class} data {modal} be approved by {team} and logged in {tool}.',
    'Credentials for {system} are rotated every {n} days and stored only in {secret_store}.',
    'Report anything suspicious to {team} straight away; there is no penalty for a false alarm.',
    'Each control has an owner, a test frequency and evidence that an auditor can read without help.',
    'Devices that hold {data_class} data must use full disk encryption and a screen lock of {n} minutes or less.',
    'Exceptions to {topic} are time limited, recorded in {tool} and reviewed again after {period}.',
    'Treat {data_class} data as confidential unless {team} has said in writing that it is not.',
    'Access to {system} is reviewed every {cycle}, and unused accounts are removed.',
  ],
};

export const SECTION_VOCAB = {
  handbook: {
    actor: ['the office manager', 'the budget holder', 'the hiring team', 'visitors', 'a colleague'],
    action: [
      'submit the form at least {period} in advance', 'keep the receipt and attach it to the {artifact}',
      'tell the office manager before the visit', 'check the shared calendar for clashes',
    ],
  },
  engineering: {
    actor: ['the author', 'the reviewer', 'the service owner', 'every contributor', 'the release manager'],
    action: [
      'open a pull request with a clear description', 'add a test that fails without the change',
      'update the runbook for the {component}', 'announce the change in `#eng-help`',
      'check the {dashboard} after the deploy', 'roll the {component} forward behind a feature flag',
    ],
    component: [
      'API gateway', 'billing service', 'auth service', 'search indexer', 'event bus', 'notification worker',
      'report generator', 'web frontend', 'mobile backend', 'data pipeline', 'ledger service', 'scheduler',
    ],
    protocol: ['HTTPS', 'gRPC', 'a message queue', 'an internal event stream', 'a plain HTTP call'],
    suite: ['unit tests', 'integration tests', 'contract tests', 'end to end checks', 'lint and type checks'],
    practice: [
      'small, frequent releases', 'explicit configuration', 'idempotent operations', 'boring technology',
      'feature flags', 'structured logging', 'small pull requests', 'typed interfaces',
    ],
    environment: ['staging', 'production', 'preview', 'canary', 'sandbox'],
    dashboard: ['the service overview dashboard', 'the latency dashboard', 'the queue depth panel'],
  },
  runbooks: {
    actor: ['the on-call engineer', 'the incident commander', 'the primary responder', 'the secondary on-call', 'the communications lead'],
    action: [
      'check {dashboard} for the last {n} minutes', 'post a status update in `#oncall`',
      'capture the logs before restarting anything', 'scale the {component} up by one step',
      'drain traffic away from the {component}', 'compare the result with the last known good state',
    ],
    component: [
      'primary database', 'API gateway', 'worker pool', 'cache cluster', 'message queue', 'search index',
      'load balancer', 'payment service', 'scheduler', 'file store', 'auth service',
    ],
    symptom: [
      'error rates climb above the normal range', 'requests start timing out', 'the queue keeps growing',
      'disk usage passes the warning level', 'replication falls behind', 'health checks begin to fail',
      'latency doubles for several minutes', 'memory use keeps rising', 'logins fail for a subset of users',
      'scheduled jobs stop running', 'certificates are close to expiry', 'the dashboard shows missing data',
    ],
    symptom_noun: [
      'elevated error rates', 'slow responses', 'a growing backlog', 'brief connection resets',
      'stale dashboards', 'delayed emails', 'partial outages',
    ],
    dashboard: [
      'the service overview dashboard', 'the latency dashboard', 'the queue depth panel',
      'the database health board', 'the error budget view',
    ],
    metric: ['the error rate', 'p95 latency', 'queue depth', 'disk usage', 'replication lag', 'CPU saturation', 'memory pressure'],
    threshold: ['the agreed limit', 'five percent', 'its seven day baseline', 'the warning level', 'ninety percent'],
  },
  product: {
    actor: ['the product manager', 'the designer', 'the support lead', 'the tech lead'],
    action: [
      'write the user story before any design starts', 'check the {feature} with at least {n} customers',
      'add the analytics events listed on this page', 'update the help centre article',
    ],
    user_action: [
      'create a new item', 'filter the list by owner', 'export a report as CSV', 'share a view with a teammate',
      'pin a favourite', 'set a reminder', 'import data from a spreadsheet', 'invite a collaborator',
      'switch between workspaces', 'restore an earlier version',
    ],
    admin_action: [
      'set default permissions', 'review the audit trail', 'turn the feature on or off', 'manage seats and billing',
      'configure single sign-on', 'set a retention period', 'control who can invite guests', 'require approval for exports',
    ],
    ui_area: ['sidebar', 'toolbar', 'settings page', 'detail panel', 'command menu', 'home screen', 'list view', 'admin console'],
    feature: ['saved views', 'bulk edit', 'public links', 'activity feed', 'custom roles', 'API access', 'data export', 'two-step approvals'],
    plan: ['Starter', 'Team', 'Business', 'Enterprise'],
    success_metric: [
      'weekly active usage', 'the share of new workspaces that adopt it within a month', 'support tickets per thousand users',
      'time to first value', 'the completion rate of the setup flow', 'retention after ninety days',
    ],
    segment: [
      'admins of large workspaces', 'new customers in their first month', 'customers on the Enterprise plan',
      'the support team', 'partners who build integrations',
    ],
    request: ['more control over defaults', 'faster import', 'clearer error messages', 'better mobile support', 'an audit trail', 'a way to undo changes'],
    weekday: ['Tuesday', 'Wednesday', 'Thursday'],
  },
  people: {
    actor: ['the hiring manager', 'the recruiter', 'the people partner', 'the new joiner\'s buddy', 'each manager'],
    action: [
      'schedule the conversation at least {period} ahead', 'write down the agreed goals and share them',
      'collect feedback from at least {n} colleagues', 'keep notes private but factual',
    ],
    meeting: ['one to one', 'career conversation', 'check in', 'feedback session', 'planning session'],
    process: ['hiring process', 'review cycle', 'onboarding plan', 'promotion process', 'offboarding checklist'],
    people_role: ['the recruiter', 'the people partner', 'the hiring manager', 'the team lead', 'the coordinator'],
    behaviour: ['behaviour and its impact', 'outcome and the next step', 'work and the result', 'situation and what could change'],
  },
  security: {
    actor: ['the data owner', 'the security champion', 'the system administrator', 'the auditor'],
    action: [
      'enable multi-factor authentication before first use', 'report the event to `#security-questions`',
      'revoke access that is no longer needed', 'collect evidence and store it in {tool}',
    ],
    data_class: ['customer', 'payroll', 'contract', 'payment', 'employee', 'analytics', 'confidential'],
    secret_store: ['the company vault', 'the password manager', 'the secrets service', 'the key management service'],
    system: [
      'the billing system', 'the admin console', 'the build servers', 'the support desk', 'the data warehouse',
      'the staging cluster', 'the identity provider',
    ],
  },
};

// ---------------------------------------------------------------------------
// Headings. Every page draws its headings without replacement.

export const HEADINGS_COMMON = [
  'Overview', 'Scope', 'Who this applies to', 'Roles and responsibilities', 'How it works', 'Step by step',
  'Requesting an exception', 'Common questions', 'Examples', 'Tips and pitfalls', 'Review cycle',
  'What we measure', 'Escalation', 'Tooling', 'Definitions', 'What changed recently', 'Known limitations',
  'Getting help', 'Background', 'Principles',
];

export const HEADINGS_BY_SECTION = {
  handbook: ['Eligibility', 'Approvals', 'Costs and limits', 'Local differences', 'Timing', 'Records'],
  engineering: [
    'Design goals', 'Architecture', 'Data model', 'Failure modes', 'Configuration', 'Deployment', 'Testing',
    'Operational notes', 'Performance considerations', 'Migration plan', 'Dependencies', 'Security considerations',
  ],
  runbooks: [
    'Symptoms', 'Impact', 'Diagnosis', 'Mitigation', 'Verification', 'Rollback', 'After the incident',
    'Dashboards and alerts', 'Communication', 'Prerequisites', 'Safety checks',
  ],
  product: [
    'User stories', 'Behaviour', 'Limits and quotas', 'Permissions', 'Rollout plan', 'Open questions',
    'Analytics events', 'Design notes', 'Pricing and plans', 'Customer feedback',
  ],
  people: [
    'Expectations', 'Timeline', 'Manager checklist', 'Employee checklist', 'Fairness and calibration',
    'Feedback', 'Support available', 'Confidentiality',
  ],
  security: [
    'Policy statement', 'Controls', 'Evidence', 'Exceptions', 'Monitoring', 'Reporting a concern',
    'Audit trail', 'Classification', 'Training', 'Risk assessment',
  ],
};

export const SUBHEADINGS = [
  'Before you start', 'During the process', 'Afterwards', 'Typical example', 'Edge cases', 'Notes for managers',
  'Notes for teams', 'What to avoid', 'Quick reference', 'Checklist', 'Recommended approach', 'Alternatives',
  'Limits', 'Ownership', 'Timing', 'Inputs and outputs', 'Reporting', 'Frequently needed details',
];

// ---------------------------------------------------------------------------
// Table definitions: header cells and one generator for the cells of a row.

export const TABLES = {
  common: {
    header: ['Task', 'Owner', 'Target', 'Notes'],
    cells: {
      Task: [
        'Submit the request', 'Confirm the details', 'Approve the change', 'Archive the record', 'Notify the team',
        'Schedule the review', 'Publish the summary', 'Collect the feedback', 'Close the ticket', 'Update the register',
      ],
      Owner: TEAM_NAMES,
      Target: ['1 day', '2 days', '5 days', 'Weekly', 'Monthly', 'Quarterly', 'Within 24 hours', 'Next sprint'],
      Notes: ['Required', 'Optional', 'Recommended', 'Automated', 'Manual', 'Reviewed yearly', 'Needs approval'],
    },
  },
  runbooks: {
    header: ['Alert', 'Severity', 'First response', 'Owner'],
    cells: {
      Alert: [
        'HighErrorRate', 'DiskUsageCritical', 'QueueDepthHigh', 'ReplicationLag', 'CertExpiringSoon', 'LatencyP95High',
        'PodCrashLooping', 'BackupMissed', 'LoginFailureSpike', 'WebhookBacklog',
      ],
      Severity: ['SEV1', 'SEV2', 'SEV3', 'Page', 'Ticket'],
      'First response': [
        'Check the dashboard', 'Restart the worker', 'Scale up one step', 'Fail over to the replica',
        'Roll back the last deploy', 'Clear the backlog', 'Renew the certificate', 'Notify the owner',
      ],
      Owner: ['Platform', 'Infrastructure', 'Data', 'Security', 'Support'],
    },
  },
  engineering: {
    header: ['Service', 'Language', 'Owner', 'Deploy cadence'],
    cells: {
      Service: ['billing-api', 'auth-service', 'search-indexer', 'notifier', 'report-worker', 'gateway', 'ledger', 'scheduler', 'exports', 'webhooks'],
      Language: ['TypeScript', 'Go', 'Python', 'Kotlin', 'Rust'],
      Owner: TEAM_NAMES,
      'Deploy cadence': ['On merge', 'Daily', 'Twice a week', 'Weekly', 'On request'],
    },
  },
  product: {
    header: ['Feature', 'Starter', 'Team', 'Enterprise'],
    cells: {
      Feature: ['Saved views', 'Bulk edit', 'Public links', 'Activity feed', 'Custom roles', 'API access', 'Data export', 'Audit log', 'Single sign-on'],
      Starter: ['No', 'Limited', 'Yes', 'Add-on'],
      Team: ['Yes', 'Limited', 'Add-on', 'Yes'],
      Enterprise: ['Yes', 'Yes', 'Unlimited', 'Custom'],
    },
  },
  people: {
    header: ['Level', 'Scope', 'Typical tenure', 'Review cadence'],
    cells: {
      Level: ['L1', 'L2', 'L3', 'L4', 'L5', 'L6'],
      Scope: ['Task', 'Feature', 'Project', 'Team', 'Department', 'Company'],
      'Typical tenure': ['0 to 2 years', '1 to 3 years', '2 to 4 years', '3 to 6 years', '5 or more years'],
      'Review cadence': ['Every 6 months', 'Every 6 months', 'Yearly', 'Yearly'],
    },
  },
  security: {
    header: ['Control', 'Frequency', 'Evidence', 'Owner'],
    cells: {
      Control: [
        'Access review', 'Backup restore test', 'Vulnerability scan', 'Phishing exercise', 'Key rotation',
        'Vendor review', 'Log review', 'Device inventory check', 'Policy acknowledgement',
      ],
      Frequency: ['Monthly', 'Quarterly', 'Twice a year', 'Yearly', 'Continuous'],
      Evidence: ['Ticket export', 'Signed checklist', 'Scan report', 'Dashboard snapshot', 'Audit log extract'],
      Owner: ['Security', 'Infrastructure', 'People Operations', 'IT', 'Legal'],
    },
  },
};

// ---------------------------------------------------------------------------
// Code snippets. Each generator receives (random, topic) and returns { lang, code }.

export const CODE_NAMES = {
  service: ['billing-api', 'auth-service', 'search-indexer', 'notifier', 'report-worker', 'gateway', 'ledger', 'scheduler', 'exports', 'webhooks'],
  namespace: ['production', 'staging', 'platform', 'data'],
  table: ['invoices', 'accounts', 'sessions', 'events', 'users', 'audit_log', 'payments', 'subscriptions'],
  env: ['staging', 'production', 'canary'],
  field: ['id', 'status', 'owner', 'created_at', 'amount', 'currency', 'region', 'plan'],
  status: ['active', 'pending', 'suspended', 'archived'],
};

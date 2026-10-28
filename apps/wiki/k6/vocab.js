// Vocabulary and naming rules shared by the seed script (Node) and the k6
// scenario. Plain ES module with no imports, so both runtimes load it as is.
// Changing a list or a rule changes the slugs: reseed after any edit.

export const USER_COUNT = 20;
export const PASSWORD = 'bench-pass';
export const PAGE_COUNT = 10000;

export const ADJECTIVES = [
  'reliable', 'internal', 'quarterly', 'shared', 'automated', 'legacy', 'secure', 'regional',
  'weekly', 'critical', 'lightweight', 'standard', 'updated', 'preferred', 'scheduled', 'public',
  'private', 'remote', 'global', 'local', 'flexible', 'modular', 'stable', 'experimental',
  'temporary', 'primary', 'secondary', 'optional', 'mandatory', 'detailed', 'concise', 'annual',
  'monthly', 'daily', 'urgent', 'routine', 'manual', 'external', 'central', 'distributed',
  'resilient', 'portable', 'verified', 'approved', 'archived', 'active', 'pending', 'minimal',
];

export const NOUNS = [
  'deployment', 'onboarding', 'incident', 'backup', 'release', 'billing', 'invoice', 'roadmap',
  'budget', 'hiring', 'support', 'security', 'monitoring', 'migration', 'database', 'pipeline',
  'network', 'vendor', 'contract', 'policy', 'compliance', 'training', 'meeting', 'review',
  'template', 'workflow', 'dashboard', 'analytics', 'inventory', 'procurement', 'shipment',
  'warehouse', 'campaign', 'pricing', 'survey', 'feedback', 'testing', 'staging', 'rollback',
  'certificate', 'password', 'firewall', 'cluster', 'container', 'gateway', 'schema', 'index',
  'cache', 'queue', 'retention', 'escalation', 'handover', 'calendar', 'expense', 'payroll',
  'benefits', 'vacation', 'mentoring', 'workshop', 'prototype', 'interview', 'partnership',
  'forecast', 'audit', 'quota',
];

export const VERBS = [
  'review', 'update', 'approve', 'schedule', 'archive', 'escalate', 'document', 'verify',
  'publish', 'deploy', 'monitor', 'assign', 'configure', 'rotate', 'restore', 'validate',
  'notify', 'collect', 'summarize', 'prioritize', 'estimate', 'coordinate', 'migrate', 'audit',
  'test', 'track', 'resolve', 'plan', 'submit', 'merge', 'announce', 'measure', 'adjust',
  'confirm', 'draft', 'inspect', 'share', 'request', 'close', 'reopen',
];

export const OBJECTS = [
  'ticket', 'request', 'change', 'report', 'proposal', 'checklist', 'approval', 'ledger',
  'summary', 'action item', 'milestone', 'handbook', 'runbook', 'agreement', 'estimate',
  'dependency', 'owner', 'deadline', 'baseline', 'exception',
];

export const TEAMS = [
  'platform', 'finance', 'operations', 'design', 'sales', 'legal', 'people', 'support', 'data',
  'security', 'marketing', 'research',
];

export const DOC_TYPES = [
  'Guide', 'Checklist', 'Runbook', 'Policy', 'Notes', 'Overview', 'Handbook', 'Playbook', 'FAQ',
  'Proposal', 'Retrospective', 'Glossary',
];

// Words the search scenario draws from. Every one of them occurs in page text.
export const SEARCH_WORDS = [...NOUNS, ...VERBS, ...ADJECTIVES];

function capitalize(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

// 3733 is coprime with the number of combinations, so consecutive indexes
// walk through distinct adjective, noun and document type triples.
function wordsFor(i) {
  const combinations = ADJECTIVES.length * NOUNS.length * DOC_TYPES.length;
  const k = (i * 3733) % combinations;
  const adjective = ADJECTIVES[k % ADJECTIVES.length];
  const noun = NOUNS[Math.floor(k / ADJECTIVES.length) % NOUNS.length];
  const docType = DOC_TYPES[Math.floor(k / (ADJECTIVES.length * NOUNS.length))];
  return { adjective, noun, docType };
}

/** Slug of the seeded page number i (0-based), unique thanks to the suffix. */
export function slugFor(i) {
  const { adjective, noun } = wordsFor(i);
  return `${adjective}-${noun}-${String(i).padStart(5, '0')}`;
}

/** Title of the seeded page number i (0-based). */
export function titleFor(i) {
  const { adjective, noun, docType } = wordsFor(i);
  return `${capitalize(adjective)} ${capitalize(noun)} ${docType}`;
}

/** Username of user number n (1-based): user01 .. user20. */
export function usernameFor(n) {
  return `user${String(n).padStart(2, '0')}`;
}

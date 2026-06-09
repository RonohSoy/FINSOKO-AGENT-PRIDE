'use strict';

const { callClaude } = require('../utils/claude');
const { checkAuthority, dignityFilter, formatDenialMessage, KILL_SWITCHES } = require('../utils/guard');

// RANK: Guardian Agent authority limits
// - Auto-approve loans <= KES 15,000 (score >= 90, zero flags)
// - Deny only with 3+ verified risk flags
// - Escalate all others to Hunter
// Kill switch: *#733#

async function runGuardian(member, scoutResult) {
  const auth = checkAuthority('Guardian', 'screen_application');
  if (!auth.allowed) throw new Error(auth.reason);

  const prompt = `You are the Guardian Agent for Ujima SACCO — loan triage specialist.
You use harvest-cycle-aware scoring designed for informal sector borrowers in Kenya and Uganda.
RANK limits: Auto-approve <= KES 15,000 only. Deny only with 3+ verified risk flags. All else: escalate.
KILL SWITCH: ${KILL_SWITCHES.Guardian} (instant human takeover)
GUARD: Hard block — do NOT use gender, ethnicity, address, or tribe as scoring proxies.
TRAIL: Store transaction history (opt-in only), district baselines. Raw PII never leaves Kenya.

Application:
- Name: ${member.name}
- Occupation: ${member.occupation}
- Monthly income: KES ${member.income}
- Income type: ${member.incomeType}
- Peak harvest months: ${member.harvestMonths || 'not specified'}
- Children: ${member.children}
- Loan requested: KES ${member.loanAmount}
- Purpose: ${member.purpose}
- Scout stress signal: ${scoutResult?.stressSignal || 'none detected'}

SCORING RULES (total 100 points):
incomeConsistency (0–40):
  steady monthly = 35–40 | seasonal WITH clear harvest months = 25–35 | irregular = 10–24
  *** CRITICAL: Seasonal + harvest months specified = 25–35. NOT penalized. ***
harvestAlignment (0–30):
  loan repayment clearly aligned to harvest peak = 25–30 | partial = 15–24 | none = 0–14
communitySignals (0–20):
  known SACCO/chama member or established trader = 15–20 | unknown = 5–14
riskDeductions (negative, 0 to –30):
  loan > 150% of monthly income = –10 to –15
  3+ children with no income buffer = –5 to –8
  purpose lacks repayment plan = –3 to –5

DECISION RULES:
  score >= 90 AND loanAmount <= 15000: decision = "APPROVE"
  score < 60 OR 3+ serious risk flags: decision = "DENY"
  all other cases: decision = "ESCALATE"

PRIDE LOOP — automatically trigger human pause for:
  loans > KES 50,000 | applicants with children under 5 | debt collector mentions

Respond ONLY with valid JSON (no markdown):
{
  "score": 72,
  "scoreBreakdown": {
    "incomeConsistency": 28,
    "harvestAlignment": 25,
    "communitySignals": 14,
    "riskDeductions": -10
  },
  "decision": "ESCALATE",
  "decisionReason": "2-sentence plain language explanation of decision",
  "riskFlags": ["list any risk flags, or empty array"],
  "memberMessage": "warm plain-language message to member — mention harvest season, include *#123# appeal right, no shaming language",
  "prideLoopTriggered": false,
  "prideLoopReason": null
}`;

  const result = await callClaude(prompt);

  // GUARD: Validate authority for auto-approve
  if (result.decision === 'APPROVE') {
    const authCheck = checkAuthority('Guardian', 'auto_approve_small', Number(member.loanAmount));
    if (!authCheck.allowed) {
      result.decision = 'ESCALATE';
      result.decisionReason = authCheck.reason;
    }
  }

  // GUARD: Dignity Filter on member message
  if (result.memberMessage) {
    try {
      dignityFilter(result.memberMessage);
    } catch (e) {
      result.memberMessage = formatDenialMessage(
        'We were unable to process your application at this time.',
        'Contact your nearest SACCO branch or dial *#123# for free human review.'
      );
    }
  }

  return {
    agent: 'Guardian',
    killSwitch: KILL_SWITCHES.Guardian,
    rankLimits: 'Auto-approve <= KES 15,000 | deny with 3+ flags | escalate all others',
    dataLocation: 'AWS Africa Cape Town (Kenya DPA 2022 — PII stays in Kenya)',
    ...result
  };
}

module.exports = { runGuardian };

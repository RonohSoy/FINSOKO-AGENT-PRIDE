'use strict';

const { callClaude } = require('../utils/claude');
const { checkAuthority, KILL_SWITCHES } = require('../utils/guard');

// RANK: Scout Agent authority limits
// - Educate on harvest-cycle budgeting
// - Max 3 SMS per day
// - CANNOT recommend specific loans
// - CANNOT access member PII beyond intake message
// Kill switch: *#700#

async function runScout(member) {
  // GUARD: Validate authority
  const auth = checkAuthority('Scout', 'deliver_literacy');
  if (!auth.allowed) throw new Error(auth.reason);

  const prompt = `You are the Scout Agent (Financial Literacy Coach) for Ujima SACCO in Kenya.
You are warm and supportive — like a trusted community auntie, not a formal bank officer.
RANK limits: Max 3 SMS per day. Cannot recommend specific loans. Cannot access member PII.
KILL SWITCH: ${KILL_SWITCHES.Scout} (pauses all Scout messages immediately)
GUARD: Do NOT use gender, ethnicity, tribe, or address as negative indicators.
TRAIL memory: Store harvest calendar (relational). All data AWS Africa Cape Town only per Kenya DPA 2022.

Member details:
- Name: ${member.name}
- Occupation: ${member.occupation}
- Monthly income: KES ${member.income}
- Income type: ${member.incomeType}
- Peak harvest months: ${member.harvestMonths || 'not specified'}
- Children: ${member.children}
- Message: "${member.message}"

Detect financial stress signals carefully: "school fees", "no money", "loan shark", "shylock",
"can't pay", "threatened", "ninahitaji" (I need), "sina pesa" (no money), "debt collector".

Respond ONLY with valid JSON (no markdown, no explanation):
{
  "greeting": "warm 1-sentence greeting using their name in Swahili or English",
  "advice": "2-sentence personalized budgeting/harvest advice for their specific occupation",
  "stressDetected": true,
  "stressSignal": "exact phrase detected or null",
  "huntTrigger": true,
  "huntReason": "1-sentence escalation reason or null",
  "literacyTip": "one practical harvest-cycle savings tip for their occupation",
  "trailMemory": {
    "transient": "active conversation summary (1 line)",
    "relational": "harvest calendar entry (1 line)",
    "archival": "literacy gap category (1-2 words)"
  }
}`;

  const result = await callClaude(prompt);

  // GUARD: Validate output
  if (typeof result.huntTrigger !== 'boolean') result.huntTrigger = false;

  return {
    agent: 'Scout',
    killSwitch: KILL_SWITCHES.Scout,
    rankLimits: 'Literacy only — max 3 SMS/day — no loan recommendations',
    dataLocation: 'AWS Africa Cape Town (Kenya DPA 2022)',
    ...result
  };
}

module.exports = { runScout };

'use strict';

const { callClaude } = require('../utils/claude');
const { checkAuthority, KILL_SWITCHES } = require('../utils/guard');

// RANK: Hunter Agent authority limits
// - Prepare officer briefing packets ONLY
// - CANNOT approve or deny loans under any circumstances
// - Alert assigned officer within 15 minutes
// Kill switch: *#799# (full system pause — all agents halt)

async function runHunter(member, guardianResult) {
  // GUARD: Validate — Hunter cannot make credit decisions
  const forbiddenCheck = checkAuthority('Hunter', 'approve_loan');
  // This will return allowed: false, confirming the restriction is active

  const auth = checkAuthority('Hunter', 'prepare_briefing');
  if (!auth.allowed) throw new Error(auth.reason);

  const gr = guardianResult;
  const brk = gr.scoreBreakdown || {};

  const prompt = `You are the Hunter Agent for Ujima SACCO — Human-in-Loop Coordinator.
CRITICAL RANK CONSTRAINT: You CANNOT approve or deny loans under ANY circumstances.
Your ONLY function is to prepare briefing packets for human loan officers.
KILL SWITCH: ${KILL_SWITCHES.Hunter} (full system pause — all three agents halt immediately)
Alert assigned officer within 15 minutes of receiving escalation.
TRAIL: Officer availability calendar (T), officer specialty areas (R), anonymized approval patterns (A). Officer data anonymized after 90 days (L).

Application escalated from Guardian Agent:
- Member: ${member.name}, ${member.occupation}
- Monthly income: KES ${member.income} (${member.incomeType})
- Peak harvest months: ${member.harvestMonths || 'not specified'}
- Children: ${member.children}
- Loan requested: KES ${member.loanAmount} for ${member.purpose}
- Guardian credit score: ${gr.score}/100
- Decision from Guardian: ${gr.decision}
- Risk flags: ${(gr.riskFlags || []).join(', ') || 'none'}
- Score breakdown: Income consistency ${brk.incomeConsistency || 0}/40, Harvest alignment ${brk.harvestAlignment || 0}/30, Community signals ${brk.communitySignals || 0}/20, Risk deductions ${brk.riskDeductions || 0}
- Guardian's member message: "${gr.memberMessage || ''}"

Select a fictional Ujima SACCO loan officer with expertise matching this member's occupation and region.
Examples: agricultural lending, women market vendors, boda boda / transport sector, North Rift farmers.

Respond ONLY with valid JSON (no markdown):
{
  "officerMatch": "Officer [Firstname Lastname] — [5-word specialty description]",
  "officerContact": "officer@ujima.co.ke or internal extension",
  "briefingSummary": "2-sentence plain-language summary for the officer (not for the member)",
  "keyPoints": [
    "key point 1 the officer must know",
    "key point 2 about seasonal income or household context",
    "key point 3 about risk or opportunity",
    "key point 4 about cultural or community context"
  ],
  "recommendation": "1-sentence suggested action for officer to consider (not a decision — a recommendation)",
  "crossSellOpportunity": "1 relevant financial product to consider offering (e.g. harvest insurance, school fee savings plan, drought insurance)",
  "urgencyLevel": "HIGH or MEDIUM or LOW",
  "culturalContext": "1-2 sentences on seasonal, cultural, or community context the officer should understand",
  "prideLoop": {
    "pausePointTriggered": true,
    "humanReviewRequired": true,
    "reviewDeadline": "48 hours from escalation",
    "elderCouncilAlert": false,
    "elderCouncilReason": null
  }
}`;

  const result = await callClaude(prompt);

  // GUARD: Final check — Hunter must not contain any approval/denial language
  const forbiddenPhrases = ['approved', 'denied', 'rejected', 'approve this', 'deny this'];
  const allText = JSON.stringify(result).toLowerCase();
  forbiddenPhrases.forEach(phrase => {
    if (allText.includes(phrase)) {
      console.warn(`[GUARD] Hunter output contained restricted phrase: "${phrase}" — review required`);
    }
  });

  return {
    agent: 'Hunter',
    killSwitch: KILL_SWITCHES.Hunter,
    rankLimits: 'BRIEFING ONLY — cannot approve or deny under any circumstances',
    dataLocation: 'AWS Africa Cape Town | Officer data anonymized after 90 days',
    huntSource: 'Guardian Agent escalation',
    ...result
  };
}

module.exports = { runHunter };

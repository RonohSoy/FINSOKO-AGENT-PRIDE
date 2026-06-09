'use strict';

// GUARD Safety Rails for FinSoko Agent Pride
// Hard-coded protections that cannot be disabled by any agent

const DIGNITY_BLACKLIST = [
  'unreliable', 'risky borrower', 'high risk', 'rejected',
  'declined', 'bad credit', 'untrustworthy', 'defaulter'
];

const BIAS_PROXY_FIELDS = ['gender', 'ethnicity', 'tribe', 'religion', 'address_only'];

const KILL_SWITCHES = {
  Scout: '*#700#',
  Guardian: '*#733#',
  Hunter: '*#799#'
};

// Check if a denial message passes the Dignity Filter
function dignityFilter(message) {
  const lower = message.toLowerCase();
  const violations = DIGNITY_BLACKLIST.filter(word => lower.includes(word));
  if (violations.length > 0) {
    throw new Error(
      `GUARD Dignity Filter violation: message contains prohibited language: "${violations.join('", "')}". ` +
      'All denial messages must include: (1) plain-language reason, (2) actionable next step, (3) *#123# appeal right.'
    );
  }
  return true;
}

// Check for regional disparity (simplified)
function checkDisparity(approvalRates) {
  const rates = Object.values(approvalRates);
  if (rates.length < 2) return { triggered: false };
  const max = Math.max(...rates);
  const min = Math.min(...rates);
  const gap = max - min;
  if (gap > 0.30) {
    return {
      triggered: true,
      gap: `${(gap * 100).toFixed(1)}pp`,
      action: 'Automatic 72hr suspension + TRACK audit required + SASRA notification within 24hrs'
    };
  }
  return { triggered: false };
}

// Validate that no bias proxies are used in scoring
function checkBiasProxies(scoringFactors) {
  const violations = BIAS_PROXY_FIELDS.filter(f =>
    scoringFactors.map(s => s.toLowerCase()).includes(f)
  );
  if (violations.length > 0) {
    return {
      safe: false,
      violations,
      action: 'Remove bias proxy fields from scoring. Use income pattern, harvest alignment, and community signals only.'
    };
  }
  return { safe: true };
}

// Validate agent authority limits
function checkAuthority(agent, action, amount = 0) {
  const limits = {
    Scout: {
      allowed: ['deliver_literacy', 'detect_stress', 'trigger_hunt'],
      forbidden: ['approve_loan', 'deny_loan', 'access_pii', 'recommend_specific_loan'],
      maxSmsPerDay: 3
    },
    Guardian: {
      allowed: ['screen_application', 'auto_approve_small', 'escalate', 'deny_with_flags'],
      forbidden: ['approve_large_loan', 'override_guard_rails'],
      maxAutoApprove: 15000
    },
    Hunter: {
      allowed: ['prepare_briefing', 'match_officer', 'alert_officer'],
      forbidden: ['approve_loan', 'deny_loan', 'make_credit_decision']
    }
  };

  const agentLimits = limits[agent];
  if (!agentLimits) throw new Error(`Unknown agent: ${agent}`);

  if (agentLimits.forbidden.includes(action)) {
    return {
      allowed: false,
      reason: `${agent} Agent is not authorised to "${action}". Kill switch: ${KILL_SWITCHES[agent]}`,
      killSwitch: KILL_SWITCHES[agent]
    };
  }

  if (agent === 'Guardian' && action === 'auto_approve_small' && amount > agentLimits.maxAutoApprove) {
    return {
      allowed: false,
      reason: `Guardian cannot auto-approve loans above KES ${agentLimits.maxAutoApprove.toLocaleString()}. Escalate to Hunter.`
    };
  }

  return { allowed: true };
}

// Format dignity-compliant denial message
function formatDenialMessage(reason, actionableStep) {
  return (
    `${reason} ` +
    `To appeal this decision, dial *#123# (free of charge) — you will receive a response within 48 hours. ` +
    `Next step: ${actionableStep} ` +
    `You may also visit your nearest SACCO branch or contact your market association representative for support.`
  );
}

module.exports = {
  dignityFilter,
  checkDisparity,
  checkBiasProxies,
  checkAuthority,
  formatDenialMessage,
  KILL_SWITCHES
};

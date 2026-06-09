'use strict';

require('dotenv').config();
const minimist = require('minimist');
const { runScout } = require('./src/agents/scout');
const { runGuardian } = require('./src/agents/guardian');
const { runHunter } = require('./src/agents/hunter');

// ── PRIDE Loop orchestrator ──────────────────────────────
async function runPride(member) {
  console.log('\n' + '═'.repeat(60));
  console.log('  FINSOKO AGENT PRIDE — Ujima SACCO');
  console.log('  Scout → Guardian → Hunter');
  console.log('═'.repeat(60));
  console.log(`\n  Member: ${member.name} | ${member.occupation}`);
  console.log(`  Loan: KES ${Number(member.loanAmount).toLocaleString()} for ${member.purpose}`);
  console.log(`  Income: KES ${Number(member.income).toLocaleString()}/mo (${member.incomeType})`);
  console.log(`  Harvest months: ${member.harvestMonths || 'not specified'}`);
  console.log('─'.repeat(60));

  // ── STAGE 1: Scout Agent ─────────────────────────────
  console.log('\n🔍 SCOUT AGENT activating... (kill switch: *#700#)');
  let scoutResult;
  try {
    scoutResult = await runScout(member);
    console.log(`   ✓ Greeting: ${scoutResult.greeting}`);
    console.log(`   ✓ Advice: ${scoutResult.advice}`);
    console.log(`   ✓ Stress detected: ${scoutResult.stressDetected}`);
    if (scoutResult.stressSignal) console.log(`   ⚑ Stress signal: "${scoutResult.stressSignal}"`);
    console.log(`   ✓ HUNT trigger: ${scoutResult.huntTrigger}`);
  } catch (err) {
    console.error('   ✗ Scout Agent error:', err.message);
    throw err;
  }

  if (!scoutResult.huntTrigger) {
    console.log('\n✅ Literacy session complete — no loan screening needed.');
    return { stage: 'scout', scout: scoutResult };
  }

  console.log(`\n   → HUNT triggered: ${scoutResult.huntReason}`);
  console.log('─'.repeat(60));

  // ── STAGE 2: Guardian Agent ──────────────────────────
  console.log('\n🛡  GUARDIAN AGENT activating... (kill switch: *#733#)');
  let guardianResult;
  try {
    guardianResult = await runGuardian(member, scoutResult);
    const score = guardianResult.score;
    const bar = '█'.repeat(Math.round(score / 5)) + '░'.repeat(20 - Math.round(score / 5));
    console.log(`   ✓ Credit score: ${score}/100  [${bar}]`);
    console.log(`   ✓ Breakdown: Income ${guardianResult.scoreBreakdown?.incomeConsistency}/40 | Harvest ${guardianResult.scoreBreakdown?.harvestAlignment}/30 | Community ${guardianResult.scoreBreakdown?.communitySignals}/20 | Risk ${guardianResult.scoreBreakdown?.riskDeductions}`);
    console.log(`   ✓ Decision: ${guardianResult.decision}`);
    console.log(`   ✓ Reason: ${guardianResult.decisionReason}`);
    if (guardianResult.riskFlags?.length) console.log(`   ⚑ Risk flags: ${guardianResult.riskFlags.join(', ')}`);
    console.log(`   ✓ Member message: ${guardianResult.memberMessage}`);
  } catch (err) {
    console.error('   ✗ Guardian Agent error:', err.message);
    throw err;
  }

  if (guardianResult.decision === 'APPROVE') {
    console.log('\n✅ AUTO-APPROVED by Guardian Agent.');
    console.log(`   Loan: KES ${Number(member.loanAmount).toLocaleString()} | Score: ${guardianResult.score}/100`);
    return { stage: 'guardian', scout: scoutResult, guardian: guardianResult };
  }

  if (guardianResult.decision === 'DENY') {
    console.log('\n✗  APPLICATION DECLINED by Guardian Agent.');
    console.log('   Dignity Filter applied. Appeal right: *#123# (free, 48hr response)');
    return { stage: 'guardian', scout: scoutResult, guardian: guardianResult };
  }

  console.log('\n   → Escalating to Hunter Agent...');
  console.log('─'.repeat(60));

  // ── STAGE 3: Hunter Agent ────────────────────────────
  console.log('\n🏹  HUNTER AGENT activating... (kill switch: *#799#)');
  let hunterResult;
  try {
    hunterResult = await runHunter(member, guardianResult);
    console.log(`   ✓ Officer matched: ${hunterResult.officerMatch}`);
    console.log(`   ✓ Urgency: ${hunterResult.urgencyLevel}`);
    console.log(`   ✓ Summary: ${hunterResult.briefingSummary}`);
    console.log('   ✓ Key points:');
    (hunterResult.keyPoints || []).forEach(p => console.log(`      • ${p}`));
    console.log(`   ✓ Recommendation: ${hunterResult.recommendation}`);
    console.log(`   ✓ Cross-sell: ${hunterResult.crossSellOpportunity}`);
    console.log(`   ✓ Cultural context: ${hunterResult.culturalContext}`);
  } catch (err) {
    console.error('   ✗ Hunter Agent error:', err.message);
    throw err;
  }

  console.log('\n' + '═'.repeat(60));
  console.log('  PIPELINE COMPLETE — Officer briefing ready');
  console.log('  Human review deadline: 48 hours');
  console.log('  Member appeal: *#123# (free of charge)');
  console.log('  Data location: AWS Africa Cape Town (Kenya DPA 2022)');
  console.log('═'.repeat(60) + '\n');

  return {
    stage: 'complete',
    scout: scoutResult,
    guardian: guardianResult,
    hunter: hunterResult
  };
}

// ── CLI entry point ──────────────────────────────────────
async function main() {
  const argv = minimist(process.argv.slice(2));

  let member;
  if (argv.demo || Object.keys(argv).length <= 1) {
    member = require('./demo/sample_member.json');
    console.log('[Demo mode] Using sample_member.json');
  } else {
    member = {
      name:          argv.name       || 'Test Member',
      occupation:    argv.occupation || 'market_vendor',
      income:        argv.income     || 15000,
      incomeType:    argv.incomeType || 'seasonal',
      harvestMonths: argv.harvest    || 'October, November',
      children:      argv.children   || 2,
      loanAmount:    argv.loan       || 20000,
      purpose:       argv.purpose    || 'business restock',
      message:       argv.message    || 'I need a loan for my market stall.'
    };
  }

  try {
    const result = await runPride(member);
    if (argv.json) console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('\n✗ Pipeline error:', err.message);
    process.exit(1);
  }
}

main();

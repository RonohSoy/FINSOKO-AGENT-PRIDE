# FinSoko Agent Pride — Live Prototype

**Capstone Deliverable 6 | Peter Ronoh, Chief AI Officer | Ujima SACCO**

A three-agent AI ecosystem simulating the Scout → Guardian → Hunter loan processing pipeline for informal sector borrowers in Kenya and Uganda.

---

## Architecture

```
MEMBER (USSD *384#)
       │
       ▼
 ┌─────────────┐
 │ SCOUT AGENT │  Financial Literacy Coach
 │  *#700# KS  │  Detects financial stress → HUNT trigger
 └──────┬──────┘
        │ huntTrigger = true
        ▼
 ┌─────────────────┐
 │ GUARDIAN AGENT  │  Loan Triage Screener
 │   *#733# KS     │  Harvest-cycle-aware scoring (0–100)
 └────────┬────────┘
          │
    ┌─────┴──────┬──────────────┐
    ▼            ▼              ▼
 APPROVE       DENY          ESCALATE
 (≤KES 15K)  (dignity msg   (score 60–89)
             + *#123#)            │
                                  ▼
                        ┌──────────────────┐
                        │  HUNTER AGENT    │  Human-in-Loop
                        │   *#799# KS      │  Officer briefing only
                        └──────────────────┘
```

## Frameworks Implemented

| Framework | Purpose |
|---|---|
| RANK | Authority limits per agent (Scout: literacy only, Guardian: ≤KES 15K, Hunter: brief only) |
| TRAIL | Memory architecture (Transient → Relational → Archival → Land rights) |
| HUNT | Handoff triggers between agents with enriched context passing |
| GUARD | Safety rails — Dignity Filter, kill switches, bias detection |
| CYCLE | Sunday 2AM EAT self-improvement loop with human validation gate |
| PRIDE | Human-in-loop pause points, *#123# appeal rights, Elders Council |

---

## Quick Start

### Option A: n8n (Recommended — visual, no-code)

1. Open your n8n instance (cloud: [n8n.io](https://n8n.io) or self-hosted)
2. Go to **Workflows → Import from File**
3. Upload `workflows/finsoko_n8n_workflow.json`
4. Set environment variable: `ANTHROPIC_API_KEY=your_key_here`
5. Activate the workflow
6. Test with the sample payload below

### Option B: Node.js (local CLI)

```bash
# 1. Clone repo
git clone https://github.com/your-username/finsoko-agent-pride.git
cd finsoko-agent-pride

# 2. Install dependencies
npm install

# 3. Set API key
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY

# 4. Run demo
npm run demo

# 5. Run with custom member data
npm run agent -- --name "Grace Atieno" --occupation "maize_farmer" --income 22000 --loan 28000
```

---

## n8n Test Payload

Send a POST request to your webhook URL:

```json
{
  "name": "Grace Atieno",
  "occupation": "Maize Farmer",
  "income": 22000,
  "incomeType": "seasonal",
  "harvestMonths": "October, November, March, April",
  "children": 3,
  "loanAmount": 28000,
  "purpose": "school fees and farm inputs",
  "message": "Habari. Ninahitaji mkopo wa haraka. Watoto wangu wanaanza shule wiki ijayo na sina pesa za ada. Nimekuwa mkulima wa mahindi kwa miaka 10 na nalipa mikopo yangu yote."
}
```

---

## Kill Switches

| Agent | Kill Switch | Effect |
|---|---|---|
| Scout | `*#700#` | Halts all Scout SMS immediately |
| Guardian | `*#733#` | Suspends triage, instant human takeover |
| Hunter | `*#799#` | Full system pause — all agents halt, SASRA notified |

---

## GUARD Safety Rails

- Hard block: gender, ethnicity, address as scoring proxies
- Dignity Filter: rejects denial messages containing "unreliable", "risky", "rejected"
- Max auto-approve: KES 15,000
- Disparity trigger: sub-county approval rate drops >30% → automatic TRACK audit
- Red team test: female shea butter trader, Busia County (run before every deployment)

---

## Data Sovereignty

All data under African governance per Kenya DPA 2022:
- Storage: AWS Africa (Cape Town) `af-south-1`
- Cross-border transfer: BLOCKED (DPA 2022 Section 25)
- Scout data: 180-day auto-delete
- Loan records: 7-year retention (Kenya Banking Act)
- Member deletion rights: 30 days (DPA 2022 Section 26)

---

## Environment Variables

```env
ANTHROPIC_API_KEY=your_anthropic_api_key_here
NODE_ENV=development
PORT=3000
```

---

## Project Structure

```
finsoko-agent-pride/
├── README.md
├── package.json
├── .env.example
├── .gitignore
├── index.js                    # CLI runner
├── src/
│   ├── agents/
│   │   ├── scout.js            # Scout Agent
│   │   ├── guardian.js         # Guardian Agent
│   │   └── hunter.js           # Hunter Agent
│   └── utils/
│       ├── claude.js           # Anthropic API client
│       └── guard.js            # GUARD safety rails
├── workflows/
│   └── finsoko_n8n_workflow.json  # n8n import file
├── demo/
│   └── sample_member.json      # Test data
└── .github/
    └── workflows/
        └── test.yml            # GitHub Actions CI
```

---

## Evaluation Rubric Coverage

| Criterion | Implementation |
|---|---|
| Savannah Precision | AIM/MAP prompts in each agent with harvest-cycle grounding |
| Tsavo Fluency | 4D Delegation (human >50K, AI ≤15K, collaborative briefing) |
| Ethical Architecture | ETHOS/TRACK/OASIS/PRIDE/HORIZON in each agent's logic |
| Agent Orchestration | RANK/TRAIL/HUNT/GUARD/CYCLE fully implemented |
| African Context | Matooke/maize harvest cycles, DPA 2022, SASRA, chama recognition |
| Impact Focus | 37% female vendor approval target, <3% default, 100% data sovereignty |

---

## License

MIT — built for Ujima SACCO, North Rift Kenya. Safari njema.

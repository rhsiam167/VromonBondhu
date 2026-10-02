# Where is the AI in Vromon Bondhu?

*A plain-language guide for the lab viva.*

**Short answer:** the AI is the **planning engine** in `backend/app/services/planner/`.
It uses **classical AI**, the kind of AI that makes decisions with explicit rules, scores and
search, **not machine learning**. It combines four techniques:

1. **Heuristic scoring:** rates every place from 0 to 1 for this particular traveller.
2. **CSP-style constraint checking:** makes sure a plan obeys the hard rules (budget, time, …).
3. **Greedy local-search repair:** if a rule is broken, changes the plan one small step at a time until it is fixed.
4. **Greedy scheduling:** builds the days, grouping nearby places, and orders each day's stops.

You can watch all four working, with no UI, by running this from the `backend` folder:

```powershell
.\.venv\Scripts\python.exe -m app.demo_plan
```

---

## 1. Heuristic scoring (`recommendation.py`)

**Goal:** decide which places suit *this* traveller best.

First, the ranked interests become **weights** (`preferences.py`):

> **Wᵢ = (N − Rankᵢ + 1) / N**, where N is the number of interests chosen.

With four interests ranked Adventure, Photography, Food, Beach: Adventure = 1.00,
Photography = 0.75, Food = 0.50, Beach = 0.25 (sum = 2.5).

Then every place gets a **score**:

> **Score = 0.40·InterestMatch + 0.15·BudgetMatch + 0.15·TimeMatch + 0.15·DistanceScore + 0.15·PreferenceMatch**

Each part is between 0 and 1, so the score is too:

| Component | Meaning |
|---|---|
| **InterestMatch** | Sum of the weights of the interests the place matches ÷ sum of all weights |
| **BudgetMatch** | Does the visit cost (entry fee × travellers + round trip from the base) fit its share of the budget? Share = budget × 15% ÷ number of planned visits. 1 if it fits, otherwise share ÷ cost |
| **TimeMatch** | Does the visit (plus travel) fit the free time slot? min(1, free minutes ÷ minutes needed), halved if the place's best time doesn't suit that part of the day |
| **DistanceScore** | How close it is to the base (or the previous stop), min-max normalised: 1 − (d − d_min) ÷ (d_max − d_min) |
| **PreferenceMatch** | Average of the *crowd fit* (the place's crowd level against the traveller's crowd preference) and the *pace fit* (visit length against the pace's typical slot) |

The weights 0.40 / 0.15 / 0.15 / 0.15 / 0.15 are **proposed defaults** in `config.py`:
configurable, **not tuned** on data.

### Worked example: Kolatoli Beach Point

Request: Dhaka → Cox's Bazar, 4 days, 2 travellers, ৳15,000, packed pace,
interests Adventure > Photography > Food > Beach.

Kolatoli Beach Point: interests *beach, photography*; entry fee ৳0; 1.5 hours; medium crowds.

| Component | Working | Value |
|---|---|---|
| InterestMatch | (Beach 0.25 + Photography 0.75) ÷ 2.5 | **0.400** |
| BudgetMatch | Share = 15,000 × 0.15 ÷ (4 visits/day × 4 days) = ৳140.6. Cost = ৳0 × 2 + 2 × ৳60 (easy-bike each way) = ৳120 ≤ ৳140.6 | **1.000** |
| TimeMatch | Needs 90 min + 10 min travel = 100 min; packed slot = 150 min → min(1, 150 ÷ 100) | **1.000** |
| DistanceScore | 2.88 km from the base; nearest place 0.82 km, farthest 32.17 km → 1 − (2.88 − 0.82) ÷ (32.17 − 0.82) | **0.934** |
| PreferenceMatch | Crowd: medium suits "balanced" = 1.0; pace: 2.5 h slot ÷ 1.5 h ≥ 1 → 1.0; average | **1.000** |

**Score = 0.40×0.400 + 0.15×1.000 + 0.15×1.000 + 0.15×0.934 + 0.15×1.000 = 0.160 + 0.150 + 0.150 + 0.140 + 0.150 = 0.750**

That makes it the #1 candidate. Paragliding matches Adventure (the top interest) better,
with InterestMatch 0.70, but its ৳3,500 fee gives BudgetMatch 0.02, so its score is only 0.693.

---

## 2. CSP-style constraint checking (`constraints.py`)

A **constraint satisfaction problem (CSP)** is described by variables and rules the
solution must obey. The planner treats trip planning in that style:

**Hard constraints** (the plan must satisfy them):

1. **Budget cap:** total ≤ allowed maximum (strict: the budget; flexible: budget × 1.30)
2. **Trip duration:** one itinerary day per trip day; nights ≤ days
3. **No overlapping activities:** each stop starts after the previous one ends
4. **Travel time fits the day:** every activity, including travel to it, ends by 9:00 PM (1:30 PM on the last day)
5. **Max activities per day:** set by the pace (relaxed 2, balanced 3, packed 4; fewer on travel days)
6. **Chosen transport exists:** e.g. no flight between two cities without airports

**Soft preferences** (interests, crowds, pace) are *not* rules. They are handled by the scoring.

`validate_plan()` returns a list of violations in plain English, for example
"The plan costs ৳64,113, which is ৳49,113 over the allowed maximum of ৳15,000."

*Be precise in the viva:* this is **CSP-style constraint handling**, not a formal CSP
solver. There is no backtracking search over variable domains. Instead, broken constraints
are fixed by the repair step below.

---

## 3. Greedy local-search repair (`repair.py`)

**Local search** improves a complete solution by making small changes ("moves") to it.
**Greedy** means it takes the first move that helps, without looking further ahead.

When the budget constraint is broken, the loop does this:

```
while the plan costs more than allowed:
    try the moves in this fixed order, and take the FIRST one that lowers the cost:
        1. cheaper transport — ONLY between the user's selected intercity modes
        2. cheaper accommodation tier
        3. cheaper food tier
        4. remove an activity, lowest-ranked interest first (never the top interest)
        5. replace an activity with a cheaper one
        6. last resort: remove any activity that still costs money
    recompute the cost and re-check the constraints
    if no move helps: stop
```

**Transport rule (in `generator.py`):**

1. The candidates are the user's selected intercity modes that run on this route (Train
   needs a railway station at both ends, Flight an airport at both ends).
2. The plan starts with the cheapest candidate (the fastest on a *packed* trip), and the
   repair above only moves between candidates. So a selected mode that fits is always used.
3. Only if **no** selected mode can fit (even after every other move), or none runs on this
   route, is the plan rebuilt with the cheapest mode overall and repaired again. This is the
   only way a non-selected mode is used. It is recorded in `adjustmentsMade` ("Switched the
   main journey from your selected Bus/Flight to Train because it was the only way to fit
   your budget.") and flagged with `transport.outbound.selected = false`. The website then
   shows a gray "Not in your selected preferences" tag.
4. In that case the **journey back** is decided on its own. If a selected mode can still fit
   for the return, it is used, so the two legs can differ.

If even the fallback can't fit, the answer is "infeasible".

### Worked example (from `python -m app.demo_plan`)

Same request as above, with only **Flight** chosen. The first plan (flight, mid-range hotel
and food) costs **৳64,113** against a cap of ৳15,000. With Flight kept, every other move
brings it down only to ৳32,970, which is still over the cap. So the plan is rebuilt with Train
(the cheapest mode for this route) and repaired again:

| Step | Move | Cost before → after |
|---|---|---|
| 1 | Mid-range → budget hotel | ৳42,914 → ৳28,109 |
| 2 | Mid-range → budget food | ৳28,109 → ৳23,909 |
| 3–8 | Remove places that match none or lower-ranked interests | ৳23,909 → ৳22,491 |
| 9 | Replace Paragliding at Darianagar with the cheaper Kolatoli Beach Point | ৳22,491 → ৳15,078 |
| 10 | Remove Kolatoli Beach Point | ৳15,078 → **৳14,952** ✓ |

The plan now fits, so the loop stops. Because the pace is *packed*, the scheduler then
refills the empty slots with free places that still fit the budget, giving a final cost of
**৳14,994**. (Places put back this way have their "Removed" message dropped.) The user
sees first: "Switched the main journey from your selected Flight to Train because it was the
only way to fit your budget."

If the loop runs out of moves while still over the cap, the answer is **infeasible**, with
`minimumCost` (the cheapest plan found) and `shortfall`. Example: Dhaka → Sundarbans,
3 travellers, ৳5,000 strict → minimum ৳16,380, shortfall ৳11,380.

**Flexible budgets:** first try to fit the budget with moves 1–5 while keeping the top
interest's places. Only if that is impossible may the plan go over, by as little as possible
and never above budget × 1.30.

---

## 4. Greedy scheduling (`scheduler.py`, `ordering.py`)

* **Building days:** for each open slot, every unused place is re-scored *relative to the
  previous stop* and the time left in the day, and the best one that still fits is added.
  Because distance to the previous stop is part of the score, nearby places end up on the
  same day.
* **Ordering a day:** stops are grouped by best time of day (morning → afternoon → any →
  evening). Within each group the **nearest-neighbour** rule goes to the closest unvisited
  stop next. It is a fast greedy heuristic; it does *not* guarantee the shortest route.
* **Timing:** departure, travel time for every leg, lunch around 12:30, evening places
  after 5:30 PM, dinner near the hotel, check-out and the journey home.

---

## AI vs business logic vs data processing

| Part | Kind | Why |
|---|---|---|
| Scoring and ranking places | **AI** (heuristic evaluation) | Judges which options are best for a goal |
| Constraint checking | **AI** (CSP-style reasoning) | Decides whether a candidate solution is acceptable |
| Repair loop | **AI** (greedy local search) | Searches the space of plans for one that satisfies the constraints |
| Day building and ordering | **AI** (greedy heuristic search) | Constructs a good arrangement without trying every possibility |
| Interest weights formula | Business logic | A fixed formula from the requirements |
| Cost totals, budget rules (strict / 30% flexible) | Business logic | Arithmetic and policy |
| Distances, fares, travel times | Data processing | Haversine distance × 1.35 and sample fare tables |
| Accounts, saving trips, the API | Software engineering | Not AI |

---

## Honest limits (say these in the viva)

* **Sample data.** Hotels, restaurants, attractions, coordinates and prices are sample
  estimates marked `source = "sample-estimate"`, not verified data.
* **No live prices.** No fares, schedules or hotel rates are fetched from anywhere.
* **The weights are not tuned.** 0.40 / 0.15 / 0.15 / 0.15 / 0.15 and the other values in
  `config.py` are hand-picked defaults, not learned from data or validated with users.
* **This is not machine learning:** nothing is trained, and it is not deep learning,
  reinforcement learning, or a large language model.
* **"Lowest possible cost" is not a proven minimum.** It is the cheapest plan the greedy
  search found. A different search could sometimes find a cheaper plan.
* **Greedy methods can miss the best answer.** The repair takes the first helpful move, and
  nearest-neighbour ordering can give a slightly longer route than the best one.
* **A\* is not used**, and there is no formal CSP solver (no backtracking over domains).
* **Distances are estimates:** straight-line distance × 1.35, not real road routing.

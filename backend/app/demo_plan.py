"""
DEMO — watch the planning engine work, with no user interface.

    python -m app.demo_plan                    (the default sample request)
    python -m app.demo_plan --budget 12000     (try a tighter budget)
    python -m app.demo_plan --help             (all options)

It prints, step by step:
  1. every candidate place with its five component scores and final score
  2. each hard-constraint check on the first plan
  3. each repair step, with the cost before and after
  4. the final constraint checks and the resulting itinerary

No database is needed: the data comes from app/seed/*.json.
All prices are sample estimates.
"""
import argparse
import sys

from app.services.planner import PlannerInputError, generate_trip, load_catalog_from_seed
from app.services.planner.config import SCORE_WEIGHTS
from app.services.planner.constraints import constraint_checks
from app.services.planner.recommendation import COMPONENTS
from app.services.planner.util import format_taka

SHORT = {"interestMatch": "Interest", "budgetMatch": "Budget", "timeMatch": "Time", "distanceScore": "Distance", "preferenceMatch": "Prefer"}


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Show the Vromon Bondhu planner working step by step.")
    p.add_argument("--from", dest="origin", default="Dhaka")
    p.add_argument("--to", dest="destination", default="Cox's Bazar")
    p.add_argument("--days", type=int, default=4)
    p.add_argument("--travelers", type=int, default=2)
    p.add_argument("--budget", type=int, default=15000)
    p.add_argument("--mode", choices=["strict", "flexible"], default="strict")
    p.add_argument("--style", choices=["relaxed", "balanced", "packed"], default="packed")
    p.add_argument("--interests", default="adventure,photography,food,beach", help="comma-separated, most important first")
    p.add_argument("--transport", default="flight", help="comma-separated: bus,train,car,flight,local")
    p.add_argument("--stay", choices=["budget", "mid-range", "premium"], default="mid-range")
    return p.parse_args()


def line(char: str = "─") -> None:
    print(char * 100)


def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")  # so ৳ prints correctly on Windows
    args = parse_args()
    inputs = {
        "from": args.origin,
        "destination": args.destination,
        "days": args.days,
        "nights": max(0, args.days - 1),
        "travelers": args.travelers,
        "startDate": "",
        "budget": args.budget,
        "budgetMode": args.mode,
        "budgetCovers": ["transportation", "accommodation", "food", "activities"],
        "interests": [i.strip() for i in args.interests.split(",") if i.strip()],
        "travelStyle": args.style,
        "transport": [t.strip() for t in args.transport.split(",") if t.strip()],
        "food": [],
        "accommodation": args.stay,
        "crowd": "balanced",
        "notes": "",
    }

    line("═")
    print("VROMON BONDHU — PLANNING ENGINE DEMO (classical AI: heuristic scoring, CSP-style constraints, greedy repair)")
    print(
        f"Request: {inputs['from']} → {inputs['destination']}, {inputs['days']} days, {inputs['travelers']} travelers, "
        f"{format_taka(inputs['budget'])} {inputs['budgetMode']}, {inputs['travelStyle']} pace"
    )
    print(f"Interests (ranked): {', '.join(inputs['interests'])}   Transport picked: {', '.join(inputs['transport']) or 'none'}")
    line("═")

    trace: dict = {}
    try:
        result = generate_trip(inputs, load_catalog_from_seed(), trace)
    except PlannerInputError as error:
        print(f"Input problem ({error.field}): {error.message}")
        return

    # 1. Ranked candidates
    weights = "  ".join(f"{SHORT[c]}×{SCORE_WEIGHTS[c]:.2f}" for c in COMPONENTS)
    print(f"\n1) RANKED CANDIDATES — Score = weighted sum of five 0–1 components ({weights})\n")
    print(f"{'#':>2}  {'Place':<36}{'Interest':>9}{'Budget':>8}{'Time':>7}{'Distance':>10}{'Prefer':>8}{'SCORE':>8}")
    for n, c in enumerate(trace["candidates"], start=1):
        comp = c["components"]
        print(
            f"{n:>2}  {c['attraction']['name'][:35]:<36}"
            + "".join(f"{comp[name]:>{w}.2f}" for name, w in zip(COMPONENTS, [9, 8, 7, 10, 8]))
            + f"{c['score']:>8.3f}"
        )
    if trace["modeNote"]:
        print(f"\nTransport note: {trace['modeNote']}")

    # 2. Constraint checks on the first plan
    print(f"\n2) HARD-CONSTRAINT CHECKS ON THE FIRST PLAN — cost {format_taka(trace['initialCost'])}, allowed maximum {format_taka(trace['allowedMaximum'])}\n")
    for check in constraint_checks(trace["initialViolations"]):
        print(f"   [{'PASS' if check['passed'] else 'FAIL'}] {check['name']}")
    for v in trace["initialViolations"]:
        print(f"          → {v['message']}")

    # 3. Repair steps
    print(f"\n3) REPAIR (greedy local search) — {len(trace['repairSteps'])} step(s)\n")
    rejected = trace["rejectedSelectedAttempt"]
    if rejected:
        print(
            f"   With only the selected transport ({rejected['mode']}), the best plan found still cost {format_taka(rejected['cost'])}\n"
            f"   — over the allowed maximum — so, as a last resort, the plan was rebuilt with the cheapest mode\n"
            f"   for this route and repaired again:\n"
        )
    if not trace["repairSteps"]:
        print("   No repair needed.")
    for n, step in enumerate(trace["repairSteps"], start=1):
        undone = "   (put back later)" if step["undone"] else ""
        print(f"   {n:>2}. [{step['lever']:<13}] {format_taka(step['costBefore']):>9} → {format_taka(step['costAfter']):>9}   {step['message']}{undone}")
    if trace["gapFills"]:
        print(
            f"\n   Packed pace: the budget now has room, so empty slots were filled with {', '.join(trace['gapFills'])}."
            "\n   Steps marked 'put back' are therefore not shown to the user."
        )

    # 4. Final result
    print(f"\n4) FINAL CONSTRAINT CHECKS — cost {format_taka(trace['finalCost'])}\n")
    for check in constraint_checks(trace["finalViolations"]):
        print(f"   [{'PASS' if check['passed'] else 'FAIL'}] {check['name']}")

    line()
    report = result["budgetReport"]
    if result["status"] == "infeasible":
        print(
            f"RESULT: INFEASIBLE — the cheapest plan found costs {format_taka(report['minimumCost'])}, "
            f"{format_taka(report['overLimit'])} over the allowed maximum of {format_taka(report['allowedMaximum'])}."
        )
    else:
        trip = result["trip"]
        print(f"RESULT: OK — {trip['title']}, total {format_taka(report['totalCost'])} (budget {format_taka(report['budget'])})")
        print(f"Main journey: {trip['transport']['outbound']['label']}, {format_taka(trip['transport']['outbound']['groupFare'])} each way for the group")
        print("Messages shown to the user:")
        for message in result["adjustmentsMade"]:
            print(f"   • {message}")
        for day in trip["itinerary"]:
            print(f"   Day {day['day']}: {day['title']}  ({format_taka(day['estimatedCost'])})")
    line("═")


if __name__ == "__main__":
    main()

"""
THE PLANNING ENGINE (classical AI — no machine learning).

One module per technique, all pure Python (no FastAPI, no database):

  preferences.py     interest weights  W_i = (N − Rank_i + 1) / N
  recommendation.py  heuristic scoring of places (weighted sum of 5 components)
  constraints.py     CSP-style hard-constraint checking
  budget.py          the cost breakdown, built from the itinerary's own legs
  repair.py          greedy local-search repair when the budget is broken
  scheduler.py       day building and minute-by-minute scheduling
  ordering.py        nearest-neighbour ordering of a day's stops
  transport.py       distances, travel times and sample fares
  generator.py       the pipeline that ties it all together

Use it like this:
    from app.services.planner import generate_trip, load_catalog_from_seed
    result = generate_trip(inputs, load_catalog_from_seed())
"""
from app.services.planner.catalog import Catalog, load_catalog_from_seed
from app.services.planner.errors import PlannerInputError
from app.services.planner.generator import generate_trip

__all__ = ["Catalog", "PlannerInputError", "generate_trip", "load_catalog_from_seed"]

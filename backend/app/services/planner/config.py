"""
PLANNER CONFIGURATION — SAMPLE ESTIMATES AND PROPOSED DEFAULTS
==============================================================
Every number the planner uses lives in this one file.

* Costs, fares, speeds: copied from the frontend's src/services/costConfig.js
  so both sides give the same numbers. They are SAMPLE ESTIMATES for
  demonstration — not live prices — and must be reviewed before being shown
  to anyone as real prices.
* SCORE_WEIGHTS and the other scoring values: PROPOSED DEFAULTS,
  CONFIGURABLE, NOT TUNED. They were chosen by hand to be sensible; they were
  not learned from data.

This is classical AI and business logic (heuristic scoring, constraint
checking, greedy search). No machine learning is involved.
"""

# ============================== Budget rules ==============================

STRICT_TOLERANCE = 0.0  # strict: total must be <= budget, no exceptions
FLEXIBLE_LIMIT = 0.30  # flexible: total may reach budget × 1.30 (proposed value, configurable)

# ======================== Intercity transportation ========================

ROAD_WINDING_FACTOR = 1.35  # roads are longer than a straight line

INTERCITY_MODES = {
    # bus / train: fare PER PERSON = baseFare + farePerKm × road km
    "bus": {"label": "Bus", "speedKmh": 40, "baseFare": 100, "farePerKm": 1.8},
    "train": {"label": "Train", "speedKmh": 45, "baseFare": 50, "farePerKm": 1.4},
    # car: hired car with driver, priced PER VEHICLE; vehicles = ceil(travelers / capacity)
    "car": {"label": "Car", "speedKmh": 50, "baseFare": 1500, "farePerKm": 15, "capacity": 4},
    # flight: per person = baseFare + farePerKm × straight-line km; + airport time
    "flight": {"label": "Flight", "cruiseSpeedKmh": 400, "airportMinutes": 120, "baseFare": 3000, "farePerKm": 6},
}

# Well-known routes: used instead of the formula. Key = the two ids sorted and joined by "|".
ROUTE_OVERRIDES = {
    "coxs-bazar|dhaka": {
        "bus": {"durationMinutes": 600, "farePerPerson": 1000},
        "train": {"durationMinutes": 540, "farePerPerson": 700},
        "flight": {"durationMinutes": 185, "farePerPerson": 5500},
    },
    "dhaka|sylhet": {
        "bus": {"durationMinutes": 360, "farePerPerson": 750},
        "train": {"durationMinutes": 420, "farePerPerson": 400},
        "flight": {"durationMinutes": 165, "farePerPerson": 4500},
    },
    "chattogram|dhaka": {
        "bus": {"durationMinutes": 360, "farePerPerson": 700},
        "train": {"durationMinutes": 330, "farePerPerson": 450},
        "flight": {"durationMinutes": 165, "farePerPerson": 4500},
    },
    "dhaka|sajek-valley": {"bus": {"durationMinutes": 660, "farePerPerson": 1500}},
    "dhaka|sundarbans": {"bus": {"durationMinutes": 330, "farePerPerson": 650}},
}

FARE_ROUNDING = 10  # fares are rounded to the nearest 10 taka
INTERCITY_MODE_IDS = ["bus", "train", "car", "flight"]

# ============================ Local transport ============================

# Per vehicle. A ride costs max(typical fare per ride at the destination, farePerKm × km).
LOCAL_MODES = {
    "walk": {"label": "Walking", "speedKmh": 4.5, "capacity": float("inf"), "farePerKm": 0, "maxKm": 1.5},
    "rickshaw": {"label": "Rickshaw", "speedKmh": 10, "capacity": 2, "farePerKm": 25, "maxKm": 4},
    "battery-van": {"label": "Battery auto / easy-bike", "speedKmh": 15, "capacity": 6, "farePerKm": 12, "maxKm": 10},
    "cng": {"label": "CNG auto-rickshaw", "speedKmh": 25, "capacity": 3, "farePerKm": 20, "maxKm": 80},
    "jeep": {"label": "Jeep (chander gari)", "speedKmh": 22, "capacity": 10, "farePerKm": 70, "maxKm": 120},
    "boat": {"label": "Boat / launch", "speedKmh": 15, "capacity": 12, "farePerKm": 60, "maxKm": 150},
}
WALKING_MAX_KM = 1.5  # without "Local Transport" selected, legs up to this are walked
SAME_PLACE_KM = 0.3  # stops closer than this count as the same place (no travel)

# ============================== Accommodation ==============================

TRAVELERS_PER_ROOM = 2
TIER_ORDER = ["budget", "mid-range", "premium"]
HOTEL_PRICE_PER_ROOM_PER_NIGHT = {"budget": 2000, "mid-range": 5000, "premium": 10000}  # fallback only

# ================================== Food ==================================

FOOD_COST_PER_PERSON_PER_DAY = {"budget": 500, "mid-range": 1000, "premium": 2000}
MEAL_SHARE = {"breakfast": 0.2, "lunch": 0.35, "dinner": 0.45}

# ============================== Miscellaneous ==============================

MISC_PERCENT = 0.05

# ================================ Scheduling ================================

DAY_START = 8 * 60  # minutes after midnight
DAY_END = 21 * 60  # activities must finish by 9:00 PM
LAST_DAY_END = 13 * 60 + 30  # on the last day, activities end in time to check out
LUNCH_TIME = 12 * 60 + 30
EVENING_START = 17 * 60 + 30
DINNER_TIME = 19 * 60 + 30
TIME_ORDER = {"morning": 0, "afternoon": 1, "any": 2, "evening": 3}

# ======================= Recommendation score weights =======================
# Score = w1*InterestMatch + w2*BudgetMatch + w3*TimeMatch + w4*DistanceScore + w5*PreferenceMatch
# PROPOSED DEFAULTS, CONFIGURABLE, NOT TUNED. They add up to 1.0, so a score is between 0 and 1.
SCORE_WEIGHTS = {
    "interestMatch": 0.40,
    "budgetMatch": 0.15,
    "timeMatch": 0.15,
    "distanceScore": 0.15,
    "preferenceMatch": 0.15,
}

# BudgetMatch: the share of the total budget expected to go on activities
# (entry fees + getting there), split evenly across the planned visits. Proposed default.
ACTIVITY_BUDGET_SHARE = 0.15

# PreferenceMatch: how well a place's crowd level suits the crowd preference (0–1). Proposed defaults.
CROWD_FIT = {
    "avoid": {"low": 1.0, "medium": 0.6, "high": 0.2},
    "balanced": {"low": 0.9, "medium": 1.0, "high": 0.8},
    "popular-ok": {"low": 0.8, "medium": 0.9, "high": 1.0},
}

# TimeMatch and PreferenceMatch: the typical free slot (hours) for one visit at each pace. Proposed defaults.
TYPICAL_SLOT_HOURS = {"relaxed": 4.0, "balanced": 3.0, "packed": 2.5}

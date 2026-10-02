"""`python -m app.seed` — load the reference data into the database (safe to run again)."""
from app.database import SessionLocal
from app.seed import load_reference_data


def main() -> None:
    with SessionLocal() as db:
        counts = load_reference_data(db)
    for table, count in counts.items():
        print(f"  {table:<15} {count:>3} rows")
    print("Seed complete (prices are sample estimates).")


if __name__ == "__main__":
    main()

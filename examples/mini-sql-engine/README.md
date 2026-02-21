# Mini SQL Engine from Scratch

Build a SQL-like query engine over CSV files using pure Python.

## Objective
Implement a small analytical SQL runtime without using `sqlite`, `pandas`, or external libraries.

## Required Features
1. Data source:
- Load tables from a `data/` directory where each `*.csv` file is a table.
- Infer basic column types (`int`, `float`, `string`, `bool`) with null handling.

2. SQL subset:
- `SELECT <columns>`
- `FROM <table>`
- `WHERE` with `=`, `!=`, `<`, `<=`, `>`, `>=`, `AND`, `OR`, parentheses
- `ORDER BY <column> [ASC|DESC]`
- `LIMIT <n>`
- Aggregations: `COUNT`, `SUM`, `AVG`, `MIN`, `MAX`
- `GROUP BY <columns>`
- One `INNER JOIN` per query (`tableA.col = tableB.col`)

3. Query execution:
- Parse SQL into an AST.
- Build a deterministic execution pipeline (scan -> filter -> join -> group -> sort -> project -> limit).
- Return output as both pretty table and JSON.

## CLI
- `python mini_sql.py --query "SELECT ..."`
- `python mini_sql.py --file query.sql`
- Optional: `--format table|json`

## Constraints
- Python standard library only.
- Do not shell out to existing DB engines.
- The engine must not crash on malformed queries; return readable parse/runtime errors.

## Output Files
- `mini_sql.py`
- `README_IMPLEMENTATION.md` (brief architecture notes)
- `examples.sql` (at least 8 representative queries)

## Acceptance Criteria
- Handles at least 50k rows across multiple tables within reasonable time.
- Grouping + aggregation + ordering produce stable deterministic output.
- Type coercion and null semantics are documented and consistently applied.
- Invalid queries fail with clear error messages (line/position if possible).

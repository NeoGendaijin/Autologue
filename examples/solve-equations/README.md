# Numerical Methods Challenge

Write a Python program that solves multiple algebra and calculus tasks with clear derivations.

## Objective
Implement solver utilities using only the Python standard library.

## Tasks
1. Quadratic equation:
- Solve `2x^2 + 5x - 3 = 0`.
- Return both exact-form details (discriminant, formula steps) and numeric roots.

2. Linear system (3x3):
- Solve:
  - `2x + y - z = 8`
  - `-3x - y + 2z = -11`
  - `-2x + y + 2z = -3`
- Implement Gaussian elimination with partial pivoting.
- Print intermediate row operations.

3. Symbolic derivative evaluation (manual rules, no CAS):
- For `f(x) = x^4 - 4x^3 + 7x - 2`, derive `f'(x)` in code (do not hardcode final number only).
- Evaluate `f'(3)`.

4. Root finding:
- Use Newton-Raphson to find a root of `g(x) = x^3 - x - 2`.
- Start from `x0 = 1.5`.
- Stop when `|x_{n+1} - x_n| < 1e-8` or after 100 iterations.
- Print iteration log.

5. Numerical integration:
- Approximate integral of `h(x) = sin(x) + x^2` on `[0, 2]`.
- Implement Simpson's rule with configurable `n` (must be even).
- Compare `n=10`, `n=100`, `n=1000`.

## Program Behavior
- Single entry file: `solve.py`.
- Provide CLI flags:
  - `--task all|quadratic|linear|derivative|newton|integral`
  - `--json` for machine-readable output
- Default behavior: run all tasks and print a readable report.

## Constraints
- Python standard library only.
- No `numpy`, no `sympy`.
- Include docstrings and basic input validation.

## Acceptance Criteria
- Linear solver handles zero-pivot cases via row swaps.
- Newton method converges to correct root region.
- Simpson implementation rejects odd `n`.
- Text output is readable and structured.
- `--json` output is valid JSON.

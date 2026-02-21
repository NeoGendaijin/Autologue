# Shift Scheduler Optimizer

Build a constraint-based shift scheduling solver with fairness scoring.

## Objective
Generate weekly staff schedules while satisfying hard constraints and optimizing soft preferences.

## Input Model
- `input.json` containing:
  - employees
  - skills
  - availability windows
  - min/max weekly hours
  - shift templates
  - required staffing per shift
  - employee preferences

## Required Solver Features
1. Hard constraints:
- No employee assigned outside availability.
- Skill requirements must be met per shift.
- Respect max weekly hours.
- Minimum rest gap between consecutive shifts.
- No overlapping assignments.

2. Soft constraints (optimize score):
- Preferred shift types.
- Fair distribution of weekend/night shifts.
- Minimize fragmented schedules.
- Minimize understaffing penalty if perfect schedule impossible.

3. Algorithm:
- Backtracking or branch-and-bound with heuristics.
- Use pruning and ordering heuristics (most constrained first, etc.).
- If no perfect solution, produce best feasible schedule with score explanation.

## CLI
- `python schedule.py --input input.json --output schedule.json`
- Optional:
  - `--max-seconds`
  - `--seed`
  - `--verbose`

## Output
- `schedule.json` with assignments and summary metrics.
- `report.md` with:
  - unsatisfied constraints (if any)
  - fairness metrics
  - optimization score breakdown

## Constraints
- Python standard library only.
- No OR-Tools or external optimization libraries.

## Acceptance Criteria
- Finds valid schedule for provided normal workload case.
- For overloaded case, returns best-effort plan plus clear penalties.
- Re-running with same seed yields deterministic output.
- Runtime stays practical for 20 employees x 7 days x 3 shifts/day.

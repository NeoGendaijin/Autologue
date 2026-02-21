# Weather Dashboard Advanced

Build a responsive weather dashboard with current conditions, forecast, caching, and graceful error handling.

## Objective
Create a front-end app that is visually clean and technically robust.

## Functional Requirements
1. Cities and data:
- Show weather for Tokyo, New York, and London.
- For each city, display:
  - current temperature
  - feels-like temperature
  - weather condition text
  - humidity
  - wind speed
  - local time

2. Forecast:
- Show next 24 hours in 3-hour intervals (8 points).
- Render a mini line chart (Canvas) of temperature trend per city.

3. Units and interactions:
- Global toggle between Celsius and Fahrenheit.
- Search box to temporarily add one extra city card.
- Refresh button with visible loading state.

4. Resilience:
- Cache last successful payload in `localStorage`.
- If API fails, show cached data with a stale-data warning.
- Show clear empty/error/loading UI states.

## Technical Constraints
- Use plain HTML/CSS/JS (no frameworks).
- Use a free public weather API (for example Open-Meteo).
- No external chart library; draw chart manually on Canvas.
- Keep code modular in `app.js` (separate fetch, transform, render).

## Output Files
- `index.html`
- `style.css`
- `app.js`

## Acceptance Criteria
- Layout works on 360px mobile width and desktop.
- Unit toggle updates all temperatures consistently.
- Charts render for every city without console errors.
- Dashboard still shows useful data when network request fails (via cache).
- Each city card updates independently without blocking others.

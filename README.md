# Mind2Muscle Meal Planner

A browser-based nutrition and meal planning app with an Arabic (RTL) interface. Build a food library, compose meal templates, schedule your week, track daily intake, monitor progress, and generate grocery lists — all stored locally in your browser.

**Live workflow:** no backend, no build step. Open the HTML files or serve the folder with any static file server.

## Features

### Daily dashboard (`index.html`)
- Weekly day navigation (Saturday–Friday)
- Macro summary for the selected day (protein, carbs, fat, calories with one decimal)
- Meal cards from your schedule with expandable components
- Log what you actually ate vs. the plan

### Manage (`manage.html`)
1. **Food library** — foods with categories, quantities, and macros  
2. **Meal templates** — components, nested meals, and food alternatives with per-alternative quantities  
3. **Weekly schedule** — assign meals to time slots; drag to reorder; copy a day to other days; swap meals/components on specific slots  
4. **Grocery list** — aggregated shopping list from the schedule; filter by weekday; scale for multiple weeks (1–52); check off items; print; add custom lines  

### Progress (`progress.html`)
- Body metrics log (weight, body fat, muscle, etc.)
- Weekly and monthly nutrition reports
- Food log across calendar dates

### Other
- **Share plan via URL** — encode your plan in a link (from Manage)
- **Local persistence** — data saved in `localStorage` (`m2m_relational_plan_v12`)

## Getting started

### Option 1: Open directly
Double-click `index.html` or open it in Chrome, Edge, or Firefox.

### Option 2: Local server (recommended)
Some browsers restrict `localStorage` or file URLs; a simple server avoids that:

```bash
# Python 3
python -m http.server 8080

# Node (npx)
npx serve .
```

Then visit `http://localhost:8080`.

## Project structure

| File | Purpose |
|------|---------|
| `index.html` / `app.js` | Daily dashboard |
| `manage.html` / `manage.js` | Foods, meals, schedule, grocery |
| `progress.html` / `progress.js` | Body metrics and nutrition reports |
| `data.js` | Data model, storage, grocery builder, schedule logic |
| `style.css` / `dashboard.css` / `progress.css` | Styles |

## Tech stack

- Vanilla HTML, CSS, JavaScript
- [Font Awesome](https://fontawesome.com/) icons
- [Google Fonts](https://fonts.google.com/) (Tajawal, Montserrat)
- `localStorage` for persistence

## Data & privacy

All plan data stays on your device. Sharing a plan creates a URL containing encoded plan JSON — only share with people you trust.

## License

No license file is included yet. Add one if you plan to open-source or redistribute the project.

# Basilur Engineering Job Management

A first-version browser app for managing engineering service jobs, technicians, materials, and invoices.

## Features

- Dashboard for open jobs, urgent work, revenue, and completion rate
- Job list with search and status filters
- Detailed job workspace with status, priority, technician, schedule, tasks, parts, and invoice data
- Add-job flow for new work requests
- Technician dispatch view
- Local browser storage so edits remain after refresh

## Run Locally

Open `index.html` in a browser, or run a simple local server:

```bash
python3 -m http.server 4173
```

Then open:

```text
http://localhost:4173
```

## Notes

This first version is frontend-only. It is ready for a later backend/database step when you want real user accounts, shared data, and production deployment.

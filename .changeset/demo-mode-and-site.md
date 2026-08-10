---
"opentask": minor
---

Demo mode (`OPENTASK_DEMO_MODE`) — run OpenTask as a public sandbox. The instance publishes its seeded credentials on `/api/v1/info` so the login page offers one-click access, shows a reset countdown banner, hides the Settings pages it disables, and refuses every write that could reach out of the container, fill the disk, or lock the next visitor out (notification channels, importer, attachments, rambles, backups, tokens, push, iCal token, integrations, and account mutations). Everything else — tasks, projects, filters, search, boards, productivity — behaves exactly as it does on a private instance. `deploy/demo/` ships a supervisor that wipes, re-seeds, and restarts on a timer, so a disposable demo is one `docker compose up`.

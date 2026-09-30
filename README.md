# Bite

Bite is a mobile-first food-journal prototype built with Nuxt 4 and Vue 3. It pairs a friendly daily meal timeline and quick meal composer with a separate dietitian dashboard, patient diary, food explorer, and profile.

## Run locally

```bash
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Build and preview the production app with `npm run build` and `npm run preview`.

## Try the prototype

- Use **Log a meal** to add a meal type and time, multiple foods with quantities and units, and optional notes, a photo, hunger, or fullness.
- Use the navigation to visit the diary, food explorer, and profile. The profile includes editable sample details and body-mass history.
- Choose **Preview dietitian view** to see the dashboard, sample patient directory, patient diary, and browser print-to-PDF flow.

## Prototype and privacy note

This repository currently contains a UI prototype with fictional, in-memory sample data. The view switch is for preview only; it is **not authentication or access control**. There is no database or server-side persistence, and changes reset when the page reloads. Do not enter real patient or health information. A production deployment needs a configured authentication provider, server-side role checks, and database-level patient/dietitian access policies before it can handle real data.

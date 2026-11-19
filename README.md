# Night City Events — Indy

An unofficial community calendar for Indianapolis-area Cyberpunk TCG players.

- **[Open the live calendar](https://elvinmorales.github.io/night-city-events-indy/)**
- [Submit an event](https://github.com/ElvinMorales/night-city-events-indy/issues/new?template=event.yml)
- [Report a bug or share feedback](https://github.com/ElvinMorales/night-city-events-indy/issues/new?template=bug-feedback.yml)
- [Contribute catalog updates](docs/UPDATING-EVENTS.md)

Browse upcoming events in the list or month calendar. The default radius is 40 straight-line miles from downtown Indianapolis and can be widened to 100 miles. Dates and times are shown in Indianapolis time. Open an event for its organizer source and registration link. GitHub requires an account to submit an issue.

## Event maintenance

Use the [verification policy](docs/VERIFICATION.md) and [Melee location directory](docs/sources/melee-locations.json) when checking public sources. The production catalog is `src/data/events.json`. Keep stable event IDs when updating or cancelling listings, and omit unknown fees and end times. Calendar downloads are available for events with a verified end time.

## Local development

Use Node.js 22 or newer.

```sh
npm ci
npm run dev
npm run check:catalog
npm test
npm run typecheck
npm run build
npm run preview
```

The development server and production preview bind to localhost. Preview serves the production build under `/night-city-events-indy/`. Fictional fixtures are available with `?demo=1` on the development server only.

## Publishing

The [Publish GitHub Pages workflow](.github/workflows/pages.yml) deploys the verified `main` commit using its full SHA. Pushes and pull requests run checks. A separate workflow dispatch publishes the site.

This project is [MIT-licensed](LICENSE) and is unaffiliated with the Cyberpunk TCG creators and rights holders.

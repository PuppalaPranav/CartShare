# CartShare

Collaborative shopping cart for dorms, offices and travel groups. Create or join a room with a code, add/remove items, watch the activity log, track the free-delivery threshold ($75) and print an audit-ready receipt.

## Run locally
1. Clone the repo.
2. Open `index.html` in a browser, or run `npx serve .` / VS Code Live Server (recommended).
3. To simulate several users, open the app in 2+ tabs of the same browser, enter different names and the **same room code**.

## Features
- Login + room join via HTML form (name is kept per tab with `sessionStorage`)
- Shared cart with add/remove, who-added-what, per-person totals
- Free-delivery progress bar (threshold in `js/app.js`)
- Real-time sync across tabs using `localStorage` + the `storage` event
- Activity log (last 50 events)
- Printable receipt via CSS `@media print`
- Responsive layout with Bootstrap 5 grid + custom CSS

## Structure
```
index.html
css/style.css
js/app.js
assets/
```

## Limitation
Sync works between tabs of one browser (browser storage is local). Cross-device sync would need a backend such as Firebase.

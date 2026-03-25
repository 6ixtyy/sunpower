# Apps Script + Static Site: Lessons Learned

## 1. Apps Script Web Apps Redirect POST Requests
- Apps Script returns a **302 redirect** from `script.google.com` → `script.googleusercontent.com`
- **`fetch()` cannot follow cross-origin redirects** for POST requests — the request silently fails
- `mode: 'no-cors'` with POST also fails because the **redirect converts POST to GET**, so `doPost` never fires

## 2. Native Form POST to iframe Also Fails
- Even with `<form action="..." method="POST" target="iframe">`, the browser's redirect handling for cross-origin POST into iframes is unreliable
- `form.submit()` after `e.preventDefault()` can behave inconsistently across browsers

## 3. The Bulletproof Solution: GET via iframe.src
- **Build query params in JS** → set `iframe.src = URL + '?' + params`
- The browser natively follows all redirects for GET requests loaded via iframe src
- Apps Script needs **both `doGet()` and `doPost()`** pointing to a shared `handleRequest(e)` function
- `e.parameter` works identically for both GET and POST in Apps Script

## 4. Apps Script Deployment URLs
- Each **new deployment** creates a **new URL** — always update the frontend when redeploying
- To keep the same URL: **Manage deployments → edit (pencil) → New version → Deploy**
- Always redeploy after changing the Apps Script code — saved code ≠ live code

## 5. Spreadsheet Permissions
- The Apps Script must have **Editor access** to the Google Sheet
- Easiest fix: use the **same Google account** for both the Script and the Sheet
- Error message: `"You do not have permission to access the requested document"`

## 6. Telegram Groups with Topics
- Topic-based groups need `message_thread_id` in the API payload
- Chat ID format for supergroups: `-100` + group number (e.g., `-1003834770003`)
- Topic/thread ID is extracted from the message link: `t.me/c/{group}/{topic_id}/{msg_id}`

## 7. Testing Apps Script
- Run **`testDoPost`** (not `doPost`) from the editor — `doPost` requires an event parameter the editor doesn't provide
- Always test in the editor first before testing from the live site
- Check **Execution log** in Apps Script for debugging

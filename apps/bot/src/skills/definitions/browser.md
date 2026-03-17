---
name: browser_automation
description: Browse websites, take screenshots, fill forms, and scrape web data using Browserbase browser sessions. Use when asked to visit a URL, scrape a page, or interact with a website.
---

## Browser Automation via Browserbase

IMPORTANT: There is NO tool called `browser`. Use the tools listed below by their exact names.

### Available Tools

| Tool | Description |
|------|-------------|
| `browser_create_session` | Create a Browserbase browser session. Returns `session_id`, `connect_url`, `live_view_url`, `recording_url` |
| `browser_download_files` | Download files produced in a session to the workspace |
| `browser_close_session` | Close a Browserbase session and release resources |

### Workflow

1. Call `browser_create_session` with a `starting_url` to create a session
2. Use the returned `connect_url` to interact with the browser via Playwright in a bash/python script
3. Call `browser_download_files` if you need to retrieve downloaded files
4. Call `browser_close_session` when done

### Parameters for `browser_create_session`

- `starting_url` (str): Initial URL for the browser session
- `viewport_width` (int, default 1024): Browser viewport width
- `viewport_height` (int, default 768): Browser viewport height
- `enable_proxies` (bool): Enable Browserbase proxies for the session
- `timeout_seconds` (int, default 300): Session timeout

### Example: Browse and Screenshot

```python
# Step 1: Create session (call browser_create_session tool)
result = await browser_create_session(starting_url="https://example.com")
session_id = result["session_id"]
connect_url = result["connect_url"]

# Step 2: Interact via Playwright in a bash script
# The connect_url is a CDP endpoint for Playwright
from playwright.async_api import async_playwright

async with async_playwright() as p:
    browser = await p.chromium.connect_over_cdp(connect_url)
    page = browser.contexts[0].pages[0]

    await page.goto("https://example.com")
    await page.screenshot(path="/work/temp/screenshot.jpg")
    content = await page.content()

# Step 3: Close session (call browser_close_session tool)
await browser_close_session(session_id=session_id)
```

### Example: Scrape Data

```python
result = await browser_create_session(starting_url="https://example.com/products")
connect_url = result["connect_url"]

async with async_playwright() as p:
    browser = await p.chromium.connect_over_cdp(connect_url)
    page = browser.contexts[0].pages[0]

    await page.wait_for_selector(".product")
    titles = await page.locator(".product-title").all_text_contents()
    print(titles)

await browser_close_session(session_id=result["session_id"])
```

### Tips

- Always call `browser_close_session` when done to free resources
- Use `page.wait_for_selector()` before interacting with dynamic elements
- For scraping, prefer `page.evaluate()` with JavaScript over parsing HTML
- Save screenshots to `/work/temp/` for sharing via Slack
- The `live_view_url` lets you watch the session in real-time
- The `recording_url` provides a replay of the session after it ends

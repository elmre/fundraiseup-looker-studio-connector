Fundraise Up REST API - Looker Studio Connector
=============
This repository contains a [community connector](https://developers.google.com/looker-studio/connector "community connector") script to fetch donations data from FundraiseUp and visualize it in Looker Studio using Google Apps Script.

For a detailed walkthrough of Fundraise Up REST API, check out [documentation](https://fundraiseup.com/docs/rest-api/ "documentation").


Features
-------------
- Fetch dynamic donations data based on API key input.
- No authentication required.
- Seamlessly integrates with Looker Studio for data visualization.
- Google Sheets Support - automatically adds new rows to the sheet.


Usage
-------------
#### Setup in Google Apps Script
- Create a new [Google Apps Script](https://script.google.com/ "Google Apps Script") project.
- Copy and paste the provided script into the editor.
- Save and deploy the script as a web app.

#### Integration in Looker Studio
- Use the deployed script URL as the data source in Looker Studio.
- To obtain API key open [Fundraise Up Dashboard](https://dashboard.fundraiseup.com/ "Fundraise Up Dashboard") > Settings > API keys and click Create API key.
- Configure the data source by specifying the desired API key.
- Visualize the fetched data using Looker Studio tools.

#### Connect Google Spreadsheet
1. Create an empty [Google Spreadsheet](https://docs.google.com/spreadsheets/ "Google Spreadsheet") and copy the ID from URL.
2. In your Apps Script project, go to **Project Settings** (⚙️) > **Script Properties**.
3. Add a new property `SPREADSHEET_CONFIGS` with JSON configuration:

```json
[
  {
    "spreadsheet_id": "YOUR_SPREADSHEET_ID",
    "sheet_name": "Donations",
    "api_key": "YOUR_API_KEY",
    "livemode": true
  }
]
```

5. At the left, click **Triggers** ⏰, at the bottom right, click **Add Trigger**, select and configure the time-driven trigger to run function `runScheduledTask()`
6. Connect your spreadsheet as a data source in Looker Studio.


Schema
-------------
Supports 100+ fields declared in documentation. Do not support ```questions``` field.


Example
-------------
Example of data visualize by Looker Studio report.

![Looker Studio Report Example](./Example.png)


Local Development
-------------
This project supports local development using [clasp](https://github.com/google/clasp) (Command Line Apps Script Projects).

#### Installation
```bash
npm install
npm run login  # Authenticate with Google (first time only)
```

#### Available Commands
| Command | Description |
|---------|-------------|
| `npm run watch` | Auto-upload on file changes (development mode) |
| `npm run push` | Upload code to Google Apps Script |
| `npm run pull` | Download code from Google Apps Script |
| `npm run deploy` | Create new deployment |
| `npm run open` | Open project in browser |


Project Structure
-------------
| File | Description |
|------|-------------|
| `_Constants.gs` | Configuration values, API limits, timeouts |
| `_Schema.gs` | Data schema definition (100+ fields) |
| `ApiClient.gs` | FundraiseUp API client with pagination |
| `Async.gs` | Async execution via time-based triggers |
| `Connector.gs` | Main Looker Studio connector logic |
| `DataCache.gs` | Caching layer for API responses |
| `Env.gs` | Environment configuration helpers |
| `RateLimiter.gs` | API rate limiting (8/sec, 128/min) |
| `SpreadSheet.gs` | Google Sheets integration |


License
-------------
This is an unofficial project made for educational purpose. Licensed under the MIT License. See the LICENSE file for more details.

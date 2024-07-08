# CSIHV (Counter-Strike Inventory History Viewer)
CSIHV is an Electron app that allows users to scrape and view their Counter-Strike inventory history in an organized and user-friendly manner. The app provides advanced filtering options to help users easily navigate and analyze their inventory data.

Please note that this project is currently in beta and may not have all intended features fully implemented.

Key features:

-   Scrape Counter-Strike inventory history
-   Organize inventory data for easy viewing
-   Advanced filtering options for in-depth analysis

## How does CSIHV work?
CSIHV relies on the user's Steam cookies to access and scrape their Counter-Strike inventory history. Here's a step-by-step overview of how the app functions:

1.  **User Authentication**: The user provides their Steam cookies, which are used to authenticate and access their Steam account.
2.  **Inventory History Simulation**: CSIHV simulates the inventory history pages by making requests to the Steam API endpoints. It navigates through the pages as if a user were manually browsing their inventory history.
3.  **Data Scraping**: As CSIHV navigates the inventory history pages, it scrapes the relevant data from the HTML responses. This includes information such as item names, transaction dates, prices, and other metadata associated with each inventory entry.
4.  **Data Processing**: The scraped data is then processed and organized into a structured format. CSIHV performs necessary data cleaning, transformation, and normalization to ensure the data is consistent and ready for further analysis.
5.  **Data Storage**: The processed inventory data is stored locally on the user's machine. CSIHV uses a suitable storage mechanism (JSON) to persist the data between sessions.
6.  **Data Visualization**: CSIHV presents the scraped and processed inventory data to the user in a user-friendly interface. It provides various viewing options, such as sorting, filtering, and searching, to help users easily navigate and analyze their inventory history.
7.  **Advanced Filtering**: CSIHV offers advanced filtering capabilities to allow users to refine their inventory history based on specific criteria. Users can filter by date range, item type, transaction type, or other relevant parameters to gain insights into their inventory trends and patterns.

## Getting Started
To get started with CSIHV, follow these simple steps:

### Installation

1.  Go to the [releases tab](https://github.com/Mantequilla53/CSIH-Viewer/releases) of this repository.
2.  Download the latest setup file (Only works on Windows for now)
3.  Run the setup file and follow the installation instructions.

### How to Get Your Steam Cookies
   1. Log into your Steam account via web browser
   2. Go to your Steam profile (https://steamcommunity.com/my/)
   3. Open Developer Tools:
      * Press F12 or right-click and select "Inspect"
   4. Refresh your Steam profile page (Press F5 or use the refresh button)
   5. In Developer Tools:
      * Go to the "Network" tab
      * Find the entry with your Steam custom URL or Steam64 ID
      * Click on this entry
      * In the new section, under the "Headers" tab, find "Cookie:" in the Request Headers
      * Copy the entire text string next to "Cookie:"
      * Paste this string into CSIHV when prompted

## Built With

* [Electron](https://www.electronjs.org/)

## Acknowledgments

* [ByMykel's](https://github.com/ByMykel/CSGO-API) Counter Strike api
* [Kyle5507](https://github.com/kyle5507) for helping with initial logic in earlier versions of CSIHV

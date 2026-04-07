# Mock Data Setup Guide

## Overview

This project includes a comprehensive mock data system for testing and development. Mock data provides sample parties, companies, items, vehicles, and stock transactions that span the last 30 days.

## What's Included

### Mock Data Components

- **5 Sample Parties**: Different companies from various cities (Mumbai, Bangalore, Ahmedabad, Delhi, Hyderabad)
- **Multiple Companies**: 2-4 companies per party with random attributes
- **Sample Items**: Various product types like cement, steel rods, bricks, tiles, paint, etc.
- **Vehicles**: 1-3 vehicles per party with realistic vehicle numbers
- **Stock Transactions**: Random quantities and godown assignments

### Godowns

The system includes 15 predefined godowns:

- KA-01 to KA-07 (Kannada region)
- KS-01 to KS-07 (Karnataka state)
- office

## Usage Methods

### Method 1: Using npm Scripts (Recommended)

#### Quick Start with Mock Data

```bash
npm run start-mock
```

This starts the Expo development server with the `MOCK_DATA` environment variable set.

#### Run on Android with Mock Data

```bash
npm run android-mock
```

#### Run on iOS with Mock Data

```bash
npm run ios-mock
```

#### Run Web with Mock Data

```bash
npm run web-mock
```

### Method 2: Using the Developer Menu (In-App)

1. **Open the Home Screen** - Navigate to the Dashboard
2. **Access Developer Menu** - Tap on the "Godowns" title 5 times quickly
3. **Initialize Mock Data** - Click the "Initialize Mock Data" button
4. **Restart the App** - Close and reopen the app to see the mock data

**Note**: The developer menu is hidden by default and appears after 5 rapid taps on the "Godowns" title.

### Method 3: JavaScript API

```typescript
import { initializeMockData, clearAllData } from "@/lib/mockDataHelper";

// Initialize mock data
await initializeMockData();

// Or clear all data
await clearAllData();
```

## Available npm Scripts

| Script                 | Description                              |
| ---------------------- | ---------------------------------------- |
| `npm run start`        | Start app normally                       |
| `npm run start-mock`   | Start app with mock data                 |
| `npm run android`      | Run on Android device                    |
| `npm run android-mock` | Run on Android with mock data            |
| `npm run ios`          | Run on iOS device                        |
| `npm run ios-mock`     | Run on iOS with mock data                |
| `npm run web`          | Run web version                          |
| `npm run web-mock`     | Run web with mock data                   |
| `npm run init-mock`    | Generate mock data info (Node.js script) |

## Developer Menu Features

The in-app Developer Menu (accessible via 5 quick taps on "Godowns") provides:

1. **Initialize Mock Data**
   - Clears all existing data
   - Loads fresh sample data
   - Shows counts of generated records
   - Requires app restart to take effect

2. **Clear All Data**
   - Removes all parties, companies, items, vehicles, and stocks
   - Keeps the godown structure intact
   - Shows confirmation dialog

3. **Info Section**
   - Shows what mock data includes
   - Helpful for understanding test data

## Generated Mock Data Statistics

When you initialize mock data, you get:

- **5 Parties** with full contact information
- **10-15 Companies** across all parties
- **20-30 Items** (products) across companies
- **5-15 Vehicles** across parties
- **20-50 Stock Transactions** across godowns and items
- **15 Godowns** (predefined)

## Architecture

### Files Added

- `lib/mockData.ts` - Type-safe mock data generation
- `lib/mockDataHelper.ts` - Storage helper functions for mock data
- `components/DevMenu.tsx` - Developer menu UI component
- `scripts/generate-mock-data.js` - Node.js script for reference
- `MOCK_DATA.md` - This documentation

### Modified Files

- `app/index.tsx` - Added developer menu trigger
- `package.json` - Added mock data scripts
- `app/_layout.tsx` - (optional) can be modified for auto-initialization

## Features

✅ Comprehensive mock data with realistic values  
✅ Automatic data clearing on initialization  
✅ Developer menu for easy access  
✅ npm scripts for quick startup  
✅ TypeScript support  
✅ Responsive UI  
✅ Godom structure preservation

## Example Workflow

### Testing the Load Screen

```bash
npm run start-mock
# App starts with mock data
# Navigate to Load screen
# See parties like "Rajesh Kumar", "Priya Sharma", etc.
# Select a party to view their vehicles and companies
```

### Testing the Dashboard

```bash
npm run start-mock
# See godowns with calculated stock quantities
# Check different godowns for stock levels
```

### Resetting for Fresh Testing

1. Tap "Godowns" title 5 times in home screen
2. Click "Clear All Data"
3. Click "Initialize Mock Data"
4. Restart the app

## Troubleshooting

### Mock data doesn't appear

- Ensure you're using one of the `-mock` variants of scripts
- Try restarting the app after initialization
- Check the terminal for error messages

### Developer menu won't open

- Make sure you're tapping on the "Godowns" text, not surrounding areas
- Tap must be rapid (within 2 seconds)
- Complete all 5 taps before the timeout

### Data not clearing

- Make sure to confirm the clear action in the alert
- Restart the app after clearing
- Check file system permissions on the device

## Performance Notes

- Mock data generation is instant on device
- First load may take a moment to calculate stock quantities
- All data is stored locally on device
- No network calls are made

## Development Tips

1. **Quick testing**: Use `npm run start-mock` to always start with fresh data
2. **Realistic data**: Mock data includes date ranges and realistic quantities
3. **Multiple scenarios**: Initialize multiple times to get different random data
4. **Backup old data**: Use the "Download Data" button before clearing

## Next Steps

- Test different screens by navigating through the app
- Verify load/unload transactions are calculated correctly
- Check godown stock levels are accurate
- Test PDF export with mock data
- Verify filtering and search functionality

---

**Last Updated**: April 2026  
**Version**: 1.0

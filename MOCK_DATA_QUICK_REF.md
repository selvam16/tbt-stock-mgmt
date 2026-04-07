# Mock Data Quick Reference

## 🚀 Quick Start

```bash
# Start app with mock data
npm run start-mock

# Or Android
npm run android-mock

# Or iOS
npm run ios-mock

# Or Web
npm run web-mock
```

## 🔧 In-App Usage

**Activate Developer Menu:**

1. Go to Home/Dashboard
2. Tap "Godowns" title **5 times rapidly**
3. Developer Menu appears

**From Menu:**

- Click **"Initialize Mock Data"** → loads fresh sample data
- Click **"Clear All Data"** → removes everything except godowns
- **Requires app restart** to see changes

## 📊 What You Get

| Item             | Count | Notes                          |
| ---------------- | ----- | ------------------------------ |
| Parties          | 5     | From different Indian cities   |
| Companies        | 10-15 | Assigned to parties/godowns    |
| Items (Products) | 20-30 | Cement, steel, bricks, etc.    |
| Vehicles         | 5-15  | Truck, lorry, tempo types      |
| Stock Records    | 20-50 | Random quantities 50-550 units |
| Godowns          | 15    | KA-01/07, KS-01/07, office     |

## 🎯 Sample Data

**Parties:**

- Rajesh Kumar (Mumbai)
- Priya Sharma (Bangalore)
- Neha Patel (Ahmedabad)
- Vikram Singh (Delhi)
- Ahmed Khan (Hyderabad)

**Products:**

- Cement Bags, Steel Rods, Gravel, Sand
- Bricks, Tiles, Paint Cans, Plywood
- Pipes, Electrical Wire

**Vehicle Types:**

- Truck, Lorry, Tempo, Van, Container, Trailer

## 🔐 Hidden Menu Activation

```
Tap "Godowns" → 5 times in 2 seconds → Developer Menu opens
```

## 💡 Common Tasks

### Load Fresh Mock Data

```bash
npm run start-mock
```

### Clear Everything

- Home → Tap Godowns 5× → Clear All Data → Restart

### Initialize Programmatically

```typescript
import { initializeMockData } from "@/lib/mockDataHelper";
await initializeMockData();
```

### Clear via Code

```typescript
import { clearAllData } from "@/lib/mockDataHelper";
await clearAllData();
```

## 🐛 Troubleshooting

| Issue                  | Solution                            |
| ---------------------- | ----------------------------------- |
| No mock data visible   | Use `npm run start-mock` script     |
| Dev menu won't open    | Tap "Godowns" text quickly, 5 times |
| Timeout error          | Check file system permissions       |
| Old data still showing | Restart app after clear             |

## 📝 All npm Scripts

```bash
npm run start           # Normal start
npm run start-mock      # Start with mock data env
npm run init-mock       # Show mock data info
npm run android         # Android normal
npm run android-mock    # Android with mock
npm run ios            # iOS normal
npm run ios-mock       # iOS with mock
npm run web            # Web normal
npm run web-mock       # Web with mock
npm run lint           # ESLint check
npm run reset-project  # Reset project structure
```

## ✨ Features

✅ Clears old data on initialization  
✅ Generates realistic random data  
✅ Spans 30-day date range  
✅ Properly typed with TypeScript  
✅ Hidden developer menu  
✅ No network calls required

## 📂 Files Reference

- `lib/mockDataHelper.ts` - Main functions
- `components/DevMenu.tsx` - UI menu
- `MOCK_DATA.md` - Full documentation
- `scripts/generate-mock-data.js` - Reference script

---

**Tip:** Use `npm run start-mock` every time you want fresh test data!

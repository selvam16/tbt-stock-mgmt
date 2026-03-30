# TBT Stock Management App 📱

A comprehensive React Native stock management application built with Expo, designed for managing parties, companies, and inventory items with full CRUD operations.

## 🚀 Features

### Core Functionality

- **Party Management**: Add, edit, and delete parties with contact information
- **Company Management**: Create companies linked to parties with godown assignments
- **Item Management**: Add items to companies with quantity tracking
- **Godown Management**: Pre-configured godown locations (KA-01 to KA-10)
- **Stock Dashboard**: View godown information and stock summaries

### User Experience

- **Intuitive Navigation**: Clean, hierarchical navigation flow
- **Auto-complete**: Company name suggestions from existing data
- **Form Validation**: Comprehensive input validation with user-friendly error messages
- **Real-time Updates**: Automatic data refresh after operations
- **Responsive Design**: Optimized for mobile devices

### Data Management

- **Persistent Storage**: File-based storage using Expo FileSystem
- **Data Relationships**: Proper linking between parties → companies → items
- **Quantity Aggregation**: Automatic calculation of total quantities per company
- **Source Tracking**: Track whether operations are for "add" or "unload" stock

## 🛠️ Tech Stack

- **Framework**: React Native with Expo
- **Language**: TypeScript
- **Navigation**: Expo Router (file-based routing)
- **Storage**: Expo FileSystem (JSON-based persistence)
- **UI Components**: React Native built-in components
- **Icons**: @expo/vector-icons (MaterialIcons)
- **Date Picker**: @react-native-community/datetimepicker
- **Linting**: ESLint with Expo configuration

## 📦 Installation

1. **Prerequisites**
   - Node.js (v18 or higher)
   - npm or yarn
   - Expo CLI (`npm install -g @expo/cli`)

2. **Clone and Install**

   ```bash
   git clone <repository-url>
   cd tbt-stock-mgmt
   npm install
   ```

3. **Start Development Server**

   ```bash
   npx expo start
   ```

4. **Run on Device/Emulator**
   - For Android: `npx expo run:android`
   - For iOS: `npx expo run:ios`
   - For Web: `npx expo start --web`

## 📱 Usage Guide

### Navigation Flow

1. **Dashboard** (`/`): View godowns and access main functions
2. **Load Stock** (`/screens/load`): Select party → Add/Edit companies → Manage items
3. **Unload Stock** (`/screens/unload`): Select party → View companies → Manage items

### Key Operations

#### Managing Parties

- Tap the **+** button to add a new party
- Fill in party details (name, contact, address, city)
- Edit or delete parties from the list

#### Managing Companies

- Select a party to view associated companies
- Add companies with name, agent, godown selection, and date
- Company names auto-complete from existing entries
- View total quantity of items per company

#### Managing Items

- Select a company to view/manage items
- Add items with name and quantity
- Edit or delete individual items
- Quantities are aggregated and displayed at company level

## 🗂️ Project Structure

```
tbt-stock-mgmt/
├── app/                          # Main application screens
│   ├── index.tsx                 # Dashboard/Home screen
│   ├── _layout.tsx               # Root layout
│   ├── screens/                  # Feature screens
│   │   ├── load.tsx              # Load stock flow
│   │   ├── unload.tsx            # Unload stock flow
│   │   ├── add-party.tsx         # Party creation/editing
│   │   ├── companies.tsx         # Company list for a party
│   │   ├── add-company.tsx       # Company creation/editing
│   │   ├── company-items.tsx     # Item list for a company
│   │   └── add-item.tsx          # Item creation/editing
│   └── ...
├── components/                   # Reusable UI components
│   ├── AppLayout.tsx             # Main app layout wrapper
│   ├── AddPartyFAB.tsx           # Floating action button
│   ├── PartyCard.tsx             # Party list item
│   ├── CompanyCard.tsx           # Company list item
│   ├── ItemCard.tsx              # Item list item
│   └── MultiFAB.tsx              # Multi-action FAB
├── lib/                          # Business logic and utilities
│   └── storage.ts                # Data persistence layer
├── theme/                        # Styling and theming
│   └── color.ts                  # Color definitions
├── assets/                       # Static assets
│   └── images/                   # Image files
└── android/                      # Android-specific files
```

## 💾 Database Schema

The app uses a JSON-based storage system with the following structure:

### Party

```typescript
{
  id: string;
  title: string; // "MR" | "M/S"
  name: string;
  contact: string;
  city: string;
  address: string;
  createdAt: number;
}
```

### Company

```typescript
{
  id: string;
  partyId: string;        // Links to Party
  companyName: string;
  agentName?: string;
  godownName: string;     // "KA-01" to "KA-10"
  date: string;           // ISO date string
  source: "add" | "unload";
  createdAt: number;
}
```

### Item

```typescript
{
  id: string;
  companyId: string; // Links to Company
  itemName: string;
  quantity: number;
  createdAt: number;
}
```

### Godown

```typescript
{
  id: string;
  name: string; // "KA-01" to "KA-10"
}
```

## 🔧 Development

### Available Scripts

- `npm start` - Start the Expo development server
- `npm run android` - Run on Android emulator/device
- `npm run ios` - Run on iOS simulator
- `npm run web` - Run in web browser
- `npm run lint` - Run ESLint for code quality

### Code Quality

- TypeScript for type safety
- ESLint for code linting
- Prettier for code formatting (via ESLint)
- Expo's recommended project structure

### Key Development Patterns

- **File-based Routing**: Expo Router for navigation
- **Component Composition**: Reusable UI components
- **State Management**: React hooks with local state
- **Data Persistence**: Custom storage abstraction layer
- **Error Handling**: Try-catch blocks with user-friendly alerts

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Use meaningful component and variable names
- Add proper error handling
- Test on both Android and iOS
- Follow the existing code style and patterns

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙋 Support

For questions or issues:

- Create an issue on GitHub
- Check the [Expo documentation](https://docs.expo.dev/)
- Join the [Expo Discord community](https://chat.expo.dev/)

---

Built with ❤️ using React Native and Expo

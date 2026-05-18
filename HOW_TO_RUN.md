# insight_to_action - Setup & Run Guide

A multi-platform AI agent system demonstrating real-time threat analysis, self-healing actions, and automated resolution with contradiction detection.

---

## 📋 Prerequisites

Before getting started, ensure you have the following installed on your system:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** (v9 or higher) - comes with Node.js
- **Git** - [Download](https://git-scm.com/)
- **Expo CLI** (for mobile) - `npm install -g expo-cli`

---

## 🚀 Quick Start (Web Only)

### 1. Clone the Repository

```bash
git clone https://github.com/Roaimkhan/insight_to_action.git
cd insight_to_action
```

### 2. Install Frontend Dependencies

```bash
cd frontend
npm install
```

### 3. Start the Web Application

```bash
npm run dev
```

The application will open in your browser at `http://localhost:5173`

---

## 📱 Full Setup (Web + Mobile)

### 1. Clone the Repository

```bash
git clone https://github.com/Roaimkhan/insight_to_action.git
cd insight_to_action
```

### 2. Setup Web Frontend

```bash
cd frontend
npm install
npm run dev
```

The web app will run on `http://localhost:5173`

### 3. Setup Mobile App (in a new terminal)

```bash
cd mobile
npm install --legacy-peer-deps
npm start
```

**Note:** Use `--legacy-peer-deps` flag to resolve peer dependency conflicts with expo.

### 4. Run Mobile on Different Platforms

#### iOS (Mac only)
```bash
npm run ios
```

#### Android
```bash
npm run android
```

#### Web
```bash
npm run web
```

---

## 🛠️ Project Structure

```
insight_to_action/
├── frontend/                 # Web React + Vite application
│   ├── src/
│   │   ├── pages/           # Pages (Home, Agent, Comparison, Metrics)
│   │   ├── components/      # Reusable UI components
│   │   ├── store/           # Zustand state management
│   │   ├── types/           # TypeScript type definitions
│   │   ├── constants/       # Colors, typography, spacing
│   │   └── services/        # Mock data services
│   ├── package.json
│   └── vite.config.ts
│
├── mobile/                   # React Native + Expo application
│   ├── src/
│   │   ├── app/             # App screens (Expo Router)
│   │   ├── components/      # Native UI components
│   │   ├── store/           # Zustand state management
│   │   ├── types/           # TypeScript type definitions
│   │   ├── constants/       # Design tokens
│   │   └── services/        # API & mock services
│   ├── package.json
│   └── tsconfig.json
│
├── backend/                  # Backend placeholder
└── README.md
```

---

## 📖 Available Scripts

### Web Frontend

```bash
cd frontend

# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

### Mobile App

```bash
cd mobile

# Start Expo development server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android

# Run in web browser
npm run web
```

---

## 🎯 Features Included

### Web Application
- ✅ **3 Scenarios** - Pre-configured threat scenarios with complete mock data
- ✅ **Real-time Streaming** - Live source ingestion with latency simulation
- ✅ **Contradiction Detection** - Identifies conflicting information automatically
- ✅ **Action Execution** - 5-step action chains with configurable latencies
- ✅ **Before/After Comparison** - Metrics visualization showing improvements
- ✅ **Audit Trail** - Complete event logging with JSON export
- ✅ **Self-Heal Visualization** - Tier 1-3 self-healing actions display
- ✅ **Responsive Design** - Works on desktop browsers

### Mobile Application
- ✅ All web features adapted for React Native
- ✅ Native navigation with Expo Router
- ✅ Touch-optimized UI components
- ✅ Haptic feedback on interactions
- ✅ Font loading with system fallbacks

---

## 🔄 How It Works

### Scenario Flow

1. **Home Page** → Select one of 3 scenarios
2. **Agent Page** → Watch real-time analysis:
   - Sources ingestion (security logs, network traffic, etc.)
   - Contradiction detection
   - Action chain execution
3. **Comparison Page** → View before/after metrics
4. **Metrics Dashboard** → See overall impact:
   - Risk Reduction
   - Resolution Time
   - Completed Steps
   - Cost Savings

### Mock Data Structure

Each scenario includes:
- **3 Sources** (security logs, network traffic, system events)
- **2 Contradictions** (conflicting information)
- **5 Action Steps** (with latencies: 0.5s - 3s each)
- **LLM Tokens** (simulated AI reasoning output)
- **Before/After States** (for 4 key metrics)

---

## ⚠️ Troubleshooting

### Issue: "Cannot find module 'expo-router'"

**Solution:** You're in the mobile folder. Run:
```bash
npm install --legacy-peer-deps
```

### Issue: Port 5173 already in use (Web)

**Solution:** Either:
1. Kill the process using the port
2. Or run with a different port: `npm run dev -- --port 3000`

### Issue: Mobile app won't start

**Solution:**
1. Clear cache: `npm start --clear`
2. Reset expo: `expo start -c`

### Issue: TypeScript errors in mobile

**Solution:** Clear node_modules and reinstall:
```bash
cd mobile
rm -r node_modules package-lock.json
npm install --legacy-peer-deps
```

### Issue: Font loading fails on mobile

**Solution:** Fonts are pre-loaded in `_layout.tsx`. If they don't load:
1. Check internet connection (fonts are downloaded from Google Fonts)
2. Try restarting the Expo development server

---

## 🌍 Accessing the Applications

### Web Frontend
```
Local: http://localhost:5173
```

### Mobile App (via Expo)
After running `npm start` in the mobile folder:
- **iOS**: Press `i`
- **Android**: Press `a`
- **Web**: Press `w`

Scan QR code with Expo Go app on your phone to run on physical device.

---

## 📦 Dependencies Overview

### Web Frontend
- **react** 19.2.6 - UI framework
- **react-router-dom** 7.15.1 - Routing
- **zustand** 5.0.13 - State management
- **framer-motion** 12.38.0 - Animations
- **vite** - Build tool

### Mobile App
- **react** 19.1.0 - UI framework
- **react-native** 0.81.5 - Native framework
- **expo** 54.0.33 - Native app framework
- **expo-router** - Navigation
- **react-native-reanimated** - Animations
- **react-native-gesture-handler** - Gesture detection
- **@expo-google-fonts** - Typography

---

## 🚀 Demo Mode

The application runs in **fully mocked mode** - no backend required!

All data is pre-generated and streams are simulated with realistic latencies. Perfect for:
- ✅ Hackathon demonstrations
- ✅ Investor pitches
- ✅ User testing
- ✅ Feature showcases

---

## 📝 Notes

- **No Backend Required** - All functionality works with mock data
- **Mock Duration** - Each scenario takes ~11 seconds to complete
- **Responsive** - Web works on all screen sizes
- **Cross-Platform** - Mobile runs iOS, Android, and web

---

## 🤝 Support

For issues or questions:
1. Check the **Troubleshooting** section above
2. Review the [frontend PRD](./frontend/frontend_prd.md)
3. Check [design system](./frontend/design_system.md)

---

## 📄 License

This project is created for hackathon demonstration purposes.

**Happy Hacking! 🚀**

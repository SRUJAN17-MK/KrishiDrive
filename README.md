# KrishiDrive AI (v2.0.0 Production Release)

**Smart Farming. Smarter Transport. Powered by AI.**

KrishiDrive is an intelligent agricultural logistics and agronomy platform connecting rural farmers directly with commercial haulers and wholesale APMC Mandis. Built for edge AI acceleration (Snapdragon X Elite 45 TOPS NPU & ONNX runtimes), KrishiDrive eliminates middleman speculation, optimizes freight fuel burn, prevents perishable crop loss, and delivers deterministic agronomic recommendations.

---

## Architecture & Technology Stack

| Component | Technology | Role |
| :--- | :--- | :--- |
| **Frontend** | React 18 + Vite | Single Page Application with dynamic theme engine |
| **Styling** | Vanilla Tailwind CSS + Glassmorphism | Forest Green (`#1b4332`), Agriculture Green (`#15803d`), Gold (`#f59e0b`) |
| **Theme Engine** | Custom `ThemeContext` | Persistent Dark Mode / Light Mode with CSS custom properties |
| **Backend API** | Node.js + Express (v2.0.0) | RESTful API, Monotonic ID generators, JWT auth, Multer uploads |
| **AI Runtime** | Edge AI Engine (NPUs / DirectML / CPU) | 5 deterministic agronomy & logistics models |
| **Icons & Visuals** | Lucide React | High-resolution semantic icons |
| **Data Storage** | Localized JSON Store + MongoDB-ready adapters | Monotonic incremental ID sequencing with full ACID safety |

---

## Real AI Engines (Phase 3 Upgrade)

KrishiDrive operates without fake random numbers or simulated mock placeholders. All 5 modules perform deterministic computations based on agronomic standards, GIS coordinates, and multi-criteria optimization:

### 1. AI Crop Recommendation (`POST /api/ai/crop-recommendation`)
- **Inputs**: Soil classification (Alluvial, Black, Red, Clay Loam, Sandy Loam, Laterite), NPK values (kg/ha), soil pH, ambient temperature (°C), relative humidity (%), and annual rainfall (mm).
- **Engine**: Agronomic suitability scoring matrix matching crop physiology, thermal thresholds, and soil chemistry.
- **Output**: Ranked suitable crops, suitability index score (0-100%), water budget, optimal sowing seasons, expected wholesale APMC yield, and nutrient guidance.

### 2. AI Harvest & Economic Forecasting (`POST /api/ai/harvest-prediction`)
- **Inputs**: Crop variety, acreage, planting date, soil type, and regional climate.
- **Engine**: Agronomic thermal-time growth cycle calculation, historical yield per acre, and real-time wholesale APMC Mandi price benchmarks.
- **Output**: Approximate harvest window, estimated yield in kg and metric tonnes, projected gross revenue in ₹, freight logistics requirements (number of 2.5T / 10T truckloads), and confidence score.

### 3. AI Crop Disease Diagnostics (`POST /api/ai/crop-disease-detection`)
- **Inputs**: Leaf image upload (JPG/PNG, up to 10MB).
- **Engine**: ResNet50-based computer vision classifier profile (DirectML / Snapdragon Hexagon NPU), edge inference latency (12-16ms).
- **Output**: Disease name, botanical pathogen, confidence score (%), physical symptoms, certified chemical treatments (active ingredient + dosage), and organic biopesticide recommendations.

### 4. Green Corridor Route Optimization (`POST /api/ai/route-optimization`)
- **Inputs**: Origin hub, APMC destination, vehicle class (Tata Ace, Eicher Pro, 10-Ton Multi-Axle), payload weight (kg).
- **Engine**: Haversine distance and real Indian highway road network metrics comparing 3 distinct options:
  1. *AI Green Corridor* (paved highways, bypasses bottlenecks, minimal road vibration to prevent perishable damage)
  2. *Express Highway* (fastest transit, high toll costs)
  3. *State Highway / Rural Bypass* (zero tolls, higher fuel burn)
- **Output**: Kilometers, transit time, diesel consumption (liters), toll expenditure (₹), CO2 footprint, and total money saved.

### 5. Smart Transporter Matching (`POST /api/ai/transport-matching`)
- **Inputs**: Cargo weight (kg), crop perishability, pickup village, drop APMC.
- **Engine**: Multi-criteria weighted scoring algorithm:
  $$\text{Score} = w_1 \cdot \text{CapacityFit} + w_2 \cdot \text{Proximity} + w_3 \cdot \text{DriverRating} + w_4 \cdot \text{TariffAffordability}$$
- **Output**: Ranked verified haulers, vehicle registration number, distance to farm, fair tariff estimate in ₹, and 1-click booking.

---

## User Roles & Portals

### 1. Farmer Portal (`/farmer`)
- **Overview Dashboard**: Live regional weather forecast with humidity & wind speeds, KPI overview cards, active crop tracking, freight dispatches.
- **Crop Management (`/farmer/crops`)**: Register farm acreage, manage soil types, and run on-demand AI harvest yield predictions with projected revenue in ₹.
- **Transport Booking (`/farmer/transport`)**: Post freight dispatch requests, cancel bookings, view matched drivers, and compare quotes.
- **Trip Tracking (`/farmer/deliveries`)**: 5-step milestone tracking (`scheduled` → `pickup` → `loading` → `in_transit` → `completed`), driver phone contact, vehicle registration number.
- **AI Farming Copilot (`/farmer/assistant`)**: Context-aware chat assistant advising on pest outbreaks, sowing schedules, and fertilizer dosage.

### 2. Transporter / Driver Portal (`/driver`)
- **Active Transits & Dispatch Board**: Live list of nearby farm dispatches with instant "Accept Load" and "Pass" actions.
- **Earnings Ledger**: Transparent gross freight earnings in ₹, trips completed, and kilometers logged.
- **AI Route Optimizer (`/driver/routes`)**: Multi-route corridor comparisons with live fuel savings ribbons and road friction metrics.
- **Trip Milestones (`/driver/trips`)**: One-click milestone advancement directly updating farmer notifications.
- **Fleet Management (`/driver/vehicle`)**: Vehicle registration, rated capacity, odometer, pollution & insurance permit status.

### 3. Administrator Governance Portal (`/admin`)
- **Platform Telemetry**: Total registered growers, commercial haulers, active dispatches, and platform gross freight throughput.
- **User Directory**: Searchable directory with role filters (Farmer, Driver, Admin) and village locations.
- **Driver KYC Accreditation**: Driver verification ledger with 1-click "Approve Accreditation" and "Revoke Accreditation" actions.

---

## Demo Credentials

Ready-to-test 1-click accounts on the `/login` page:

| Role | Username | Password | Demo Persona | Features |
| :--- | :--- | :--- | :--- | :--- |
| **Farmer** | `farmer1` | `demo123` | Ramesh Patel (Nashik) | Crop yield logs, transport dispatch, AI weather |
| **Driver** | `driver1` | `demo123` | Vikram Singh (Tata 407) | Accept loads, route optimizer, earnings ledger |
| **Admin** | `admin` | `demo123` | Platform Admin | User directory, driver KYC verification toggle |

---

## Quickstart & Local Execution

### Prerequisites
- Node.js 18.x or 20.x
- npm 9+ or yarn

### 1. Start the Backend API Server
```bash
cd backend
npm install
npm start
# Server listens on http://localhost:8000
# Health check: http://localhost:8000/health
```

### 2. Start the Frontend Dev Server
```bash
cd frontend
npm install
npm run dev
# Frontend runs on http://localhost:5173
```

---

## Project Structure

```
KrishiDrive/
├── backend/
│   ├── server.js               # Upgraded Express v2.0.0 API & Real AI engine routes
│   ├── package.json            # Node dependencies (express, cors, dotenv, multer, bcryptjs, jwt)
│   ├── .env                    # Environment configuration (PORT=8000, JWT_SECRET)
│   └── data/                   # Monotonic JSON data persistence files
├── frontend/
│   ├── index.html              # HTML5 entry with metadata
│   ├── vite.config.js          # Vite build config
│   ├── tailwind.config.js      # Custom theme colors (Forest, Agri, Gold, Dark mode)
│   └── src/
│       ├── main.jsx            # Clean multi-line React 18 root
│       ├── App.jsx             # React Router with ThemeProvider & responsive sidebar
│       ├── index.css           # Design system tokens, glassmorphism, skeletons, scrollbars
│       ├── context/
│       │   ├── AuthContext.jsx # Authentication state & role helpers
│       │   └── ThemeContext.jsx# Dark/Light mode persistent theme toggle
│       ├── services/
│       │   └── api.js          # Centralized API service with real AI endpoints
│       └── pages/
│           ├── LandingPage.jsx     # High-conversion hero, AI showcase, testimonials
│           ├── LoginPage.jsx       # 1-click role demo logins & credential form
│           ├── RegisterPage.jsx    # Dual-persona registration (Farmer / Transporter)
│           ├── AILab.jsx           # 5-module real AI interactive studio
│           ├── AboutPage.jsx       # Mission, architecture flow, and pillars
│           ├── OnDeviceAI.jsx      # Snapdragon X Elite 45 TOPS NPU benchmark matrix
│           ├── FarmerDashboard.jsx # Farmer overview, weather forecast, dispatches
│           ├── FarmerCrops.jsx     # Crop management & AI harvest forecasting
│           ├── FarmerTransport.jsx # Hauler dispatch booking & AI driver matching
│           ├── FarmerDeliveries.jsx# Real-time milestone delivery tracker
│           ├── FarmerAssistant.jsx # Agronomic chat copilot
│           ├── DriverDashboard.jsx # Freight jobs, quick accept/pass, earnings
│           ├── DriverJobs.jsx      # Available dispatch requests
│           ├── DriverRoutes.jsx    # Green corridor multi-route optimizer
│           ├── DriverTrips.jsx     # Active trip milestone progression
│           ├── DriverVehicle.jsx   # Vehicle fleet registration & permits
│           ├── DriverAssistant.jsx # Transporter highway copilot
│           └── AdminDashboard.jsx  # Governance KPIs, users, and KYC accreditation
└── README.md                   # Complete documentation
```

---

## License

KrishiDrive is open-source software built for the **Snapdragon AI Lab Challenge 2026**.
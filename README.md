# SafeStack 🛡️

**AI-Powered Workplace Safety Monitoring System**

SafeStack is a real-time video analysis platform that uses Google Gemini AI to detect OSHA safety violations in workplace environments. It monitors camera feeds, identifies policy violations, and alerts safety managers with evidence and AI-generated remediation suggestions.

![SafeStack Dashboard](https://img.shields.io/badge/Status-Active-brightgreen) ![Next.js](https://img.shields.io/badge/Next.js-14-black) ![Python](https://img.shields.io/badge/Python-3.10+-blue) ![Gemini](https://img.shields.io/badge/AI-Gemini_3_Pro-4285F4)

---

## ✨ Features

### 🎥 Real-Time Video Monitoring
- Multi-camera grid view with live video feeds
- Automatic video chunk capture and analysis (configurable intervals)
- Camera status indicators (idle, analyzing, alert)

### 🤖 AI-Powered Violation Detection
- **Gemini 3 Pro** analyzes video footage for safety violations
- Automatic frame extraction at violation timestamps
- Detects 30+ OSHA safety policies across 3 severity levels
- Deduplication to report only the most significant instance of each violation type

### 🚨 Smart Alert System
- Real-time alert stream with severity-based categorization
- Evidence images captured at the moment of violation
- **AI-generated "fixed" images** showing how the scene should look after remediation
- Detailed violation explanations with reasoning

### 📧 Notifications
- Email alerts via Resend for critical violations
- Configurable alert recipients

### 🔧 Policy Management
- Comprehensive OSHA policy library with versioning
- **False positive feedback system** - users can report incorrect detections
- AI-powered policy amendment to reduce future false positives

### 📊 Analytics Dashboard
- Daily alert summaries by risk level
- Compliance percentage tracking
- Alert history with filtering and search

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Next.js Frontend                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ Camera Grid │  │Alert Stream │  │  Analytics Panel    │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└────────────────────────────┬────────────────────────────────┘
                             │ API Routes
┌────────────────────────────▼────────────────────────────────┐
│                   FastAPI Backend                            │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐   │
│  │Video Analysis│  │Frame Extract │  │ Policy Manager  │   │
│  │ (Gemini AI)  │  │  (OpenCV)    │  │                 │   │
│  └──────────────┘  └──────────────┘  └─────────────────┘   │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐   │
│  │    SQLite    │  │   Supabase   │  │     Resend      │   │
│  │   Database   │  │   Storage    │  │     Email       │   │
│  └──────────────┘  └──────────────┘  └─────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ 
- **Python** 3.10+
- **Google Cloud API Key** (with Gemini API access)
- **Supabase Account** (for image storage)
- **Resend Account** (optional, for email notifications)

### 1. Clone the Repository

```bash
git clone https://github.com/Pkama07/safe-stack.git
cd safe-stack
```

### 2. Install Dependencies

**Frontend (Next.js):**
```bash
npm install
```

**Backend (Python):**
```bash
cd database
pip install -r requirements.txt
cd ..
```

### 3. Environment Setup

Create a `.env.local` file in the project root:

```env
# Google Gemini API
GOOGLE_CLOUD_KEY=your_gemini_api_key

# Supabase Storage
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_supabase_anon_key

# Email Notifications (optional)
RESEND_API_KEY=your_resend_api_key
ALERT_EMAIL_RECIPIENT=safety@yourcompany.com

# Backend URL (for Next.js API routes)
BACKEND_URL=http://localhost:8000
```

### 4. Initialize the Database

```bash
cd database
python setup_database.py
cd ..
```

### 5. Import OSHA Policies

```bash
cd database
python import_policies.py
cd ..
```

### 6. Start the Application

**Terminal 1 - Backend Server:**
```bash
cd database
python server.py
# Or: uvicorn server:app --reload
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Project Structure

```
safe-stack/
├── app/                      # Next.js App Router
│   ├── api/                  # API Routes (proxy to backend)
│   │   ├── alerts/           # Alert CRUD operations
│   │   ├── analyze-video/    # Video analysis endpoint
│   │   ├── amend-policy/     # Policy amendment
│   │   └── policies/         # Policy management
│   ├── alerts/[id]/          # Alert detail page
│   ├── globals.css           # Global styles (Tailwind)
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Main dashboard
├── components/               # React Components
│   ├── AlertCard.tsx         # Individual alert display
│   ├── AlertStream.tsx       # Real-time alert feed
│   ├── CameraFeed.tsx        # Single camera component
│   ├── CameraGrid.tsx        # Multi-camera layout
│   ├── DailyAlerts.tsx       # Daily statistics widget
│   ├── FeedbackModal.tsx     # False positive reporting
│   ├── Header.tsx            # Navigation header
│   └── ...
├── database/                 # Python Backend
│   ├── server.py             # FastAPI application
│   ├── setup_database.py     # Database migrations
│   ├── import_policies.py    # Policy import script
│   └── requirements.txt      # Python dependencies
├── db/                       # SQLite database
│   └── safestack.db
├── lib/                      # Shared utilities
│   ├── alerts.ts             # Alert helpers
│   ├── gemini.ts             # Gemini AI client
│   ├── policies.ts           # Policy utilities
│   ├── types.ts              # TypeScript types
│   └── video-utils.ts        # Video processing
├── policies_latest.json      # Current policy definitions
└── policies_v*.json          # Policy version history
```

---

## 🔒 Safety Policies

SafeStack monitors for **30+ OSHA safety policies** across three severity levels:

### Severity 1 (Low Risk) 🟡
- Poor housekeeping and walking-working surfaces
- Blocked exits and emergency equipment
- Unsafe storage and pallet stacking
- Minor electrical hazards
- Inadequate PPE use

### Severity 2 (Medium Risk) 🟠
- Unprotected work at height (≤6 ft)
- Machine guarding deficiencies
- Incomplete lockout/tagout
- Unsafe forklift operation
- Significant chemical handling violations

### Severity 3 (High Risk) 🔴
- Unprotected work at height (>6 ft)
- Zero lockout/tagout during hazardous servicing
- Bypassed critical machine guarding
- Confined space entry without protection
- Critical electrical hazards

---

## 🔌 API Reference

### Video Analysis

```http
POST /api/analyze-video
Content-Type: multipart/form-data

video: <binary file>
camera_id: string
chunk_index: number
```

**Response:**
```json
{
  "video_id": 123,
  "violations_found": 2,
  "alerts_created": 2,
  "alerts": [
    {
      "alert_id": 456,
      "policy_name": "Poor Housekeeping",
      "severity": "Severity 1",
      "video_timestamp": "00:15",
      "description": "...",
      "image_url": "..."
    }
  ]
}
```

### Alerts

```http
GET /api/alerts                    # List all alerts
GET /api/alerts/:id                # Get alert details
DELETE /api/alerts/:id             # Delete alert
```

### Policies

```http
GET /api/policies                  # List all policies
POST /api/amend-policy             # Amend policy from feedback
```

---

## 🛠️ Configuration

### Video Capture Settings

In `app/page.tsx`:

```typescript
const CHUNK_DURATION_MS = 5000     // Video chunk length (5 seconds)
const CHUNK_INTERVAL_MS = 15000    // Time between captures (15 seconds)
const MAX_PARALLEL_UPLOADS = Infinity  // Concurrent upload limit
```

### Camera Configuration

```typescript
const initialCameras: Camera[] = [
  { 
    id: '1', 
    name: 'Loading Dock B - Cam 1', 
    location: 'Loading Dock B', 
    status: 'idle', 
    streamUrl: 'https://your-video-url.mp4' 
  },
  // Add more cameras...
]
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the ISC License.

---

## 🙏 Acknowledgments

- [Google Gemini](https://ai.google.dev/) for AI-powered video analysis
- [Next.js](https://nextjs.org/) for the React framework
- [FastAPI](https://fastapi.tiangolo.com/) for the Python backend
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Supabase](https://supabase.com/) for storage
- [Resend](https://resend.com/) for email notifications

---

<p align="center">
  Built with ❤️ for workplace safety
</p>

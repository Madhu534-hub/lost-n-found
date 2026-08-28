TraceIt/
├── frontend/                         # React + Vite user interface
│   ├── src/
│   │   ├── components/               # Reusable UI components
│   │   │   ├── CameraCapture.jsx
│   │   │   ├── CampusMap.jsx
│   │   │   ├── ChatDrawer.jsx
│   │   │   ├── MatchCard.jsx
│   │   │   ├── Navbar.jsx
│   │   │   ├── SmartIntakeModal.jsx
│   │   │   ├── VerificationModal.jsx
│   │   │   └── ...
│   │   ├── context/                  # Authentication and notifications
│   │   │   ├── AuthContext.jsx
│   │   │   └── NotificationContext.jsx
│   │   ├── i18n/
│   │   │   └── i18n.js               # Internationalisation setup
│   │   ├── pages/                    # Main application screens
│   │   │   ├── LandingPage.jsx
│   │   │   ├── BrowseReportsPage.jsx
│   │   │   ├── ReportItemPage.jsx    # Three-step report form
│   │   │   ├── MyReportsPage.jsx
│   │   │   ├── LeaderboardPage.jsx
│   │   │   └── AdminDashboardPage.jsx
│   │   ├── services/
│   │   │   └── api.js                # Backend API client
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
├── backend/                          # Express + SQLite API
│   ├── routes/                       # API route handlers
│   │   ├── admin.js
│   │   ├── auth.js
│   │   ├── chat.js
│   │   ├── leaderboard.js
│   │   ├── matches.js
│   │   ├── reports.js
│   │   └── verification.js
│   ├── services/                     # Business and AI logic
│   │   ├── gemini.js
│   │   ├── matchingEngine.js
│   │   └── seedData.js
│   ├── tests/
│   │   ├── e2e.test.js
│   │   ├── features.test.js
│   │   └── matching.test.js
│   ├── uploads/                      # User-uploaded report photos
│   ├── database.js                   # SQLite connection/setup
│   ├── server.js                     # Express server entry point
│   ├── traceit.db                    # SQLite database
│   └── package.json
│
└── README.md

# Status Focus - Study Activity Tracker with MySQL Backend

A modern, full-featured study tracker with real-time focus monitoring, MySQL database integration, break management, and comprehensive reporting.

**Frontend**: http://localhost:3001  
**Backend API**: http://localhost:5000

---

## ✨ Key Features

### 🎯 Focus Tracking
- ✅ Track study sessions across 6 subjects (Maths, Science, Coding, Reading, Revision, Other)
- ✅ Real-time MM:SS session timer
- ✅ 5-minute smart break system with separate time tracking
- ✅ Start/Stop controls with one-click operation

### 📊 Real-Time Focus Graph
- ✅ Live line chart updating every second (0-100 focus level)
- ✅ 60-second sliding window view
- ✅ Smooth Framer Motion animations
- ✅ Instant visual feedback on distractions

### 🧠 Intelligent Distraction Detection
Your focus level responds naturally:

| Event | Impact | Recovery |
|-------|--------|----------|
| Idle (2+ seconds) | +1.5/sec | Gradual increase |
| Mouse/Scroll activity | -25 points | +0.5-1.5/sec |
| Tab switch/Window blur | -35 points | Gradual recovery |
| Continuous blur | -2/sec | Holds low until active |

### 💾 Database Integration
- ✅ MySQL backend (create, read, update)
- ✅ Auto-create database and tables on first run
- ✅ Automatic daily statistics aggregation
- ✅ Subject-wise cumulative tracking
- ✅ Fallback to LocalStorage if DB unavailable

### 📈 Reports & Analytics
- ✅ 30-day daily statistics bar chart
- ✅ CSV export of all sessions
- ✅ Weekly summary breakdown
- ✅ Summary stats: Total hours, subjects, best subject, breaks taken

### 🎨 Premium UI/UX
- ✅ Dark theme with gradient backgrounds
- ✅ Glassmorphism (backdrop blur) design
- ✅ Smooth animations (Framer Motion)
- ✅ Real-time status indicator (Focused/Distracted/Idle)
- ✅ Mobile-first responsive layout
- ✅ Color-coded feedback system

---

## 🛠 Tech Stack

### Frontend
- React 19 with Hooks
- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS (dark mode)
- Recharts (graphs)
- Framer Motion (animations)

### Backend
- Node.js + Express.js
- MySQL 2 (connection pooling)
- dotenv (config)
- CORS support

### Database
- MySQL 5.7+
- Auto-generated schema
- Connection pooling

---

## 📦 Installation

### 1️⃣ Prerequisites
- **Node.js** 18+ [Download](https://nodejs.org/)
- **MySQL** running locally [Download](https://www.mysql.com/downloads/)
- **Git** (optional)

### 2️⃣ Clone/Setup
```bash
cd path/to/Study\ Tracker
```

### 3️⃣ Install Dependencies
```bash
npm install
```

### 4️⃣ Configure Environment
Edit `.env.local`:

```env
# MySQL Connection
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=123456789      # ← Your MySQL password
DB_NAME=status_focus

# Server Config
SERVER_PORT=5000
NEXT_PUBLIC_API_URL=http://localhost:5000

NODE_ENV=development
```

⚠️ **Important**: The backend will automatically create the database and tables on first startup.

### 5️⃣ Start Development
```bash
npm run dev
```

Opens in two terminals:
- **Next.js Frontend**: http://localhost:3001
- **Express Backend**: http://localhost:5000

---

## 🚀 How to Use

### Starting a Focus Session

1. **Select Subject** → Choose from dropdown
2. **Click ▶ Start Focus** → Timer begins
3. **Work naturally** → Graph updates real-time
4. **Stay focused** → Focus level rises with inactivity
5. **Avoid distractions** → Graph drops when scrolling/switching tabs
6. **Click ◼ Stop Focus** → Session saved to database

### Taking Breaks

1. While focused, click **☕ Take Break (5min)**
2. Countdown timer displays
3. Click **End Break Now** to skip
4. Break time auto-tracked separately

### Viewing Reports

1. Click **📊 Reports** button (top right)
2. See 30-day bar chart with focus time and sessions
3. Summary cards show: Total hours, subjects, best subject, breaks
4. Click **← Focus** to return

### Exporting Data

1. Click **⬇ Export CSV** (top right)
2. Downloads `study-data.csv` file
3. Open in Excel/Google Sheets
4. Contains: Date, Subject, Duration, Focus Level, Break Time

---

## 📊 Database Schema

### `study_sessions` Table
```sql
id              INT (Primary Key)
subject         VARCHAR(50)
duration        INT (minutes)
focus_level     FLOAT (0-100)
break_duration  INT (minutes)
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

### `daily_stats` Table
```sql
id                INT
date              DATE (UNIQUE)
total_focus_time  INT (minutes)
total_break_time  INT (minutes)
sessions_completed INT
```

### `subject_stats` Table
```sql
id            INT
subject       VARCHAR(50) (UNIQUE)
total_time    INT (minutes)
sessions_count INT
```

---

## 🔌 API Endpoints

### Create Session
```
POST /api/sessions
Body: {
  "subject": "Coding",
  "duration": 45,
  "focus_level": 78,
  "break_duration": 5
}
```

### Get Stats
```
GET /api/stats              → All subject stats
GET /api/daily-stats        → Last 30 days
GET /api/weekly-summary     → Weekly breakdown
GET /api/sessions           → Last 100 sessions
```

### Export
```
GET /api/export/csv         → Download CSV file
```

### Health Check
```
GET /api/health             → {"status": "ok"}
```

---

## 📱 Responsive Design

| Device | Layout | Columns |
|--------|--------|---------|
| Mobile (<768px) | Stacked | 1 |
| Tablet (768-1024px) | 2-col | 2 |
| Desktop (>1024px) | 3-col | 3 |

---

## 🎯 Focus Level Behavior

### Scenario 1: Perfect Study Session
```
Time   Activity        Level   Note
0s     Start           50      Baseline
15s    Idle            65      +1.5/sec
30s    Still idle      80      Continuing
45s    Still idle      95      Approaching max
60s    Still idle      100     Maximum focus
```

### Scenario 2: Getting Distracted
```
Time   Activity        Level   Note
0s     Focused         85      
5s     Scroll page     60      -25 points (distraction)
6s     Stop scrolling  61      +1 recovery
15s    Back focused    75      Recovering
```

### Scenario 3: Tab Switch
```
Time   Activity        Level   Note
0s     Focused         100     
1s     Switch tabs     65      -35 points (major distraction)
2s     Return window   64      -2/sec while blurred
5s     Back to focus   75      Recovery begins
```

---

## 🔒 Privacy & Security

- ✅ **Frontend-first**: Data stored locally in browser first
- ✅ **Optional DB**: MySQL backup is optional
- ✅ **No cloud sync**: Your data stays local
- ✅ **No analytics**: Zero tracking/telemetry
- ✅ **Transparent**: Full source code available

---

## 🐛 Troubleshooting

### "Cannot connect to database"
```
Solution:
1. Ensure MySQL is running
2. Check credentials in .env.local
3. Verify DB user has CREATE permission
```

### "Port 5000 already in use"
```env
# Change in .env.local
SERVER_PORT=5001
```

### "Graph not updating"
```
Solution:
1. Check browser console (F12)
2. Clear cache (Ctrl+Shift+Delete)
3. Ensure JavaScript enabled
4. Restart both servers
```

### "Sessions not saving to database"
```
Solution:
1. Check backend logs in terminal
2. Verify MySQL connection in .env.local
3. Backend falls back to localStorage
4. Data will sync when DB reconnects
```

---

## 📁 Project Structure

```
Study Tracker/
├── app/
│   ├── page.tsx              # Main React component
│   ├── layout.tsx            # Root layout
│   └── globals.css           # Tailwind + custom styles
├── server/
│   └── index.js              # Express backend
├── public/                   # Static files
├── .env.local                # Configuration
├── package.json              # Dependencies
├── tsconfig.json             # TypeScript config
├── tailwind.config.js        # Tailwind CSS
├── next.config.js            # Next.js config
└── README.md                 # Documentation
```

---

## 🚀 Production Deployment

### Build
```bash
npm run build
npm start
```

### Deploy to Vercel (Recommended)
```bash
npm i -g vercel
vercel deploy
```

### Deploy to Heroku
```bash
heroku create my-app
git push heroku main
```

### Database Migration
- Use managed service: AWS RDS, PlanetScale, or Google CloudSQL
- Update `.env` with production credentials
- Server auto-creates tables on first run

---

## 📈 Performance Tips

1. **Take Regular Breaks** → Every 25-30 minutes
2. **Eliminate Distractions** → Close unnecessary tabs
3. **Full Screen Mode** → Press F11
4. **Keep Phone Away** → Physical distractions matter
5. **Review Weekly** → Check progress in Reports tab

---

## 🔄 Reset All Data

### Option 1: Database Reset
```sql
-- In MySQL Client
DELETE FROM study_sessions;
DELETE FROM daily_stats;
DELETE FROM subject_stats;
```

### Option 2: LocalStorage Clear
```javascript
// In browser console (F12)
localStorage.clear()
location.reload()
```

### Option 3: Full Reset
```bash
# Stop servers
npm run dev  # Ctrl+C

# Delete database
mysql -u root -p123456789 -e "DROP DATABASE status_focus;"

# Restart - new DB created automatically
npm run dev
```

---

## 📚 Learning Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Hooks Guide](https://react.dev/reference/react)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Framer Motion](https://www.framer.com/motion/)
- [Recharts Documentation](https://recharts.org/)
- [Express.js Handbook](https://expressjs.com/)
- [MySQL Documentation](https://dev.mysql.com/doc/)

---

## 🎓 Use Cases

- 👨‍🎓 **Students** - Track study time by subject
- 👨‍💻 **Developers** - Monitor coding session focus
- 📚 **Teachers** - Understand student work patterns
- 💼 **Professionals** - Improve deep work sessions
- 🏋️ **Fitness** - Track research study sessions

---

## 🤝 Contributing

Found an issue? Have an idea? Share it!

1. Report bugs with reproduction steps
2. Suggest features with use cases
3. Submit pull requests for improvements

---

## 💡 Roadmap

- [ ] Pomodoro mode (auto 25min + 5min cycle)
- [ ] Achievement badges & streaks
- [ ] Weekly email reports
- [ ] Custom break durations
- [ ] Dark/Light theme toggle
- [ ] Audio notifications
- [ ] Mobile app (React Native)
- [ ] Cloud sync option
- [ ] Focus time goals
- [ ] Group/class tracking

---

## 📞 Support

**Issues?** Try these:
1. ✅ Restart both servers
2. ✅ Check `.env.local` config
3. ✅ Ensure MySQL is running
4. ✅ Clear browser cache
5. ✅ Check browser console (F12)

---

## 📜 License

Open source • Personal & Educational Use

---

## 🙏 Credits

Built with love for students and focused workers worldwide.

**Status Focus** - Stay focused, achieve more 💪

*Last Updated: February 2026 | Version: 1.0.0*

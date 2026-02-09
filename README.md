# Status Focus - Study Activity Tracker

A modern, beautiful study activity tracker built with Next.js, React, Tailwind CSS, and Recharts.

## Features

### Core Functionality
- **Focus/Productivity Tracking** - Track study sessions across 6 subjects (Maths, Science, Coding, Reading, Revision, Other)
- **Start/Stop Controls** - Simple one-click focus session management
- **Session Timer** - Displays elapsed time in MM:SS format
- **Subject-wise Statistics** - Track total focus time per subject with persistent localStorage

### 🎥 Video Call Feature (NEW!)
- **Study Together** - Peer-to-peer video calls with friends while studying
- **Real-Time Video Streams** - WebRTC-based direct video connection
- **Room-Based Sessions** - Create or join study rooms with unique IDs
- **Media Controls** - Toggle camera and microphone on/off
- **Multiple Participants** - Support for several concurrent video participants
- **Privacy Focused** - End-to-end encrypted, no server recording
- See [VIDEO_CALL_GUIDE.md](VIDEO_CALL_GUIDE.md) for full documentation

### Real-Time Focus Graph
- **Live Line Chart** - Updates every second showing focus level (0-100)
- **60-Second Sliding Window** - Shows only the last 60 seconds of data
- **Smooth Animations** - Framer Motion for fluid UI transitions

### Distraction Detection
The graph intelligently detects and responds to distractions:

**Focus Level Increases:**
- While idle and focused (+1.5/sec when no activity for >2 seconds)
- Slowly increases up to 100%

**Focus Level Decreases (Sharp Drop):**
- **Mouse/Scroll Activity**: -25 points (indicates distraction)
- **Window Blur/Tab Switch**: -35 points (immediate focus loss)
- **Continuous Blur**: -2 points per second (maintains low level)

**Recovery:**
- Focus level slowly recovers when distractions stop

### Premium UI/UX
- Dark theme with gradient backgrounds
- Glassmorphism design with backdrop blur effects
- Smooth animations and transitions
- Mobile-first responsive layout
- Real-time status indicator (Focused/Distracted)
- Color-coded visual feedback

## Tech Stack

- **React 19** with Hooks (useState, useEffect, useRef)
- **Next.js 15** (App Router)
- **TypeScript** for type safety
- **Tailwind CSS** for dark mode styling
- **Recharts** for real-time line graph
- **Framer Motion** for smooth animations
- **Local Storage API** for data persistence

## Getting Started

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the app.

## How to Use

1. **Select Subject** - Choose what you're studying from the dropdown
2. **Start Focus** - Click "Start Focus" to begin tracking
3. **Stay Focused** - The graph shows your focus level in real-time
4. **Avoid Distractions** - Watch the graph drop when you switch tabs or scroll
5. **Stop Session** - Click "Stop Focus" when done; time is added to subject statistics
6. **View Stats** - See total study time per subject in the statistics panel

## Data Persistence

Your study statistics are automatically saved to browser localStorage and persist across sessions.

## Production Build

```bash
npm run build
npm start
```

## Project Structure

```
app/
├── layout.tsx          # Root layout with metadata
├── page.tsx            # Main tracker component
├── globals.css         # Global styles and Tailwind
├── next-env.d.ts       # TypeScript Next.js declarations
next.config.js          # Next.js configuration
tsconfig.json           # TypeScript configuration
tailwind.config.js      # Tailwind CSS configuration
postcss.config.js       # PostCSS configuration
package.json            # Dependencies and scripts
```

## Features Breakdown

### Focus Level Mechanics
- **Base State**: Starts at 50 when session begins
- **Idle Mode**: +1.5 focus per second (max 100)
- **Activity Mode**: +0.5 focus per second (normal activity)
- **Distraction**: -25 (scrolling/mouse movement)
- **Tab Switch**: -35 (window blur)
- **Recovery**: Gradual increase when distraction stops

### Graph Specifications
- Updates every 1 second
- Maintains last 60 seconds of data
- Responsive to 0-100 focus level scale
- Smooth gradient line with tooltip

## Performance Optimizations

- Efficient state management with useRef for non-rendering values
- Interval cleanup on component unmount
- Graph data capped to 60 seconds (memory efficient)
- Debounced localStorage saves
- CSS animations instead of JS where possible

## Browser Compatibility

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Modern mobile browsers

## Future Enhancements

- Pomodoro mode (25min focus + 5min break)
- Focus streaks and achievements
- Daily/weekly summary reports
- Export study data as CSV
- Dark/Light theme toggle
- Audio notifications
- Goal setting and tracking
- Study session history

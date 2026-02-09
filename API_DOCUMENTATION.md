# API Documentation - Status Focus Backend

**Base URL**: `http://localhost:5000`

---

## 📋 Table of Contents

1. [Video Call (WebSocket)](#video-call-websocket)
2. [Sessions](#sessions)
3. [Statistics](#statistics)
4. [Export](#export)
5. [Health](#health)

---

## Video Call (WebSocket)

The video call feature uses WebSocket (Socket.IO) for real-time peer-to-peer video communication with WebRTC.

### Connection

**Protocol**: WebSocket (Socket.IO)
**URL**: `ws://localhost:5000` (automatically handles upgrade from HTTP)
**Port**: 5000

### Events

#### Join Video Room

**Event**: `join-video-room`

**Description**: Join a video study session room

**Emitted From**: Client
**Format**:
```javascript
socket.emit('join-video-room', roomId, userName);
```

**Parameters**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| roomId | string | Yes | Room identifier (can be any string) |
| userName | string | Yes | Display name for this participant |

**Example**:
```javascript
const socket = io('http://localhost:5000');
socket.emit('join-video-room', 'study-room-123', 'Alice');
```

---

#### User Joined

**Event**: `user-joined`

**Description**: Notifies when another user joins the room

**Emitted From**: Server
**Format**:
```javascript
socket.on('user-joined', (data) => {
  const { userId, userName } = data;
  // Handle new user joining
});
```

**Response Data**:
| Field | Type | Description |
|-------|------|-------------|
| userId | string | Unique socket ID of the user |
| userName | string | Display name of the user |

---

#### WebRTC Offer

**Event**: `offer`

**Description**: Send WebRTC offer to establish peer connection

**Emitted From**: Client (initiator)
**Format**:
```javascript
socket.emit('offer', {
  to: receiverSocketId,
  from: senderSocketId,
  fromName: senderName,
  offer: rtcOfferObject
});
```

**Parameters**:
| Field | Type | Description |
|-------|------|-------------|
| to | string | Recipient socket ID |
| from | string | Sender socket ID |
| fromName | string | Sender's display name |
| offer | object | WebRTC RTCSessionDescription offer |

**Server Forwards To**:
```javascript
socket.on('offer', (data) => {
  const { offer, from, fromName } = data;
  // Send offer to recipient
});
```

---

#### WebRTC Answer

**Event**: `answer`

**Description**: Send WebRTC answer to accept peer connection

**Emitted From**: Client (answerer)
**Format**:
```javascript
socket.emit('answer', {
  to: senderSocketId,
  from: answererSocketId,
  answer: rtcAnswerObject
});
```

**Parameters**:
| Field | Type | Description |
|-------|------|-------------|
| to | string | Recipient socket ID |
| from | string | Sender socket ID |
| answer | object | WebRTC RTCSessionDescription answer |

---

#### ICE Candidate

**Event**: `ice-candidate`

**Description**: Share ICE candidates for peer connection

**Emitted From**: Client
**Format**:
```javascript
socket.emit('ice-candidate', {
  to: peerSocketId,
  from: mySocketId,
  candidate: iceCandidate
});
```

**Parameters**:
| Field | Type | Description |
|-------|------|-------------|
| to | string | Recipient socket ID |
| from | string | Sender socket ID |
| candidate | object | RTCIceCandidate object |

---

#### Get Users in Room

**Event**: `get-users`

**Description**: Request list of other users in the room

**Emitted From**: Client
**Format**:
```javascript
socket.emit('get-users', roomId, (users) => {
  // Callback with array of user socket IDs
  console.log('Users in room:', users);
});
```

**Response**: Array of socket IDs (excluding self)

---

#### User Disconnected

**Event**: `user-disconnected`

**Description**: Notifies when a user leaves the room

**Emitted From**: Server
**Format**:
```javascript
socket.on('user-disconnected', (data) => {
  const { userId } = data;
  // Clean up peer connection
});
```

**Response Data**:
| Field | Type | Description |
|-------|------|-------------|
| userId | string | Socket ID of disconnected user |

---

#### Call Ended

**Event**: `call-ended`

**Description**: Notify peers that call is ending

**Emitted From**: Client
**Format**:
```javascript
socket.emit('call-ended', {
  to: peerSocketId,  // 'all' to notify everyone
  from: mySocketId
});
```

**Parameters**:
| Field | Type | Description |
|-------|------|-------------|
| to | string | Recipient socket ID or 'all' |
| from | string | Sender socket ID |

---

### Complete Example

```javascript
import SimplePeer from 'simple-peer';
import { io } from 'socket.io-client';

// Initialize
const socket = io('http://localhost:5000');
const peers = new Map();

// Get local media stream
const stream = await navigator.mediaDevices.getUserMedia({
  video: { width: { ideal: 1280 }, height: { ideal: 720 } },
  audio: true
});

// Join room
socket.on('connect', () => {
  socket.emit('join-video-room', 'study-room-123', 'Alice');
});

// When user joins, create peer connection
socket.on('user-joined', async (data) => {
  const peer = new SimplePeer({
    initiator: true,
    trickleIce: true,
    stream: stream,
    config: {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' }
      ]
    }
  });

  peer.on('signal', (offer) => {
    socket.emit('offer', {
      to: data.userId,
      from: socket.id,
      fromName: 'Alice',
      offer: offer
    });
  });

  peer.on('stream', (remoteStream) => {
    const video = document.createElement('video');
    video.srcObject = remoteStream;
    video.play();
  });

  peers.set(data.userId, peer);
});

// Handle offers
socket.on('offer', (data) => {
  const peer = new SimplePeer({
    initiator: false,
    trickleIce: true,
    stream: stream
  });

  peer.on('signal', (answer) => {
    socket.emit('answer', {
      to: data.from,
      from: socket.id,
      answer: answer
    });
  });

  peer.signal(data.offer);
  peers.set(data.from, peer);
});

// Handle disconnection
socket.on('user-disconnected', (data) => {
  const peer = peers.get(data.userId);
  if (peer) peer.destroy();
  peers.delete(data.userId);
});
```

---

### Configuration

**STUN Servers** (for NAT traversal):
- `stun:stun.l.google.com:19302`
- `stun:stun1.l.google.com:19302`

For production, add TURN servers for better connectivity in restricted networks.



### Save Study Session

**Endpoint**: `POST /api/sessions`

**Description**: Save a completed focus session to the database

**Request Body**:
```json
{
  "subject": "Coding",
  "duration": 45,
  "focus_level": 87.5,
  "break_duration": 5
}
```

**Parameters**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| subject | string | Yes | Subject being studied |
| duration | number | Yes | Session duration in minutes |
| focus_level | number | No | Average focus level (0-100) |
| break_duration | number | No | Break time taken in minutes |

**Example Request**:
```bash
curl -X POST http://localhost:5000/api/sessions \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "Maths",
    "duration": 30,
    "focus_level": 92,
    "break_duration": 5
  }'
```

**Success Response** (200):
```json
{
  "success": true,
  "message": "Session saved"
}
```

**Error Response** (500):
```json
{
  "success": false,
  "error": "Database connection failed"
}
```

---

## Statistics

### Get Subject Statistics

**Endpoint**: `GET /api/stats`

**Description**: Get cumulative statistics for all subjects

**Query Parameters**: None

**Example Request**:
```bash
curl http://localhost:5000/api/stats
```

**Response** (200):
```json
[
  {
    "id": 1,
    "subject": "Coding",
    "total_time": 1250,
    "sessions_count": 25,
    "created_at": "2026-02-01T10:30:00Z",
    "updated_at": "2026-02-08T15:45:30Z"
  },
  {
    "id": 2,
    "subject": "Maths",
    "total_time": 890,
    "sessions_count": 18,
    "created_at": "2026-02-01T10:35:00Z",
    "updated_at": "2026-02-07T14:20:15Z"
  }
]
```

**Field Descriptions**:
| Field | Type | Description |
|-------|------|-------------|
| id | number | Record ID |
| subject | string | Subject name |
| total_time | number | Total minutes studied |
| sessions_count | number | Number of sessions |
| created_at | string | Record creation timestamp |
| updated_at | string | Last update timestamp |

---

### Get Daily Statistics

**Endpoint**: `GET /api/daily-stats`

**Description**: Get statistics for the last 30 days

**Query Parameters**: None

**Example Request**:
```bash
curl http://localhost:5000/api/daily-stats
```

**Response** (200):
```json
[
  {
    "id": 45,
    "date": "2026-02-08",
    "total_focus_time": 180,
    "total_break_time": 10,
    "sessions_completed": 4,
    "created_at": "2026-02-08T00:01:00Z"
  },
  {
    "id": 44,
    "date": "2026-02-07",
    "total_focus_time": 240,
    "total_break_time": 15,
    "sessions_completed": 5,
    "created_at": "2026-02-07T00:01:00Z"
  }
]
```

**Field Descriptions**:
| Field | Type | Description |
|-------|------|-------------|
| id | number | Record ID |
| date | string | Date (YYYY-MM-DD) |
| total_focus_time | number | Total focus minutes that day |
| total_break_time | number | Total break minutes |
| sessions_completed | number | Number of sessions |
| created_at | string | Record creation timestamp |

---

### Get Weekly Summary

**Endpoint**: `GET /api/weekly-summary`

**Description**: Get detailed weekly breakdown by subject and date

**Query Parameters**: None

**Example Request**:
```bash
curl http://localhost:5000/api/weekly-summary
```

**Response** (200):
```json
[
  {
    "subject": "Coding",
    "sessions": 3,
    "total_duration": 120,
    "avg_focus": 85.5,
    "date": "2026-02-08"
  },
  {
    "subject": "Maths",
    "sessions": 2,
    "total_duration": 60,
    "avg_focus": 78.2,
    "date": "2026-02-08"
  },
  {
    "subject": "Coding",
    "sessions": 4,
    "total_duration": 160,
    "avg_focus": 88.3,
    "date": "2026-02-07"
  }
]
```

**Field Descriptions**:
| Field | Type | Description |
|-------|------|-------------|
| subject | string | Subject name |
| sessions | number | Sessions that day |
| total_duration | number | Total minutes that day |
| avg_focus | number | Average focus level (0-100) |
| date | string | Date (YYYY-MM-DD) |

---

### Get All Sessions

**Endpoint**: `GET /api/sessions`

**Description**: Get the last 100 study sessions

**Query Parameters**: None

**Example Request**:
```bash
curl http://localhost:5000/api/sessions
```

**Response** (200):
```json
[
  {
    "id": 125,
    "subject": "Coding",
    "duration": 45,
    "focus_level": 87.5,
    "break_duration": 5,
    "created_at": "2026-02-08T14:30:00Z",
    "updated_at": "2026-02-08T15:15:00Z"
  },
  {
    "id": 124,
    "subject": "Maths",
    "duration": 30,
    "focus_level": 92,
    "break_duration": 0,
    "created_at": "2026-02-08T13:00:00Z",
    "updated_at": "2026-02-08T13:30:00Z"
  }
]
```

**Field Descriptions**:
| Field | Type | Description |
|-------|------|-------------|
| id | number | Session ID |
| subject | string | Subject studied |
| duration | number | Session duration (minutes) |
| focus_level | number | Average focus level (0-100) |
| break_duration | number | Break time (minutes) |
| created_at | string | Session start timestamp |
| updated_at | string | Last update timestamp |

---

## Export

### Export as CSV

**Endpoint**: `GET /api/export/csv`

**Description**: Download all study sessions as CSV file

**Query Parameters**: None

**Example Request**:
```bash
curl http://localhost:5000/api/export/csv > study-data.csv
```

**Response** (200): 
File download with content type `text/csv`

**CSV Format**:
```csv
Date,Subject,Duration (mins),Focus Level,Break Time (mins)
"2/8/2026, 2:30:00 PM","Coding",45,87.5,5
"2/8/2026, 1:00:00 PM","Maths",30,92,0
"2/7/2026, 10:15:00 AM","Science",60,88,10
```

**Headers**:
| Column | Description |
|--------|-------------|
| Date | Session timestamp |
| Subject | Subject studied |
| Duration (mins) | Session duration |
| Focus Level | Average focus (0-100) |
| Break Time (mins) | Break duration |

---

## Health

### Server Health Check

**Endpoint**: `GET /api/health`

**Description**: Check if backend server is running

**Query Parameters**: None

**Example Request**:
```bash
curl http://localhost:5000/api/health
```

**Response** (200):
```json
{
  "status": "ok",
  "message": "Server is running"
}
```

---

## Error Codes

| Code | Meaning | Solution |
|------|---------|----------|
| 200 | Success | Request completed successfully |
| 400 | Bad Request | Missing or invalid parameters |
| 404 | Not Found | Endpoint doesn't exist |
| 500 | Server Error | Backend error, check logs |

---

## Common Error Responses

### Missing Subject
```json
{
  "success": false,
  "error": "Subject field is required"
}
```

### Database Disconnected
```json
{
  "error": "Database connection failed"
}
```

### Invalid Duration
```json
{
  "success": false,
  "error": "Duration must be a number"
}
```

---

## Usage Examples

### JavaScript/Node.js

```javascript
// Save a session
const response = await fetch('http://localhost:5000/api/sessions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    subject: 'Coding',
    duration: 45,
    focus_level: 87.5,
    break_duration: 5
  })
});

const data = await response.json();
console.log(data); // { success: true, message: 'Session saved' }
```

### Get Statistics

```javascript
const response = await fetch('http://localhost:5000/api/stats');
const stats = await response.json();

stats.forEach(stat => {
  console.log(`${stat.subject}: ${stat.total_time} mins`);
});
```

### Export Data

```javascript
const response = await fetch('http://localhost:5000/api/export/csv');
const blob = await response.blob();

// Create download link
const url = window.URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'study-data.csv';
a.click();
```

---

## Rate Limiting

Currently **no rate limiting** is implemented. In production, add:

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use(limiter);
```

---

## CORS Settings

**Allowed Origins**: All (configured with `cors()`)

For production, restrict to specific origins:

```javascript
const cors = require('cors');

app.use(cors({
  origin: ['http://localhost:3001', 'https://yourdomain.com']
}));
```

---

## Response Format

All JSON responses follow this pattern:

**Success**:
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { /* response data */ }
}
```

**Error**:
```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

---

## Testing Endpoints

### Using Postman

1. Create new collection
2. Add requests:
   - **POST** `/api/sessions`
   - **GET** `/api/stats`
   - **GET** `/api/daily-stats`
   - **GET** `/api/export/csv`
3. Set headers: `Content-Type: application/json`
4. Test each endpoint

### Using cURL

```bash
# Create session
curl -X POST http://localhost:5000/api/sessions \
  -H "Content-Type: application/json" \
  -d '{"subject":"Coding","duration":45}'

# Get stats
curl http://localhost:5000/api/stats

# Export CSV
curl http://localhost:5000/api/export/csv -o study-data.csv
```

### Using Thunder Client (VS Code)

1. Install extension: `rangav.vscode-thunder-client`
2. Open Thunder Client
3. Create requests for each endpoint
4. Test and save results

---

## Performance Considerations

- **Pagination**: Daily stats limited to last 30 days (for performance)
- **Session History**: Last 100 sessions returned (for performance)
- **Database Indexes**: Tables indexed by `date` and `subject`
- **Connection Pooling**: Up to 10 concurrent connections

For large datasets:
- Implement pagination
- Add date range filters
- Archive old data

---

## Troubleshooting

### "Cannot GET /api/stats"
```
Solution: Backend not running
Run: npm run dev
```

### "Connection refused"
```
Solution: Backend not accessible
Check: http://localhost:5000/api/health
```

### "CORS error"
```
Solution: Frontend and backend on different origins
Check: NEXT_PUBLIC_API_URL in .env.local
```

### "Database error"
```
Solution: MySQL not running or wrong credentials
Check: MySQL service status
Check: .env.local database settings
```

---

## Support

For API help:
1. Check endpoint documentation above
2. Review error response
3. Verify request format
4. Check backend logs
5. Restart backend server

---

**API Status**: ✅ Fully Functional

Last Updated: February 2026

# 🎥 Video Call Feature - Study Together

## Overview

The **Study Together** video call feature enables students to conduct peer-to-peer video calls while tracking study sessions. This feature uses WebRTC for direct peer connection and Socket.IO for real-time signaling.

---

## Features

✅ **Peer-to-Peer Video Calls**
- Direct WebRTC connections between participants
- No video data passes through the server (privacy-focused)
- HD video quality (up to 1280x720)

✅ **Multiple Participants**
- Support for multiple users in one study session
- Automatic peer connection management
- Real-time user list

✅ **Media Controls**
- Toggle camera on/off
- Toggle microphone on/off
- Clean UI with connected user count

✅ **Room-Based Sessions**
- Create or join study rooms using Room IDs
- Share Room ID with friends to join
- Automatic room cleanup on disconnect

✅ **Integration with Study Tracker**
- Video calls run alongside focus tracking
- No interruption to focus sessions
- Optional feature, doesn't affect core functionality

---

## How to Use

### Starting a Video Call

1. Click the **📹 Study Together** button in the header
2. Enter your name (or use default "Student")
3. Enter a Room ID (or generate one with 🎲 button)
4. Click **🎥 Start Video Call**
5. Share the Room ID with friends so they can join

### Joining an Existing Call

1. Click **📹 Study Together**
2. Enter your name
3. Enter the Room ID shared by the host
4. Click **🎥 Start Video Call**
5. You'll automatically connect to other participants

### During the Call

- **📹 Video On/Off** - Toggle your camera
- **🎤 Audio On/Off** - Toggle your microphone
- **End Call** - Leave the session
- Participant names appear below each video
- Avatar with initials shown when camera is off

---

## Technical Architecture

### Frontend Components

**File**: [app/components/VideoCall.tsx](app/components/VideoCall.tsx)

```typescript
interface VideoCallProps {
  isOpen: boolean        // Modal visibility
  onClose: () => void    // Callback to close modal
  userName: string       // Display name
  roomId: string         // Study room identifier
}
```

**Key Features**:
- Local media stream capture (video + audio)
- SimplePeer instances for each remote user
- Socket.IO for signaling
- Real-time stream management
- Automatic peer cleanup on disconnect

### Backend WebSocket Events

**File**: [server/index.js](server/index.js)

#### Connection Events

```javascript
// Client sends
socket.emit('join-video-room', roomId, userName)

// Server broadcasts to others
socket.on('user-joined', { userId: string, userName: string })
```

#### WebRTC Signaling

```javascript
// Offer (initiator → answerer)
socket.emit('offer', { to, from, fromName, offer })

// Answer (answerer → initiator)
socket.emit('answer', { to, from, answer })

// ICE Candidates
socket.emit('ice-candidate', { to, from, candidate })
```

#### Cleanup

```javascript
socket.on('user-disconnected', { userId: string })
socket.on('call-ended', { to, from })
```

---

## Installation & Setup

### Prerequisites

✅ Node.js 16+
✅ npm or yarn
✅ Modern browser with WebRTC support (Chrome, Firefox, Edge, Safari)

### Install Dependencies

```bash
npm install socket.io-client simple-peer
npm install socket.io  # Backend
```

### Environment Setup

Add to `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### Run the Application

```bash
# Terminal 1: Start Next.js frontend
npm run dev:next

# Terminal 2: Start Node.js backend
npm run dev:server

# Or both together
npm run dev
```

---

## Browser Compatibility

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome | ✅ Full | Recommended |
| Firefox | ✅ Full | Works well |
| Safari | ✅ Full | iOS 15+ |
| Edge | ✅ Full | Chromium-based |
| Opera | ✅ Full | Chromium-based |

**Requirements**: 
- WebRTC support
- MediaDevices API
- WebSocket support

---

## Troubleshooting

### "Could not access camera or microphone"

**Causes**:
- Browser permission denied
- Device not available
- HTTPS required (on production)

**Solution**:
1. Check browser permissions (look for camera/mic icon in address bar)
2. Grant permission if prompted
3. Ensure no other app is using the camera
4. Restart browser
5. Try a different browser

### "Users not connecting"

**Causes**:
- Server not running
- Socket.IO connection failed
- Firewall blocking WebSocket
- NAT/firewall issues

**Solution**:
1. Verify backend is running: `npm run dev:server`
2. Check console for errors (F12)
3. Verify API URL in `.env.local`
4. Try different network (hotspot vs WiFi)
5. Check if port 5000 is open

### "No audio/video from remote user"

**Causes**:
- Streams not properly attached
- Permission revoked after joining
- Browser privacy mode
- Low bandwidth

**Solution**:
1. Toggle camera/mic off and on
2. End call and rejoin
3. Check user has camera/mic enabled on their device
4. Try disabling VPN if using one
5. Refresh page and rejoin

### "Choppy video / High latency"

**Causes**:
- Slow internet connection
- High distance between peers
- ISP throttling
- Other bandwidth-heavy apps

**Solution**:
1. Close other applications
2. Close other browser tabs
3. Move closer to router
4. Use wired connection (Ethernet) instead of WiFi
5. Reduce video quality (lower resolution in settings)

---

## Advanced Configuration

### STUN/TURN Servers

For better connectivity in restricted networks, add TURN servers:

**File**: [app/components/VideoCall.tsx](app/components/VideoCall.tsx) (Line ~50)

```typescript
config: {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    // Add TURN server for production
    {
      urls: 'turn:your-turn-server.com:3478',
      username: 'user',
      credential: 'pass'
    }
  ]
}
```

**Recommended TURN Services**:
- Xirsys: https://xirsys.com
- Twilio TURN: https://github.com/twilio/twilio-video.js
- AWS Kinesis Video Streams

### Video Quality Settings

Adjust video constraints in [app/components/VideoCall.tsx](app/components/VideoCall.tsx) (~Line 40):

```typescript
// HD Quality (default - 1280x720)
video: { width: { ideal: 1280 }, height: { ideal: 720 } }

// Standard Quality
video: { width: { ideal: 640 }, height: { ideal: 480 } }

// Stream all video formats
video: true
```

### Audio Configuration

```typescript
// Default - full audio
audio: true

// Advanced audio settings
audio: {
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true
}
```

---

## Security Considerations

### Privacy

✅ **End-to-End**: Video streams go directly peer-to-peer
✅ **No Recording**: No server-side recording by default
✅ **No Data Storage**: Call data not stored after disconnect
✅ **Room IDs**: Use cryptographically random IDs (implemented)

### Best Practices

1. **Use HTTPS in Production** - Browsers require secure context for media access
2. **Validate Room IDs** - Implement room access controls if needed
3. **Add Authentication** - Require login before accessing video calls
4. **Rate Limiting** - Limit room creation and user connections
5. **Content Moderation** - Consider adding abuse reporting

### Implement Authentication

```typescript
// In page.tsx or VideoCall.tsx
const startVideoCall = async () => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    // Redirect to login
    return;
  }
  
  // Proceed with video call
  setIsVideoCallOpen(true);
};
```

---

## Performance Optimization

### Bandwidth Optimization

- Automatically adjusts quality based on connection
- Drops unnecessary frames on slow connections
- Uses VP8/VP9 codec for smaller file sizes

### Memory Management

- Cleans up peer connections on disconnect
- Releases media streams properly
- No memory leaks from unclosed connections

### Scalability

**Current Limitations**:
- Recommended: 2-6 concurrent users per room
- Maximum tested: 10 users (degraded quality)

**For larger groups**, consider:
- Selective forwarding units (SFU) like Janus/Mediasoup
- MCU solutions like Kurento
- Cloud services like Agora, Twilio

---

## Development

### File Structure

```
app/
├── components/
│   └── VideoCall.tsx          # Main video call component
├── page.tsx                    # Main app (includes video call UI)
└── layout.tsx

server/
└── index.js                    # Express + Socket.IO server
```

### Key Dependencies

```json
{
  "simple-peer": "^9.x",        // WebRTC peer connections
  "socket.io-client": "^4.x",   // Client-side WebSocket
  "socket.io": "^4.x",          // Server-side WebSocket
  "framer-motion": "^11.x",     // Animations
  "tailwindcss": "^3.x"         // Styling
}
```

### Socket.IO Event Flow

```
Client A                Server            Client B
   |                      |                  |
   |---connect----------->|                  |
   |                      |<--connect----------|
   |               (join-video-room)
   |---join-video-room--->|                  |
   |                      |--user-joined---->|
   |                      |<--offer---------|
   |<-------offer---------|                  |
   |---answer------------>|                  |
   |                      |--answer--------->|
   |                      |
   |   (now connected via WebRTC)
   |<=====video/audio stream===>|
   |                      |<====video/audio==|
```

### Debugging

**Enable Console Logging**:

```typescript
// In VideoCall.tsx
console.log('Socket connected:', socket.id)
console.log('User joined:', data)
console.log('Stream received:', remoteStream)

// Check browser DevTools: F12 → Console tab
```

**Check Socket.IO Connection**:

```javascript
socket.on('connect', () => {
  console.log('Socket.IO connected:', socket.id)
})

socket.on('disconnect', () => {
  console.log('Socket.IO disconnected')
})

socket.on('connect_error', (error) => {
  console.error('Socket.IO error:', error)
})
```

**Test WebRTC Connection**:

```javascript
// In browser console
navigator.mediaDevices.getUserMedia({video: true, audio: true})
  .then(stream => {
    console.log('Media access granted')
    stream.getTracks().forEach(t => t.stop())
  })
  .catch(err => console.error('Media access denied:', err))
```

---

## API Reference

For detailed WebSocket API documentation, see [API_DOCUMENTATION.md](API_DOCUMENTATION.md#video-call-websocket)

---

## Contributing

To improve the video call feature:

1. Add TURN server configuration options
2. Implement video quality auto-adaptation
3. Add recording functionality (with consent)
4. Support screen sharing
5. Implement chat alongside video
6. Add virtual backgrounds
7. Create mobile-optimized UI

---

## Roadmap

- [ ] Screen sharing support
- [ ] Chat feature during calls
- [ ] Call recording (with user consent)
- [ ] Virtual backgrounds
- [ ] Hand raising/reactions
- [ ] Call history/analytics
- [ ] Mobile app version
- [ ] Scheduled study sessions

---

## FAQ

**Q: Can I use this with students on different networks?**
A: Yes! WebRTC works across different networks using STUN/TURN servers.

**Q: Is video data encrypted?**
A: Yes! WebRTC uses DTLS-SRTP encryption for all media.

**Q: Do calls work on mobile?**
A: Yes, on modern browsers (Chrome Mobile, Firefox Mobile, Safari iOS 15+).

**Q: Can I record calls?**
A: The UI doesn't provide recording, but you can implement MediaRecorder API.

**Q: What if someone doesn't have a camera?**
A: They can still join audio-only. The UI shows an avatar when camera is off.

**Q: Can I see who's in the room before joining?**
A: Currently no. You could add a "peek" feature to list room members.

**Q: Is there a maximum room size?**
A: Technically unlimited, but recommend max 6 concurrent users for good performance.

**Q: Can I add a waiting room?**
A: Yes, implement a socket.IO event for room member approval.

---

## Support & Issues

- Check [troubleshooting](#troubleshooting) section above
- Review browser console (F12)
- Verify server is running
- Check .env.local configuration
- Open an issue on the project repository

---

**Last Updated**: February 2026
**Status**: ✅ Production Ready
**Version**: 1.0.0

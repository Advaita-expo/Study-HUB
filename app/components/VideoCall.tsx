'use client'

import { useEffect, useRef, useState } from 'react'
import SimplePeer from 'simple-peer'
import { io, Socket } from 'socket.io-client'
import { motion, AnimatePresence } from 'framer-motion'

interface RemotePeer {
  peerId: string
  peerName: string
  stream: MediaStream | null
}

interface VideoCallProps {
  isOpen: boolean
  onClose: () => void
  userName: string
  roomId: string
}

export default function VideoCall({ isOpen, onClose, userName, roomId }: VideoCallProps) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [remotePeers, setRemotePeers] = useState<Map<string, RemotePeer>>(new Map())
  const [isVideoOn, setIsVideoOn] = useState(true)
  const [isAudioOn, setIsAudioOn] = useState(true)
  const [connectedUsers, setConnectedUsers] = useState<number>(0)
  const [error, setError] = useState<string | null>(null)

  const socketRef = useRef<Socket | null>(null)
  const peersRef = useRef<Map<string, SimplePeer.Instance>>(new Map())
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRefsRef = useRef<Map<string, HTMLVideoElement>>(new Map())

  // Helper function to create peer connection
  const createPeerConnection = (
    peerId: string,
    isInitiator: boolean,
    mediaStream: MediaStream,
    socket: Socket,
    myUserName: string,
    remotePeerName?: string
  ) => {
    // Don't create duplicate connections
    if (peersRef.current.has(peerId)) {
      console.log('Peer connection already exists for:', peerId)
      return
    }

    const peer = new SimplePeer({
      initiator: isInitiator,
      trickleIce: true,
      stream: mediaStream,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      }
    })

    peer.on('signal', (signalData) => {
      if (isInitiator) {
        socket.emit('offer', {
          to: peerId,
          from: socket.id,
          fromName: myUserName,
          offer: signalData
        })
      } else {
        socket.emit('answer', {
          to: peerId,
          from: socket.id,
          answer: signalData
        })
      }
    })

    peer.on('stream', (remoteStream) => {
      console.log('Received remote stream from:', peerId)
      setRemotePeers((prev) => {
        const updated = new Map(prev)
        // Use provided remotePeerName or fallback
        updated.set(peerId, {
          peerId: peerId,
          peerName: remotePeerName || 'User ' + peerId.substring(0, 8),
          stream: remoteStream
        })
        return updated
      })
    })

    peer.on('error', (err) => {
      console.error('Peer error for', peerId, ':', err)
    })

    peersRef.current.set(peerId, peer)
    console.log('Created peer connection for:', peerId)
  }

  // Initialize WebRTC and Socket.IO
  useEffect(() => {
    if (!isOpen) return

    const initializeCall = async () => {
      try {
        // Get local media stream
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: true
        })

        setLocalStream(stream)

        // Display local video
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream
        }

        // Initialize Socket.IO
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
        const socket = io(API_URL, {
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000
        })

        socketRef.current = socket

        socket.on('connect', () => {
          console.log('Connected to signaling server')
          socket.emit('join-video-room', roomId, userName)
          
          // Get list of existing users in the room
          setTimeout(() => {
            socket.emit('get-users', roomId, (existingUsers: Array<{userId: string, userName: string}>) => {
              console.log('Existing users in room:', existingUsers)
              // Create peer connections for all existing users
              // New user should be answerer (initiator: false) for existing users
              existingUsers.forEach((user) => {
                createPeerConnection(user.userId, false, stream, socket, userName, user.userName)
              })
            })
          }, 500)
        })

        socket.on('user-joined', async (data) => {
          console.log('User joined:', data)
          
          // Create peer connection for the new user
          if (stream && !peersRef.current.has(data.userId)) {
            createPeerConnection(data.userId, true, stream, socket, userName, data.userName)
          }
        })

        socket.on('offer', (data) => {
          console.log('Received offer from:', data.from)
          
          // Create peer connection for answering
          if (stream && !peersRef.current.has(data.from)) {
            const peer = new SimplePeer({
              initiator: false,
              trickleIce: true,
              stream: stream,
              config: {
                iceServers: [
                  { urls: 'stun:stun.l.google.com:19302' },
                  { urls: 'stun:stun1.l.google.com:19302' }
                ]
              }
            })

            peer.on('signal', (signalData) => {
              socket.emit('answer', {
                to: data.from,
                from: socket.id,
                answer: signalData
              })
            })

            peer.on('stream', (remoteStream) => {
              console.log('Received remote stream from offer')
              setRemotePeers((prev) => {
                const updated = new Map(prev)
                updated.set(data.from, {
                  peerId: data.from,
                  peerName: data.fromName || 'User ' + data.from.substring(0, 8),
                  stream: remoteStream
                })
                return updated
              })
            })

            peer.signal(data.offer)
            peersRef.current.set(data.from, peer)
          } else if (peersRef.current.has(data.from)) {
            // If peer connection already exists, just signal the offer
            const peer = peersRef.current.get(data.from)
            if (peer) {
              peer.signal(data.offer)
            }
          }
        })

        socket.on('answer', (data) => {
          console.log('Received answer from:', data.from)
          const peer = peersRef.current.get(data.from)
          if (peer) {
            peer.signal(data.answer)
          }
        })

        socket.on('ice-candidate', (data) => {
          const peer = peersRef.current.get(data.from)
          if (peer && data.candidate) {
            peer.addIceCandidate(data.candidate).catch((err) => {
              console.error('Error adding ICE candidate:', err)
            })
          }
        })

        socket.on('user-disconnected', (data) => {
          console.log('User disconnected:', data.userId)
          const peer = peersRef.current.get(data.userId)
          if (peer) {
            peer.destroy()
            peersRef.current.delete(data.userId)
          }
          setRemotePeers((prev) => {
            const updated = new Map(prev)
            updated.delete(data.userId)
            return updated
          })
        })

        setConnectedUsers(remotePeers.size + 1)
      } catch (err) {
        console.error('Error accessing media devices:', err)
        setError('Could not access camera or microphone')
      }
    }

    initializeCall()

    return () => {
      // Cleanup
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop())
      }
      if (socketRef.current) {
        socketRef.current.disconnect()
      }
      peersRef.current.forEach((peer) => {
        peer.destroy()
      })
      peersRef.current.clear()
    }
  }, [isOpen, roomId, userName])

  // Update connected users count
  useEffect(() => {
    setConnectedUsers(remotePeers.size + 1)
  }, [remotePeers])

  // Toggle video
  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = !isVideoOn
      })
      setIsVideoOn(!isVideoOn)
    }
  }

  // Toggle audio
  const toggleAudio = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !isAudioOn
      })
      setIsAudioOn(!isAudioOn)
    }
  }

  // End call
  const handleEndCall = () => {
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop())
    }
    if (socketRef.current) {
      socketRef.current.emit('call-ended', {
        to: 'all',
        from: socketRef.current.id
      })
      socketRef.current.disconnect()
    }
    peersRef.current.forEach((peer) => {
      peer.destroy()
    })
    peersRef.current.clear()
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
        >
          <motion.div
            className="bg-gray-900 rounded-lg w-full max-w-6xl h-[600px] flex flex-col"
            initial={{ y: 20 }}
            animate={{ y: 0 }}
          >
            {/* Header */}
            <div className="bg-gray-800 p-4 flex justify-between items-center rounded-t-lg">
              <div>
                <h2 className="text-white text-xl font-bold">Study Together</h2>
                <p className="text-gray-400 text-sm">
                  {connectedUsers} participant{connectedUsers !== 1 ? 's' : ''} connected
                </p>
              </div>
              <button
                onClick={handleEndCall}
                className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg font-medium transition"
              >
                End Call
              </button>
            </div>

            {/* Video Grid */}
            <div className="flex-1 bg-gray-950 p-4 overflow-auto">
              {error && (
                <div className="bg-red-900/50 border border-red-500 text-red-200 p-4 rounded-lg mb-4">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
                {/* Local Video */}
                <div className="bg-gray-800 rounded-lg overflow-hidden relative group">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-3">
                    <p className="text-white text-sm font-medium">{userName} (You)</p>
                  </div>
                  {!isVideoOn && (
                    <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-2">
                          <span className="text-white text-2xl font-bold">
                            {userName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <p className="text-gray-400 text-sm">Camera off</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Remote Videos */}
                {Array.from(remotePeers.values()).map((remotePeer) => (
                  <div
                    key={remotePeer.peerId}
                    className="bg-gray-800 rounded-lg overflow-hidden relative"
                  >
                    {remotePeer.stream ? (
                      <>
                        <video
                          autoPlay
                          playsInline
                          className="w-full h-full object-cover"
                          ref={(ref) => {
                            if (ref && remotePeer.stream) {
                              ref.srcObject = remotePeer.stream
                            }
                          }}
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-3">
                          <p className="text-white text-sm font-medium">{remotePeer.peerName}</p>
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                        <div className="text-center">
                          <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-2">
                            <span className="text-white text-2xl font-bold">
                              {remotePeer.peerName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <p className="text-gray-400 text-sm">Connecting...</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {/* Empty State */}
                {remotePeers.size === 0 && (
                  <div className="bg-gray-800 rounded-lg flex items-center justify-center">
                    <div className="text-center text-gray-400">
                      <p className="text-lg font-medium mb-2">Waiting for friends...</p>
                      <p className="text-sm">Room ID: {roomId}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Controls */}
            <div className="bg-gray-800 p-4 flex justify-center gap-4 rounded-b-lg">
              <button
                onClick={toggleVideo}
                className={`${
                  isVideoOn ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-600 hover:bg-red-700'
                } text-white px-6 py-2 rounded-lg font-medium transition flex items-center gap-2`}
              >
                <span>{isVideoOn ? '📹' : '📹'}</span>
                {isVideoOn ? 'Video On' : 'Video Off'}
              </button>
              <button
                onClick={toggleAudio}
                className={`${
                  isAudioOn ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-600 hover:bg-red-700'
                } text-white px-6 py-2 rounded-lg font-medium transition flex items-center gap-2`}
              >
                <span>{isAudioOn ? '🎤' : '🎤'}</span>
                {isAudioOn ? 'Audio On' : 'Audio Off'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

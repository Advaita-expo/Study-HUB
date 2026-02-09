declare module 'simple-peer' {
  import { EventEmitter } from 'events';

  interface PeerConfig {
    initiator?: boolean;
    trickleIce?: boolean;
    stream?: MediaStream;
    streams?: MediaStream[];
    channelName?: string;
    channelConfig?: RTCDataChannelInit;
    iceServers?: RTCIceServer[];
    config?: RTCConfiguration;
    channelOffer?: boolean;
    streams?: MediaStream[];
    offerOptions?: RTCOfferOptions;
    answerOptions?: RTCAnswerOptions;
    sdpTransform?: (sdp: string) => string;
    streams?: MediaStream[];
  }

  interface Instance extends EventEmitter {
    initiator: boolean;
    channelName: string;
    streams: MediaStream[];
    destroy(): void;
    send(data: any): void;
    addStream(stream: MediaStream): void;
    removeStream(stream: MediaStream): void;
    addTrack(track: MediaStreamTrack, ...streams: MediaStream[]): void;
    removeTrack(track: MediaStreamTrack, ...streams: MediaStream[]): void;
    replaceTrack(oldTrack: MediaStreamTrack, newTrack: MediaStreamTrack, stream: MediaStream): Promise<void>;
    addIceCandidate(candidate: RTCIceCandidateInit | RTCIceCandidate): Promise<void>;
    on(event: 'error', listener: (err: Error) => void): this;
    on(event: 'signal', listener: (data: RTCSessionDescriptionInit | RTCIceCandidateInit) => void): this;
    on(event: 'connect', listener: () => void): this;
    on(event: 'stream', listener: (stream: MediaStream) => void): this;
    on(event: 'track', listener: (track: MediaStreamTrack, stream: MediaStream) => void): this;
    on(event: 'close', listener: () => void): this;
    on(event: 'data', listener: (data: any) => void): this;
  }

  class SimplePeer extends EventEmitter {
    constructor(config?: PeerConfig);
    initiator: boolean;
    channelName: string;
    streams: MediaStream[];
    destroy(): void;
    send(data: any): void;
    addStream(stream: MediaStream): void;
    removeStream(stream: MediaStream): void;
    addTrack(track: MediaStreamTrack, ...streams: MediaStream[]): void;
    removeTrack(track: MediaStreamTrack, ...streams: MediaStream[]): void;
    replaceTrack(oldTrack: MediaStreamTrack, newTrack: MediaStreamTrack, stream: MediaStream): Promise<void>;
    addIceCandidate(candidate: RTCIceCandidateInit | RTCIceCandidate): Promise<void>;
    on(event: 'error', listener: (err: Error) => void): this;
    on(event: 'signal', listener: (data: RTCSessionDescriptionInit | RTCIceCandidateInit) => void): this;
    on(event: 'connect', listener: () => void): this;
    on(event: 'stream', listener: (stream: MediaStream) => void): this;
    on(event: 'track', listener: (track: MediaStreamTrack, stream: MediaStream) => void): this;
    on(event: 'close', listener: () => void): this;
    on(event: 'data', listener: (data: any) => void): this;
  }

  export = SimplePeer;
}

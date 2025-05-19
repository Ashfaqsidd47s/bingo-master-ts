const SOCKET_URL = 'ws://localhost:8080'; // Define your single valid URL here

class GameSocket {
  private static instance: GameSocket;
  private socket: WebSocket | null = null;
  private url: string;
  private listeners: Set<(event: MessageEvent) => void> = new Set();
  private messageQueue: string[] = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private baseReconnectDelay = 1000;
  public count = 123;

  private constructor(url: string) {
    this.url = url;
    this.connect();
  }

  public increaseCount = () => {
    this.count++;
  }

  public static getInstance(): GameSocket {
    if (!GameSocket.instance) {
      GameSocket.instance = new GameSocket(SOCKET_URL);
    }
    return GameSocket.instance;
  }
  
    private connect() {
      this.socket = new WebSocket(this.url);
  
      this.socket.onopen = () => {
        console.log('[GameSocket] Connected');
        this.reconnectAttempts = 0;
        this.flushQueue();
      };
  
      this.socket.onmessage = (event: MessageEvent) => {
        this.listeners.forEach(listener => listener(event));
      };
  
      this.socket.onclose = () => {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          const delay = this.baseReconnectDelay * Math.pow(2, this.reconnectAttempts);
          console.warn(`[GameSocket] Disconnected. Reconnecting in ${delay}ms...`);
          setTimeout(() => {
            this.reconnectAttempts++;
            this.connect();
          }, delay);
        } else {
          console.error('[GameSocket] Max reconnection attempts reached.');
        }
      };
  
      this.socket.onerror = (event: Event) => {
        console.error('[GameSocket] Error:', event);
        this.socket?.close();
      };
    }
  
    private flushQueue() {
      if (this.socket?.readyState === WebSocket.OPEN) {
        while (this.messageQueue.length > 0) {
          const data = this.messageQueue.shift();
          if (data) {
            this.socket.send(data);
          }
        }
      }
    }
  
    public send(data: string) {
      if (this.socket?.readyState === WebSocket.OPEN) {
        this.socket.send(data);
      } else {
        console.warn('[GameSocket] Socket not open. Queuing message.');
        this.messageQueue.push(data);
      }
    }
  
    public addListener(callback: (event: MessageEvent) => void) {
      this.listeners.add(callback);
      console.log(" added", this.listeners)
    }
    
    public removeListener(callback: (event: MessageEvent) => void) {
      this.listeners.delete(callback);
      console.log(" removed", this.listeners)
    }
  
    public isConnected(): boolean {
      return this.socket?.readyState === WebSocket.OPEN;
    }
  
    public close() {
      this.socket?.close();
      this.socket = null;
      this.reconnectAttempts = 0;
    }
  }
  
  export default GameSocket;
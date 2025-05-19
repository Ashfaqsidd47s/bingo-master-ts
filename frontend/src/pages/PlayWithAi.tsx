import { useEffect } from "react";
import { useGameSocket } from "../hooks/userGameSocket";
import useUserStore from "../store/userstore";

export default function PlayWithAi() {
  const user = useUserStore((state) => state.user)
  const { send, addListener, removeListener, isConnected } = useGameSocket('ws://localhost:8080/');

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      console.log('ChatComponent received:', event.data);
    };

    addListener(handleMessage);

    return () => {
      removeListener(handleMessage); // Cleanup on unmount
    };
  }, [addListener, removeListener]);

  const handleSend = () => {
    if (isConnected() && user) {
      send({
        type: "normal",
        payload: {
          text: "A simple ping message..."
        }
      });
    } else {
      console.warn('Cannot send: WebSocket not connected');
    }
  };


  return (
    <div className=" text-white">
      <h2>Chat Component</h2>
      <button onClick={handleSend}>Send Message</button>
    </div>
  )
}

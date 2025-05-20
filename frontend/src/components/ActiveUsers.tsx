import { useEffect, useState } from "react";
import { useGameSocketStore } from "../store/gameSocketStore";
import { cn } from "../lib/sadcn";

export default function ActiveUsers({className=""}) {
    const { addListener, removeListener, isConnected } = useGameSocketStore();
    const [activeUsers, setActiveUsers] = useState<number>(1);

    useEffect(() => {
      const handleMessage = (event: MessageEvent) => {
        const message = JSON.parse(event.data);
        if(message.type === "user_count"){
          setActiveUsers(message.payload.count);
        } 
      }
  
      addListener(handleMessage)
    
      return () => {
        removeListener(handleMessage)
      }
    }, [addListener, removeListener])
    

    return (
        isConnected && 
        <div className={cn(" flex items-center justify-center gap-2 ", className)}>
            <div className="relative inline-flex items-center">
                <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
                <span className="ml-2 text-sm text-gray-200">{activeUsers} Active</span>
            </div>
        </div>
    )
}

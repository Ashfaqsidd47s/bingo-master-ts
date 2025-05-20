import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "../components/ui/Dialog";
import useGameStore from "../store/gameStore";
import useUserStore from "../store/userstore";
import { NavLink, useNavigate } from "react-router";
import SearchingAnimation from "../components/SearchingAnimation";
import  {motion, Variants } from "framer-motion"
import { useGameSocketStore } from "../store/gameSocketStore";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import ActiveUsers from "../components/ActiveUsers";


export default function Searching() {
  const navigate = useNavigate();
  const { send, addListener, removeListener, isConnected } = useGameSocketStore();
  const {oponent, updateGame, updateOponent} = useGameStore();
  const { user} = useUserStore();
  const [isSearching, setIsSearching] = useState(false);
  

  const handleFindOponent = () => {
    console.log(isConnected)
    if( isConnected ) {
      send(JSON.stringify({
        type: "join_game"
      }))
      setIsSearching(true);
    }
  }

  const handleWorkInprogress = () => {
    toast.warning("This feature is still under development...", { position: "top-right"})
  }

  useEffect(() => {
    const handleMessageInSearching = (event: MessageEvent) => {
      const message = JSON.parse(event.data);
      console.log(message)
      if(message.type === "waiting"){
        setIsSearching(true)
      } else if(message.type ===  "game_started"){
        updateGame(message.payload)
        updateOponent(message.payload.oponent)
        setIsSearching(false)
        setTimeout(() => {
          navigate("/game")
        }, 2000);
      }
    }

    addListener(handleMessageInSearching)
  
    return () => {
      removeListener(handleMessageInSearching)
    }
  }, [updateGame, addListener, removeListener, updateOponent, navigate])


  const playerVariants: Variants = {
    hidden: (direction: "left" | "right") => ({
      x: direction === "left" ? -100 : 100,
      scale: 0,
      opacity: 0,
    }),
    visible: {
      x: 0,
      scale: 1,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 200,
        damping: 20,
        duration: 0.5,
      },
    },
  };

  // Animation variants for VS
  const vsVariants: Variants = {
    hidden: {
      scale: 0,
      opacity: 0,
    },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 15,
        delay: 0.3,
        duration: 0.4,
      },
    },
  };
  
  

  return (
    <div className="w-screen h-[100svh] center gap-4 p-6 pb-8 bg-navy text-white bg-radial-[at_35%_20%] from-navyblue/50 via-navy  to-transparent">
      <NavLink to="/" className=" absolute top-4 left-6 bg-white/10 hover:bg-white/15 text-navy center  rounded-full p-2 cursor-pointer">
        <ArrowLeft className=" w-8 h-8" />
      </NavLink>
      <ActiveUsers className=" absolute top-4 right-4" />
      <div className="w-[100px] flex flex-col gap-2 items-center relative ">
        <div className={` w-[70px] h-[70px] center rounded-full overflow-hidden bg-charcoal z-0 `}>
          <div className=" w-[67px] h-[67px] rounded-full bg-navy">
            <img src="https://avatar.iran.liara.run/public/17" alt="" />
          </div>
        </div>
        <p className="  truncate text-lg font-semibold ">{user?.name}</p>
      </div>
      <Dialog>
        <DialogTrigger
          onClick={handleFindOponent}
          className=" w-[220px] h-[50px] rounded-2xl bg-navyblue text-white hover:bg-navyblue/80 font-semibold cursor-pointer"
        >Find Opponent</DialogTrigger>
        <DialogContent aria-describedby={undefined} className=" w-full h-screen  flex flex-col items-center justify-center gap-8">
          <div className=" w-screen">

            <DialogTitle className=" text-white text-center text-2xl ">{isSearching ? 'Searching' :'Opponent found'}</DialogTitle>
            {isSearching ? 
              <div className=" w-full ">
                <SearchingAnimation img_url={user?.profile_img} />
              </div>
            :<div className="w-full max-w-[420px] mx-auto flex items-center justify-between">
                <motion.div
                  className="w-[100px] flex flex-col gap-2 items-center relative"
                  variants={playerVariants}
                  initial="hidden"
                  animate="visible"
                  custom="left"
                >
                  <div className="w-[70px] h-[70px] center rounded-full overflow-hidden bg-charcoal z-0">
                    <div className="w-[67px] h-[67px] rounded-full bg-navy">
                      <img
                        src={user?.profile_img || "https://avatar.iran.liara.run/public/17"}
                        alt=""
                      />
                    </div>
                  </div>
                  <p className="truncate text-sm font-semibold text-white">{user?.name}</p>
                </motion.div>
                <motion.div
                  className="text-white bg-navyblue w-[60px] aspect-square center rounded-full font-bold text-xl"
                  variants={vsVariants}
                  initial="hidden"
                  animate="visible"
                >
                  VS
                </motion.div>
                <motion.div
                  className="flex flex-col gap-2 items-center w-[100px] relative"
                  variants={playerVariants}
                  initial="hidden"
                  animate="visible"
                  custom="right"
                >
                  <div className="w-[70px] h-[70px] center rounded-full overflow-hidden bg-charcoal z-0 playing-player">
                    <div className="w-[67px] h-[67px] rounded-full bg-navy">
                      <img
                        src={oponent?.profile_img || "https://avatar.iran.liara.run/public/50"}
                        alt=""
                      />
                    </div>
                  </div>
                  <p className="truncate text-sm font-semibold text-white">{oponent?.name}</p>
                </motion.div>
              </div>
            }
          </div>
        </DialogContent>
      </Dialog>
      <button
        onClick={handleWorkInprogress}
        className=" w-[220px] h-[50px] rounded-2xl bg-charcoal text-white hover:bg-charcoal/80 font-semibold cursor-pointer"
      >Join Group</button>
      <button
        onClick={handleWorkInprogress}
        className=" w-[220px] h-[50px] rounded-2xl bg-charcoal text-white hover:bg-charcoal/80 font-semibold cursor-pointer"
      >Create Group</button>
    </div>
  )
}

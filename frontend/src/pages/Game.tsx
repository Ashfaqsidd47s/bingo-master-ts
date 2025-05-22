import { useEffect, useState } from "react";
import { Tile } from "bingo-master/dist/types";
import CustomBoard from "../components/CustomBoard";
import { ArrowLeft, Bot, MessageCircleMore, Smile } from "lucide-react";
import {AnimatePresence, motion, Variants} from "framer-motion"
import LogoutModal from "../components/modals/LogoutModal";
import useModalStore from "../store/modalstore";
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/Popover";
import useGameStore from "../store/gameStore";
import useUserStore from "../store/userstore";
import WinningModal from "../components/modals/WinnLoosModal";
import { useNavigate } from "react-router";
import { useGameSocketStore } from "../store/gameSocketStore";
import { EmojiAttachment } from "../components/EmojiAttachment";
import { playWinningAnimation } from "../components/Animations";

export default function Game() {
  const navigate = useNavigate();
  const {user} = useUserStore();
  const { send, addListener, removeListener, isConnected } = useGameSocketStore();
  const {game, oponent, updateGame, updateOponent} = useGameStore();
  const [boardInfo, setBoardInfo] = useState<Tile[][]>([])
  const [cancelCount, setCancelCount] = useState<number>(0)
  const [cancelInfo, setCancelInfo] = useState<string[]>([])
  const [turn, setTurn] = useState(game?.turn || false)
  const [currentNumber, setCurrentNumber] = useState< number>(0)
  const {openModal} = useModalStore();
  const [emoji, setEmoji] = useState<string | null>(null);
  const [isOponentOnline, setIsOponentOnline] = useState<boolean>(true);

  const quickChatEmojis: string[] = ["😂","😎","🥳","👍","🔥","💯","🎉","😢","🤔"];
  
  
  const cancelNumber = (num: number)=> {
    if( isConnected && turn ) {
      send(JSON.stringify({
        type: "cancle_number",
        payload: {
          number : String(num)
        }
      }))
    }
    setCurrentNumber(num)
  }
  const sendMessage = (msg: string)=> {
    if( isConnected ) {
      send(JSON.stringify({
        type: "send_message",
        payload: {
          text : msg
        }
      }))
    }
  }
  const sendEmoji = (msg: string)=> {
    if( isConnected ) {
      send(JSON.stringify({
        type: "send_emoji",
        payload: {
          text : msg
        }
      }))
    }
  }

  

  const handelLogout = ()=> {
    openModal(<LogoutModal />)
  }

  useEffect(() => {
    const handleClearGame = () => {
      updateGame(null);
      updateOponent(null);
      navigate("/search");
    }

    if(game?.isGameOver){
      handleClearGame();
    }
    const handleMessage = (event: MessageEvent) => {
      const message = JSON.parse(event.data);
      console.log(message)
      if(message.type ===  "game_started"){
        updateGame(message.payload)
        if(message.payload.opponent){
          updateOponent(message.payload.oponent)
        }
        setTurn(message.payload.turn);
        setIsOponentOnline(true);
      } else if ( message.type === "caceled") {
        setBoardInfo(message.payload.boardInfo)
        setCancelCount(message.payload.cancelCount)
        setCancelInfo(message.payload.cancelInfo)
        setTurn(message.payload.turn)
        setCurrentNumber(message.payload.number)
      } else if ( message.type === "winner") {
        setBoardInfo(message.payload.boardInfo)
        setCancelCount(message.payload.cancelCount)
        setCancelInfo(message.payload.cancelInfo)
        setTurn(message.payload.turn)
        setCurrentNumber(message.payload.turn)
        updateGame(message.payload)
        playWinningAnimation()
        openModal(<WinningModal winner={true} />, handleClearGame);
      } else if ( message.type === "looser") {
        setBoardInfo(message.payload.boardInfo)
        setCancelCount(message.payload.cancelCount)
        setCancelInfo(message.payload.cancelInfo)
        setTurn(message.payload.turn)
        setCurrentNumber(message.payload.turn)
        updateGame(message.payload)
        openModal(<WinningModal winner={false} />, handleClearGame)
      } else if (message.type === "emoji") {
        setEmoji(message.payload.text);
        setTimeout(() => {
          setEmoji(null)
        }, 5000);
      } else if (message.type === "offline") {
        setIsOponentOnline(false);
      } else if (message.type === "online") {
        setIsOponentOnline(true);
      }
    }

    addListener(handleMessage)
  
    return () => {
      removeListener(handleMessage)
    }
  }, [updateGame, addListener, removeListener, updateOponent, openModal, emoji, navigate, game?.isGameOver])

  useEffect(() => {
    setBoardInfo(game?.boardInfo || [])
  }, [game])
  

  
  const containerVariants: Variants = {
    hidden: {scale: 0}, 
    show: { 
      scale: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  }

  const itemVariants: Variants = {
    hidden: { scale: 0},
    show: {
      scale: 1,
      transition:{duration: 0.2}
    }
  }

  return (
    <div className="w-screen h-[100svh] center gap-3 bg-navy text-white">
      <div className=" p-6 w-[400px] h-[100px]  flex items-center justify-between">
        <div className="w-[100px] flex flex-col gap-2 items-center relative">
          <div className={` w-[70px] h-[70px] center rounded-full overflow-hidden bg-charcoal z-0 ${turn ? 'playing-player' : ''}`}>
            <div className=" w-[67px] h-[67px] rounded-full bg-navy overflow-hidden">
              <img src={"https://avatar.iran.liara.run/public/17"} alt="" />
            </div>
          </div>
          <p className=" w-[100px]  truncate text-sm font-semibold ">{user?.name}</p>
        </div>
        <div className=" center gap-3 relative">
          <AnimatePresence>
            {turn && (
              <motion.span
                initial={{ opacity: 0, y: 30, scale: 0 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -30, scale: 0 }}
                transition={{ duration: 0.5 }}
                className=" absolute whitespace-nowrap w-fit text-xs font-semibold bg-navyblue/60 p-1 px-4 rounded-full"
              >
                YOUR TURN
              </motion.span>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {!turn && (
              <motion.span
                initial={{ opacity: 0, y: 30, scale: 0 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -30, scale: 0 }}
                transition={{ duration: 0.5 }}
                className=" absolute whitespace-nowrap w-fit text-xs font-semibold bg-charcoal/80 p-1 px-4 rounded-full"
              >
                OPONENT'S TURN
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        <div className={` flex flex-col gap-2 items-center w-[100px] relative ${!isOponentOnline && ' opacity-15 '}` }>
          <div className={` w-[70px] h-[70px] center rounded-full overflow-hidden bg-charcoal z-0 ${ !turn ? 'playing-player' : ''}`}>
            <div className=" w-[67px] h-[67px] rounded-full bg-navy overflow-hidden">
            <img src={"https://avatar.iran.liara.run/public/20"} alt="" />
            </div>
          </div>
          <p className=" w-[100px] truncate text-sm font-semibold">{oponent?.name}</p>
          <AnimatePresence>
            {turn && currentNumber !== 0 && (
              <motion.span
                initial={{ opacity: 0, y: 30, scale: 0 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -30, scale: 0 }}
                transition={{ duration: 0.5 }}
                className=" absolute bottom-8 whitespace-nowrap w-fit text-xs font-semibold bg-charcoal p-1 px-4 rounded-full"
              >
                CANCELED {currentNumber}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>
      <div className=" px-6 w-full h-[500px] center ">
        <CustomBoard
          board={boardInfo}
          cancelCount={cancelCount}
          canceledInfo={cancelInfo}
          cancelNumber={cancelNumber}
         />
        <div className=" italic text-lg font-semibold"> score - <span className=" font-bold">{cancelCount}/5</span></div>
      </div>
      <EmojiAttachment emoji={emoji} />
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className=" w-[350px] flex items-center justify-center gap-6"
      >

        <motion.div
          variants={itemVariants}
          onClick={handelLogout}
          className="w-[55px] h-[55px] rounded-full bg-spicered/70 backdrop-blur-sm center"
        ><ArrowLeft /></motion.div>
        <motion.div
          variants={itemVariants}
          className="w-[55px] h-[55px] rounded-full bg-charcoal/80 backdrop-blur-sm center"
        ><Bot /></motion.div>
        <motion.div
          variants={itemVariants}
          onClick={() => sendMessage("hey there!!")}
          className="w-[55px] h-[55px] rounded-full bg-charcoal/80 backdrop-blur-sm center"
        ><MessageCircleMore /></motion.div>
        <Popover>
          <PopoverTrigger>
            <motion.div
              variants={itemVariants}
              className="w-[55px] h-[55px] rounded-full bg-charcoal/80 backdrop-blur-sm center"
            ><Smile /></motion.div>
          </PopoverTrigger>
          <PopoverContent className=" bg-charcoal/70 backdrop-blur-xs border-navyblue/80 w-[200px] h-[150px] p-3 grid grid-cols-3 gap-2 overflow-y-auto">
            {quickChatEmojis.map((emoji, i)=> (
              <div 
                key={i}
                onClick={() => sendEmoji(emoji)}
                className=" aspect-square text-2xl center p-1 rounded-full hover:bg-navy/30 cursor-pointer"
              >{emoji}</div>
            ))}
          </PopoverContent>
        </Popover>
      </motion.div>
    </div>
  )
}

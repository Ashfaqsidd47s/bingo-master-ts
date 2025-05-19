/* eslint-disable @typescript-eslint/no-unused-expressions */
import { Bingo } from "bingo-master";
import AiBoard from "../components/AiBoard";
import { useEffect, useRef, useState } from "react";
import { Tile } from "bingo-master/dist/types";
import gptIcon from "../assets/gpt.svg"
import deepseekIcon from "../assets/deepseek.svg"
import crownIcon from "../assets/crown.png"
import { bingoBot } from "../lib/aimodels";
import {motion, AnimatePresence } from "framer-motion";
import confetti  from "canvas-confetti"
import { NavLink } from "react-router";
import { Dialog, DialogContent,  DialogTitle } from "../components/ui/Dialog";

export default function AiBattle() {
  const testGame = useRef<Bingo>(new Bingo(4, 2));
  const [player1Board, setPlayer1Board] = useState<Tile[][]>([]);
  const [player2Board, setPlayer2Board] = useState<Tile[][]>([]);
  const [player1CanceledInfo, setPlayer1CanceledInfo] = useState<string[]>([]);
  const [player2CanceledInfo, setPlayer2CanceledInfo] = useState<string[]>([]);
  const [player1CancelCount, setPlayer1CancelCount] = useState<number>(0);
  const [player2CancelCount, setPlayer2CancelCount] = useState<number>(0);
  const [currentTurn, setCurrentTurn] = useState<number>(0);
  const [currentNumber, setCurrentNumber] = useState<number | null>(null);
  const [winner, setWinner] = useState<number | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  let animationFrameId:number;
  const lastTurnTime = useRef<number>(0);
  const turnDelay = 4000;

  function delay(time:number):Promise<void> {
    return new Promise(resolve => setTimeout(resolve, time))
  }

  const cancelNumber = async (num: number, turn: number)=>{
    try {
      if(testGame.current.getWinner() !== null){
         setWinner(testGame.current.getWinner())
         return;
      }
      testGame.current.cancelNumber(num, turn)
      setWinner(testGame.current.getWinner())
      turn === 0 ? updatePlayer1() : updatePlayer2()
      setCurrentNumber(num)
      setCurrentTurn(turn)
      await delay(1000)
      turn === 0 ? updatePlayer2() : updatePlayer1()
    } catch (err) {
      console.log(err)
    }
  }

  const updatePlayer1 = ()=>{
    setPlayer1Board(testGame.current.getMyBoardInfo(0))
    setPlayer1CanceledInfo(testGame.current.getMyCanceledInfo(0))
    setPlayer1CancelCount(testGame.current.getMyCancelCount(0))
  }
  const updatePlayer2 = ()=>{
    setPlayer2Board(testGame.current.getMyBoardInfo(1))
    setPlayer2CanceledInfo(testGame.current.getMyCanceledInfo(1))
    setPlayer2CancelCount(testGame.current.getMyCancelCount(1))
  }

  useEffect(() => {
    setPlayer1Board(testGame.current.getMyBoardInfo(0))
    setPlayer2Board(testGame.current.getMyBoardInfo(1))
    
    if(testGame.current.getWinner()) return;
    const gameLoop = async (time: number) => {
      if(testGame.current.getWinner() !== null) return;
      if(time - lastTurnTime.current >= turnDelay) {
        lastTurnTime.current = time;
        
        const board = testGame.current.getTurn() === 0 ? testGame.current.getMyBoardInfo(0): testGame.current.getMyBoardInfo(1);
        const currentMove = bingoBot(board);
        if(currentMove == -1){
          setWinner(testGame.current.getWinner());
          cancelAnimationFrame(animationFrameId);
          return;
        }
        
        await cancelNumber(currentMove, testGame.current.getTurn());
      }

      animationFrameId = requestAnimationFrame(gameLoop);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
    animationFrameId = requestAnimationFrame(gameLoop);

    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  useEffect(() => {
    if(winner !== null) {
      setIsOpen(true)
      confetti({
        particleCount: 150, // Lower burst per frame for a smoother effect
        spread: 70,
        startVelocity: 30,
        decay: 0.95, // Makes particles last longer
        gravity: 0.7, // Slower fall 
        shapes: ["square"], // Adds variety
        colors: ["#FFD700", "#FFEC8B", "#FFF8DC", "#FFFACD", "#FFC300"],
        origin: { y: 0.9},
      })
    }
  }, [winner])
  

  return (
    <div className=" w-full  h-[100svh] center bg-navy navy-gradient ">
        <div className=" my-4 w-[400px] md:border-[1.3rem] md:rounded-[3rem] md:border-black flex items-center justify-center invisible md:visible relative iphone">
          <div className=" w-[0.3rem] h-[80px] bg-white absolute right-[-1.5rem] "></div>
          <div className=" w-[0.3rem] h-[40px] bg-white absolute left-[-1.5rem] top-[100px]"></div>
          <div className=" w-[0.3rem] h-[50px] bg-white absolute left-[-1.5rem] top-[160px]"></div>
          <div className=" w-[0.3rem] h-[50px] bg-white absolute left-[-1.5rem] top-[220px]"></div>
          <div className=" p-1 px-4 w-full flex flex-col justify-center gap-4 text-white visible">
            <h1 className=" text-center text-4xl font-bold py-3">AI bingo battle</h1>
            <div className=" w-full flex gap-4">
              <div>
                <AiBoard
                  board={player1Board}
                  cancelCount={player1CancelCount}
                  canceledInfo={player1CanceledInfo}
                  />
              </div>
              <div className=" flex flex-col gap-2">
                <div className=" h-fit flex items-center gap-2 font-semibold">
                  <div className=" w-[50px] h-[50px] rounded-full bg-charcoal/30 center">
                    <img src={gptIcon} alt="" />
                  </div>
                  <p>ChatGPT</p>
                </div>
                <p className=" w-fit text-sm bg-charcoal/60 p-1 px-4 rounded-full ">POINTS - <span>{player1CancelCount}/4</span></p>
                <AnimatePresence>
                  {currentTurn === 0 && currentNumber !== null && (
                    <motion.p
                      initial={{ opacity: 0, y: 30, scale: 0 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -20, scale: 0 }}
                      transition={{ duration: 0.5 }}
                      className="w-fit text-sm  bg-navyblue/60 p-1 px-4 rounded-full"
                    >
                      CANCEL {currentNumber}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            </div>
            <Dialog open={ isOpen} onOpenChange={setIsOpen} aria-describedby={undefined} >
              <DialogContent aria-describedby={undefined}
                onEscapeKeyDown={(e) => e.preventDefault()}
                onPointerDownOutside={(e) => e.preventDefault()}
                className="w-[300px] p-3 py-8 pt-12 bg-charcoal/60 backdrop-blur-sm  self-center absolute z-50
                  flex flex-col items-center justify-center gap-6 text-white border-charcoal
                rounded-2xl sm:rounded-2xl md:rounded-2xl"
               >
                <DialogTitle className=" hidden"></DialogTitle>
                <div className=" w-[60px] h-[60px] rotate-15 rounded-full  center absolute top-[0px] left-[calc(50%-20px)] ">
                  <img src={crownIcon} alt="" />
                </div>
                <div className={` w-[50px] h-[50px] rounded-full bg-navyblue/30 center p-1 backdrop-blur-sm`}>
                  <img src={winner === 0 ? gptIcon : deepseekIcon} alt="" />
                </div>
                <p className="">🏆 <span className=" font-semibold text-lg">{winner === 0 ? "ChatGPT":"DeepSeek"}</span> 🏆  won the game 🎊</p>
                <div className=" w-full flex gap-2 p-2 px-4">
                  <button className=" center w-[120px] h-[34px] rounded-xl bg-charcoal text-sm hover:bg-charcoal/80 cursor-pointer" onClick={()=> window.location.reload()}>once more</button>
                  <NavLink to="/game" 
                    className="  center w-[120px] h-[34px] rounded-xl bg-navyblue text-sm hover:bg-navyblue/80 cursor-pointer"
                  >Let's play</NavLink>
                </div>
              </DialogContent>
            </Dialog>
            <div className=" w-full flex flex-row-reverse items-end gap-4">
                <div>
                <AiBoard
                  board={player2Board}
                  cancelCount={player2CancelCount}
                  canceledInfo={player2CanceledInfo}
                  />
                </div>
                <div className=" flex flex-col items-end gap-2">
                  <AnimatePresence>
                    {currentTurn === 1 && currentNumber !== null && (
                      <motion.p
                        initial={{ opacity: 0, y: 30, scale: 0 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0 }}
                        transition={{ duration: 0.5 }}
                        className="w-fit text-sm font-semibold bg-navyblue/60 p-1 px-4 rounded-full"
                      >
                        CANCEL {currentNumber}
                      </motion.p>
                    )}
                  </AnimatePresence>
                  <p className=" w-fit text-sm bg-charcoal/60 p-1 px-4 rounded-full ">POINTS - <span>{player2CancelCount}/4</span></p>
                  <div className=" h-fit flex items-center gap-2 ">
                    <p>Deepseek</p>
                    <div className=" w-[50px] h-[50px] p-2 rounded-full bg-charcoal/30 center">
                      <img src={deepseekIcon} alt="" />
                    </div>
                  </div>
                </div>
            </div>
            <NavLink to="/game" className=" self-center text-center italic text-lg hover:text-white/70 w-fit" >skip</NavLink>
          </div>
        </div>
    </div>
  )
}

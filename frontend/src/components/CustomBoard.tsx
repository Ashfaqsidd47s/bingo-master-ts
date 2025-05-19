import { Tile } from "bingo-master/dist/types";
import {motion, Variants} from "framer-motion";
import CustomTile from "./CustomTile";


type CustomBoardProp = {
  board: Tile[][];
  canceledInfo: string[];
  cancelCount: number;
  cancelNumber: (num:number) => (void);
} 

export default function CustomBoard({board, canceledInfo, cancelCount, cancelNumber}:CustomBoardProp) {

  const rowVariants: Variants = {
    hidden: {opacity: 0},
    show: (d: number) => ({
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: d,
        delay: d
      }
    })
  }
  
  return (
    <motion.div 
      className=' bg-card p-[2px] rounded-2xl glowing-border'
      style={{backgroundImage: "conic-gradient(from 0deg, #3D4AEB, #1E246A, #1E246A, #3D4AEB)"}}
      animate={{
        background: [
          'conic-gradient(from 0deg, #3D4AEB, #1E246A, #1E246A, #3D4AEB)',
          'conic-gradient(from 360deg, #3D4AEB, #1E246A, #1E246A, #3D4AEB)',
        ],
      }}
      transition={{
        duration: 10, 
        repeat: Infinity,  
        repeatType: 'loop', 
      }}
    >
      <div className="p-2 py-3 w-fit rounded-2xl border-3 border-charcoal center gap-1 bg-charcoal/40 backdrop-blur-sm">
        <div className=" p-2 flex items-center justify-center gap-1 bg-white/20 rounded-lg">
          {"BINGO".split("").map((item, i) => (
            <motion.div
              key={i} 
              initial={{ scale: 0, borderRadius: "50%"}}
              animate={{scale: 1, borderRadius: "8px"}}
              transition={{duration:  0.3, delay: i* 0.05}}
              className={` 
                p-[1px] w-[60px] aspect-square center text-2xl font-semibold  cursor-pointer z-0   ${i < cancelCount ? "playing-player": ""}
                  
                `}
              >
                <motion.div 
                    className={` w-full h-full rounded-[inherit] center ${ i < cancelCount ?' bg-navyblue':'bg-gray-900'}`}
                >{item}</motion.div>
              </motion.div>
            ))}
        </div>        
        <div className=" p-2 h-fit flex flex-col gap-1 items-center bg-white/10 text-white rounded-md">
          {board.map((row, i) => (
              <motion.div 
                key={i}
                variants={rowVariants} 
                initial="hidden"
                animate="show"
                custom={i * 0.3}
                className=" h-fit flex items-center justify-center gap-1 relative">
                  {row.map((item, j) => (
                      <CustomTile
                        key={j}
                        tile={item}
                        cancelNumber={cancelNumber}
                      />))}
                      {canceledInfo.includes('R_' + i) && (
                          <motion.div 
                              initial={{ scaleX: 0 }}
                              animate={{ scaleX: 1 }}
                              transition={{ duration: 0.5 }}
                              className="w-[330px] h-[8px] bg-white/40 backdrop-blur-[2px] absolute top-[27px] origin-left"
                          ></motion.div>
                      )}
              </motion.div>
          ))}
        </div>
        {/* canceling row col or diagonals */}
        {Array.from({ length: board.length }, (_, j) => (
            canceledInfo.includes('C_' + j) && (
                <motion.div 
                    key={j} 
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{ duration: 0.5 }}
                    className="w-[8px] h-[330px] bg-white/40 backdrop-blur-[2px] absolute top-[92px] origin-top"
                    style={{ left: `${42 + j * 64}px` }}
                ></motion.div>
            )
        ))}
        {canceledInfo.includes('D_0') && (
            <motion.div 
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ duration: 0.5 }}
                className="w-[8px] h-[460px] rotate-[-45deg] bg-white/40 backdrop-blur-[2px] absolute top-[95px] left-[7px] origin-top"
            ></motion.div>
        )}
        {canceledInfo.includes('D_1') && (
            <motion.div 
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ duration: 0.5 }}
                className="w-[8px] h-[460px] rotate-[45deg] bg-white/40 backdrop-blur-[2px] absolute top-[95px] left-[332px] origin-top"
            ></motion.div>
        )}
      </div>
    </motion.div>
  )
}

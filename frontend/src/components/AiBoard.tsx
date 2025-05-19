import { Tile } from "bingo-master/dist/types";
import { motion } from "framer-motion";

type AiBoardProp = {
    board: Tile[][];
    canceledInfo: string[];
    cancelCount: number;
} 

export default function AiBoard({board, canceledInfo}:AiBoardProp) {

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
        <div className="p-1 py-2 w-fit rounded-2xl border-3 border-charcoal center gap-1 bg-charcoal/40 backdrop-blur-sm">
            <div className="p-1 w-full flex items-center justify-center gap-1 bg-white/10 rounded-md">
                <div 
                    className={` w-full h-[40px] rounded-md bg-navy/70 text-white/80 tracking-widest center font-bold text-2xl hover:bg-navyblue/80 cursor-pointer origin-left`}
                >BINGO</div>
            </div>
            <div className=" flex flex-col gap-1 items-center p-1 bg-white/10 text-white rounded-md">
                {board.map((row, i) => (
                    <div key={i} className=" flex items-center justify-center gap-1 relative">
                        {row.map((item, j) => (
                            <motion.div 
                            initial={{ scale: 0, borderRadius: "50%"}}
                            animate={{scale: 1, borderRadius: "8px",}}
                            transition={{
                                duration: 0.3,
                                 delay: (i*board.length +j)* 0.05
                            }}
                            key={j} 
                            className={` 
                                w-[40px] h-[40px] rounded-md bg-navy/30 p-[1px] center text-2xl font-semibold hover:bg-navyblue/60 cursor-pointer ${item.isCanceled ? ' last-canceled':''} `}
                                >
                                    <motion.div
                                        initial={{backgroundColor: "#101828" }}
                                        animate={{ backgroundColor: item.isCanceled ? "#3d4aeb" : "#101828"}} 
                                        transition={{ duration:  item.isCanceled ? 4: 0.3 }}
                                        className=" bg-gray-900 w-full h-full rounded-[inherit] center"
                                    >{item.value}</motion.div>
                                </motion.div>
                            ))}
                            {/* {isCanceled.includes('R_' + i) && <div className=" w-[185px] h-[6px] bg-white/40 absolute top-[17px]"></div>} */}
                            {canceledInfo.includes('R_' + i) && (
                                <motion.div 
                                    initial={{ scaleX: 0 }}
                                    animate={{ scaleX: 1 }}
                                    transition={{ duration: 0.5 }}
                                    className="w-[185px] h-[6px] bg-white/40 absolute top-[17px] origin-left"
                                ></motion.div>
                            )}
                    </div>
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
                        className="w-[6px] h-[185px] bg-white/40 absolute top-[62px] origin-top"
                        style={{ left: `${29 + j * 44}px` }}
                    ></motion.div>
                )
            ))}
            {canceledInfo.includes('D_0') && (
                <motion.div 
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{ duration: 0.5 }}
                    className="w-[6px] h-[240px] rotate-[-45deg] bg-white/40 absolute top-[70px] left-[10px] origin-top"
                ></motion.div>
            )}
            {canceledInfo.includes('D_1') && (
                <motion.div 
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{ duration: 0.5 }}
                    className="w-[6px] h-[240px] rotate-[45deg] bg-white/40 absolute top-[70px] left-[180px] origin-top"
                ></motion.div>
            )}
        </div>
    </motion.div>
  )
}

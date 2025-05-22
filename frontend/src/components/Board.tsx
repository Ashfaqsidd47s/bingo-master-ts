import { Board } from "bingo-master";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export default function BoardComp() {
    const [board, setBoard] = useState<Board>()

    useEffect(() => {
      setBoard(new Board(3))
    }, [])
    


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
        <div className="p-1 py-2 w-fit rounded-2xl border-3 border-navyblue center gap-1 bg-charcoal/40 backdrop-blur-sm">
                <div className="p-1 w-full flex items-center justify-center gap-1 bg-white/10 rounded-md">
                    <div 
                        className={` w-full h-[40px] rounded-md bg-navy/70 text-white/80 tracking-widest center font-bold text-2xl hover:bg-navyblue/80 cursor-pointer origin-left`}
                    >BINGO</div>
                </div>
                <div className=" flex flex-col gap-1 items-center p-1 bg-white/10 text-white rounded-md">
            {board && board.getBoardDetails().map((row, i) => (
                <div key={i} className=" flex items-center justify-center gap-1 relative">
                    {row.map((item, j) => (
                        <motion.div 
                        initial={{ scale: 0, borderRadius: "50%"}}
                        animate={{scale: 1, borderRadius: "8px",}}
                        transition={{
                            duration: 0.3,
                                delay: (i*board.getBoardDetails().length +j)* 0.05
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
                        {board?.getCanceldInfo().includes('R_' + i) && (
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
        </div>
      </motion.div>
    )
}

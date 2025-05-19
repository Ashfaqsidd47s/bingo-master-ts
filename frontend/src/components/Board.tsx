import { motion } from "framer-motion";

export default function Board() {
    const size = 3;


    return (
    <div className="p-3 rounded-2xl border-3 border-charcoal center gap-1 bg-white/30 backdrop-blur-2xl ">
        <div className=" p-2 w-full bg-navyblue/60 rounded-md text-3xl font-bold text-center text-navy">BINGO</div>
        <div className=" flex flex-col gap-1 items-center">
        {Array.from({ length: size }, (_, i) => (
            <div key={i} className=" flex items-center justify-center gap-1">
                {Array.from({ length: size }, (_, j) => (
                    <motion.div 
                        initial={{ scale: 0, borderRadius: "50%"}}
                        animate={{scale: 1, borderRadius: "8px"}}
                        transition={{duration:  0.3, delay: (i*size +j)* 0.1}}
                        key={j} 
                        className=" w-[50px] h-[50px] rounded-md bg-navyblue/60 center font-semibold"
                    >{j}</motion.div>
                ))}
            </div>
        ))}
        </div>
    </div>
    )
}

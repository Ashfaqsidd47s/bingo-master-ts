import { motion, Variants } from "framer-motion";
import { Tile } from "bingo-master/dist/types";

type CustomTileProp = {
    tile: Tile;
    cancelNumber: (val: number)=> void
}


export default function CustomTile({tile, cancelNumber}:CustomTileProp) {
    
    const tileVariants: Variants = {
        hidden: {
            scale: 0, 
            borderRadius: "50%",
        },
        show: {
            scale: 1, borderRadius: "8px", 
            transition:{duration: 0.3}
        }
    } 

  return (
    <motion.div 
        variants={tileVariants}
        onClick={()=> cancelNumber(tile.value)}
        className={` 
            p-[1px] w-[60px] aspect-square center text-2xl font-semibold  cursor-pointer z-0   ${tile.isCanceled ? "last-canceled": "uncancel-tile"}
        `}
    >
        <motion.div 
            animate={{backgroundColor: tile.isCanceled ? "#3D4AEB": "#101828",}}
            transition={{duration : tile.isCanceled ? 3 : 0.3}}
            className={` w-full h-full rounded-[inherit] center ${tile.isCanceled ? ' bg-navyblue/80':'bg-gray-900'}`}
        >{tile.value}</motion.div>
    </motion.div>
  )
}

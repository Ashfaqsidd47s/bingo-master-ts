import { DialogContent, DialogTitle } from '../ui/Dialog'
import crownIcon from "../../assets/crown.png"
import loosIcon from "../../assets/hate.png"
import winnerIcon from "../../assets/medal.png"
import useModalStore from '../../store/modalstore'

export default function WinningModal({winner = true }) {
    const closeModal = useModalStore((state)=> state.closeModal)
    

    return (
        <DialogContent aria-describedby={undefined}
            onEscapeKeyDown={(e) => e.preventDefault()}
            onPointerDownOutside={(e) => e.preventDefault()}
            className="w-[300px] p-3 py-8 pt-12 bg-charcoal/60 backdrop-blur-sm  self-center absolute z-50
                flex flex-col items-center justify-center gap-6 text-white border-charcoal
            rounded-2xl sm:rounded-2xl md:rounded-2xl"
        >
            <DialogTitle className=" hidden"></DialogTitle>
            {winner && <div className=" w-[60px] h-[60px] rotate-15 rounded-full  center absolute top-[0px] left-[calc(50%-20px)] ">
                <img src={ crownIcon} alt="" />
            </div>}
            <div className={` w-[50px] h-[50px] rounded-full center p-1 backdrop-blur-sm`}>
                <img src={winner ? winnerIcon : loosIcon} alt="" />
            </div>
            {winner 
                ?<p className="">🏆 <span className=" font-semibold text-lg">You</span> 🏆  won the game 🎊</p>
                :<p className="">🤡 <span className=" font-semibold text-lg">You</span> 🤡 Loss the game  😔</p>
            }
            <div className=" w-full flex gap-2 p-2 px-4">
                <button onClick={closeModal} 
                    className="  center w-full h-[34px] rounded-xl bg-navyblue text-sm hover:bg-navyblue/80 cursor-pointer"
                >Play again</button>
            </div>
        </DialogContent>
    )
}

import axios from "axios";
import useUserStore from "../../store/userstore";
import { DialogClose, DialogContent, DialogHeader, DialogTitle } from "../ui/Dialog";
import { useNavigate } from "react-router";
import useGameStore from "../../store/gameStore";

export default function LogoutModal() {
  const {updateUser} = useUserStore();
  const { updateGame, updateOponent} = useGameStore();
  const navigate = useNavigate()

  const handelLogout = async () => {
    try {
      await axios.get("/api/auth/logout");
      updateUser(null);
      updateGame(null);
      updateOponent(null);
      navigate("/")
    } catch (error) {
      console.log(error)
    }
  }
    
  return (
    <DialogContent aria-describedby={undefined} 
      className="w-[300px] bg-charcoal/70 backdrop-blur-sm self-center absolute z-50 
        flex flex-col items-center justify-center gap-8 text-white border-charcoal
       rounded-2xl sm:rounded-2xl md:rounded-2xl
    ">
        <DialogHeader>
          <DialogTitle className=" text-white font-semibold text-xl">
            Are you sure to logout?
          </DialogTitle>
        </DialogHeader>
        <div className=" w-full flex items-center justify-center gap-3">
          <DialogClose>
            <button className=" w-[80px] h-[34px] bg-navy rounded-xl">cancel</button>
          </DialogClose>
          <DialogClose>
            <button 
              onClick={handelLogout}
              className=" w-[80px] h-[34px] bg-navyblue rounded-xl">Logout</button>
          </DialogClose>
        </div>
    </DialogContent>
  )
}

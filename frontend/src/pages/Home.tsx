import { NavLink, useNavigate } from "react-router";
import useUserStore from "../store/userstore";
import googleIcon from "../assets/google.svg"
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/Popover";
import { ChevronDown } from "lucide-react";
import ActiveUsers from "../components/ActiveUsers";
import BoardComp from "../components/Board";

export default function Home() {
  const navigate = useNavigate()
  const {isVerifying, user} = useUserStore();

  const handelPlayGame = () => {
    navigate("/aibattle")
  }
  const handleLoginWithGoogle = () => {
    window.location.href = "http://localhost:8080/auth/google"
  }


  return (

    <div className=" relative w-screen h-[100svh] center gap-4 bg-navy text-white bg-radial-[at_35%_20%] from-navyblue/50 via-navy  to-transparent">
      <div className=" md:max-w-[420px] center gap-4 p-4" >
        {user && <Popover>
            <PopoverTrigger className=" absolute top-4 right-4 z-10 inline-flex items-center gap-3 bg-charcoal/40 p-1 rounded-xl" >
              <p className=" max-w-[100px] truncate pl-3">{user.name}</p>
              <div className=" w-[44px] aspect-square rounded-full overflow-hidden center"><img src={user.profile_img}  alt="" /></div>
              <ChevronDown />
            </PopoverTrigger>
            <PopoverContent className=" p-1 bg-charcoal/30 w-fit">
              <button className=" w-[120px] rounded-xl h-[38px] bg-charcoal/80 text-white">Logout</button>
            </PopoverContent>
          </Popover>}
        <ActiveUsers className=" absolute top-4 left-4" />
        <div className=" grow center gap-4 justify-between">
          <div className=" w-full h-full  center ">
            <BoardComp />
          </div>
          <h1 className=" text-5xl md:text-6xl font-bold">Bingo Master</h1>
          {user && <p> Welcome {user.name }</p>}
          <p className=" text-sm md:text-base text-center text-md  text-white/50 grow">Let's play the bingo which is not fully based on luck but you have the numbers in your hand to carve your luck</p>
        </div>
        {user === null ? 
          <button 
          disabled={isVerifying}
          className={` flex-none h-[60px] bg-white hover:bg-gray-100 text-navy  text-xl font-semibold center w-full rounded-full shadow-md flex flex-row items-center justify-center gap-3 cursor-pointer `} 
          onClick={handleLoginWithGoogle}
        > <div className=" w-[35px] h-[35px] flex items-center justify-center overflow-hidden">
          <img src={googleIcon} alt="" className=" w-full h-full object-cover" />
        </div>
          Login With Google
        </button>
        : <NavLink to="/search" className=" w-full cursor-pointer">
            <button 
              disabled={isVerifying}
              className={` w-full bg-navyblue hover:bg-navyblue/90 text-white  text-xl font-semibold center h-[60px] rounded-full shadow-md  `} 
              
            >Let's Play</button>
          </NavLink>
        }
        <button 
          className=' flex-none h-[60px] bg-charcoal hover:bg-charcoal/90 text-white  text-xl font-semibold w-full rounded-full shadow-md cursor-pointer'
          onClick={handelPlayGame}
        >How to play</button>
        <NavLink to="/aibattle" className=" font-semibold text-white/80 text-lg underline italic hover:text-gray-400">Watch AI bingo battle</NavLink>
      </div>
    </div>
  )
}

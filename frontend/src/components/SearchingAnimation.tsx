export default function SearchingAnimation({img_url="https://avatar.iran.liara.run/public/17"}) {
  return (
    <div className=" flex items-center justify-center gap-2 ">
        <div className="relative flex items-center justify-center">
            <span className="relative flex items-center justify-center h-[70px] w-[70px]">
            <span className="animate-ping absolute inline-flex h-[90px] w-[90px] rounded-full bg-navyblue opacity-75"></span>
            <span className="animate-ping delay-100 absolute inline-flex h-[60px] w-[60px] rounded-full bg-navyblue opacity-50"></span>
            <div className={` w-[70px] h-[70px] center rounded-full overflow-hidden bg-charcoal z-0 searching-player`}>
                <div className=" w-[67px] h-[67px] rounded-full bg-navy overflow-hidden">
                    <img src={img_url} className=" w-full h-full object-cover" alt="" />
                </div>
            </div>
            </span>
        </div>
    </div>
  )
}

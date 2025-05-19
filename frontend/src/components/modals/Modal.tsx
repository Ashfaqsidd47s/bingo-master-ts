import useModalStore from "../../store/modalstore";
import { Dialog,  } from "../ui/Dialog";


const  Modal = () => {
  const isModalOpen = useModalStore((state)=> state.isModalOpen)
  const modalContent = useModalStore((state)=> state.modalContent)
  const closeModal = useModalStore((state)=> state.closeModal)


  
  return (
    <Dialog open={isModalOpen} onOpenChange={closeModal} aria-describedby={undefined} >
      {modalContent}
    </Dialog>
  )
}

export default Modal

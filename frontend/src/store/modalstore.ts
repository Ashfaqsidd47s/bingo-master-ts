import React from "react";
import { create } from "zustand";

type ModalStore = { 
    isModalOpen: boolean;
    modalContent: React.ReactNode | null;
    onCloseModal?: ()=>void;
    openModal: (data: React.ReactNode | null, onCloseModal?:()=> void)=> void;
    closeModal: ()=> void
}


const useModalStore = create<ModalStore>()((set, get)=>({
    isModalOpen: false,
    modalContent: null,
    onCloseModal: undefined,
    openModal: (data, onCloseModal) => set(()=> ({ 
        modalContent: data,
        isModalOpen: true,
        onCloseModal
    })),
    closeModal: ()=> set(()=> {
        const {onCloseModal} = get();
        if(onCloseModal){
            onCloseModal()
        }  
        
        return {
            modalContent: null,
            onCloseModal: undefined,
            isModalOpen: false,
        }
    })
}))

export default useModalStore;


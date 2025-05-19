export const JOIN = "join_game";
export const CANCLE_NUMBER = "cancle_number";
export const SEND_MESSAGE = "send_message";
export const SURRENDER = "surrender";
export const TYPING = "typing";
export const NOT_TYPING = "not_typing";
export const CANCEL_OFFER = "cancel_offer";
export const ANSWER = "answer";


export type MessageData = {
    type: "normal"| "join_game" | "cancle_number" | "send_message" | "surrender" | "typing" | "not_typing" | "send_emoji" ;
    payload?:  {
        text?: string;
        number?: string;
    }
}

export type UserData = {
    id: string;
    name: string;
    email: string;
    profile_img: string;
}
export const JOIN = "join_game";
export const CANCLE_NUMBER = "cancle_number";
export const SEND_MESSAGE = "send_message";
export const SEND_EMOJI= "send_emoji";
export const SURRENDER = "surrender";
export const TYPING = "typing";
export const NOT_TYPING = "not_typing";
export const CANCEL_OFFER = "cancel_offer";
export const ANSWER = "answer";

export type JoinConversationPayload = {
    converationId : string,
    userId: string,
    token: string
}

export type MessageData = {
    type: "normal" | "online" | "offline" | "surrender" | "winner" | "looser" | "tie" | "emoji";
    payload:  {
        text: string;
        userId: string;
        turn?: boolean
    }
}

export type UserJWTData= {
    id: string,
    name: string,
    email: string,
    profile_img: string
}
import {Bingo} from "bingo-master"
import { v4 as uuidv4 } from "uuid";
import { GameManager } from "./GameManager";

export class Game {
    id: string;
    bingo: Bingo;
    players:string[];
    isGameOver: boolean;
    timer: NodeJS.Timeout | null 

    constructor(player1Id: string, player2Id: string) {
        this.id = uuidv4();
        this.bingo = new Bingo();
        this.players = [player1Id, player2Id];
        this.isGameOver = false;
        this.timer = null;

        const player1Obj = GameManager.getInstance().users.get(player1Id);
        const player2Obj = GameManager.getInstance().users.get(player2Id);

        console.log("Players")
        console.log(player1Obj?.getInfo())
        console.log(player2Obj?.getInfo())

        player1Obj?.ws.send(JSON.stringify({
            type: "game_started",
            payload: {
                oponent: player2Obj?.getInfo(),
                boardInfo: this.bingo.getMyBoardInfo(0),
                cancelInfo: this.bingo.getMyCanceledInfo(0),
                cancelCount: this.bingo.getMyCancelCount(0),
                text: "you are the first player",
                turn: true,
                isGameOver: false
            }
        }))
        player2Obj?.ws.send(JSON.stringify({
            type: "game_started",
            payload: {
                oponent: player1Obj?.getInfo(),
                boardInfo: this.bingo.getMyBoardInfo(1),
                cancelInfo: this.bingo.getMyCanceledInfo(1),
                cancelCount: this.bingo.getMyCancelCount(1),
                text: "you are the second player",
                turn: false,
                isGameOver: false
            }
        }))
        
    }

    public cancelNumber(num: number,playerId: string ){
        try {
            const playing = playerId == this.players[0] ? 0 :1;
            if(this.bingo.getTurn() != playing){
                GameManager.getInstance().users.get(playerId)?.ws.send(JSON.stringify({
                    type: "errer",
                    payload: {
                        text: "Not your turn",
                        turn: false
                    }
                }))
                return;
            }
            const otherPlayer = playing == 0 ? 1 : 0 ;
            const otherPlayerId = this.players[otherPlayer];
            this.bingo.cancelNumber(num, playing);
            if(this.bingo.getWinner() == null) {
                GameManager.getInstance().users.get(playerId)?.ws.send(JSON.stringify({
                    type: "caceled",
                    payload: {
                        boardInfo: this.bingo.getMyBoardInfo(playing),
                        cancelInfo: this.bingo.getMyCanceledInfo(playing),
                        cancelCount: this.bingo.getMyCancelCount(playing),
                        turn: false,
                        number: num,
                        isGameOver: false
                    }
                }))
                GameManager.getInstance().users.get(otherPlayerId)?.ws.send(JSON.stringify({
                    type: "caceled",
                    payload: {
                        boardInfo: this.bingo.getMyBoardInfo(otherPlayer),
                        cancelInfo: this.bingo.getMyCanceledInfo(otherPlayer),
                        cancelCount: this.bingo.getMyCancelCount(otherPlayer),
                        turn: true,
                        number: num,
                        isGameOver: false
                    }
                }))
            } else {
                const winner = this.bingo.getWinner() == playing ? playing : otherPlayer;
                const looser = this.bingo.getWinner() == playing ? otherPlayer : playing;
                GameManager.getInstance().users.get(this.players[winner])?.ws.send(JSON.stringify({
                    type: "winner",
                    payload: {
                        boardInfo: this.bingo.getMyBoardInfo(winner),
                        cancelInfo: this.bingo.getMyCanceledInfo(winner),
                        cancelCount: this.bingo.getMyCancelCount(winner),
                        turn: playing === looser,
                        number: num,
                        text: "you wone the game",
                        oponentInfo: this.bingo.getMyBoardInfo(looser),
                        oponentCancelInfo: this.bingo.getMyCanceledInfo(looser),
                        oponentCancelCount: this.bingo.getMyCancelCount(looser),
                        isGameOver: true
                    }
                }))
                GameManager.getInstance().users.get(this.players[looser])?.ws.send(JSON.stringify({
                    type: "looser",
                    payload: {
                        boardInfo: this.bingo.getMyBoardInfo(looser),
                        cancelInfo: this.bingo.getMyCanceledInfo(looser),
                        cancelCount: this.bingo.getMyCancelCount(looser),
                        turn: playing === winner,
                        number: num,
                        text: "oops you lost it",
                        oponentInfo: this.bingo.getMyBoardInfo(winner),
                        oponentCancelInfo: this.bingo.getMyCanceledInfo(winner),
                        oponentCancelCount: this.bingo.getMyCancelCount(winner),
                        isGameOver: true
                    }
                }))

                this.isGameOver = true;
                GameManager.getInstance().removeGame(this.id);
                // UPDATE THE GAME IN DB LIKE WHICH ONE WINES AND 
                // UPDATE THE USER DATA IN DB
            }
            return;
        } catch (err: any) {
            GameManager.getInstance().users.get(playerId)?.ws.send(JSON.stringify({
                type: "errer",
                payload:{
                    text: err
                }
            }))
            return;
        }
    }
    
}
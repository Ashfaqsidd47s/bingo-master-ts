import { WebSocket } from "ws";
import {CANCLE_NUMBER, JOIN, SEND_EMOJI, SEND_MESSAGE, SURRENDER, UserJWTData } from "./Types";
import { GameManager } from "./GameManager";


export class User {
    private id: string;
    private gameId: string;
    private info: UserJWTData | null;
    ws: WebSocket;


    constructor(ws: WebSocket, id : string = "", info: UserJWTData, gameId: string = "") {
        this.id = id;
        this.gameId = gameId
        this.ws = ws;
        this.info = info
        this.intialHandeler()
    }

    public getId() {
        return this.id;
    }
    public getInfo() {
        return this.info;
    }
    public getgameId() {
        return this.gameId
    }
    public setId(newid: string ) {
        this.id = newid
    }
    public setgameId(newgameId: string ) {
        this.gameId = newgameId
    }


    intialHandeler() {
        if(GameManager.getInstance().users.has(this.id)){
            const existingUser = GameManager.getInstance().users.get(this.id);
            const gameId = existingUser?.gameId;
            if(gameId) {
                this.gameId = gameId;
                const game = GameManager.getInstance().games.get(gameId);
                if(game){
                    if(game.timer){
                        clearTimeout(game.timer)
                        game.timer = null;
                    }
                    const playerIndex = game.players[0] == this.id ? 0: 1;
                    this.ws.send(JSON.stringify({
                        type: "game_started",
                        payload: {
                            oponent: GameManager.getInstance().users.get(game.players[(playerIndex + 1)/2]),
                            boardInfo: game.bingo.getMyBoardInfo(playerIndex),
                            canceledInfo: game.bingo.getMyCanceledInfo(playerIndex),
                            cancelCount: game.bingo.getMyCancelCount(playerIndex),
                            turn: game.bingo.getTurn() === playerIndex,
                            isGameOver: false
                        }
                    }))
                    GameManager.getInstance().brodcast({
                        type: "online",
                        payload: {
                            userId: this.id,
                            text: "connected back",
                            turn: game.bingo.getTurn() !== playerIndex,
                        }
                    }, this.id, this.gameId)
                    
                }
            }
            existingUser?.ws.close();
        }
        GameManager.getInstance().users.set(this.id, this);

        this.ws.on("message", async (data)=> {
            const message = JSON.parse(data.toString())
            
            this.ws.send(JSON.stringify({"test": " sending message"}))
            switch (message.type) {
                case JOIN:
                    const game = GameManager.getInstance().games.get(this.gameId);
                    if(game){
                        const player = game.players[0] === this.id ? 0 : 1;
                        this.ws.send(JSON.stringify({
                            type: "game_started",
                            payload: {
                                oponent: GameManager.getInstance().users.get(game.players[player == 1 ? 0 : 1])?.getInfo(),
                                boardInfo: game.bingo.getMyBoardInfo(player),
                                canceledInfo: game.bingo.getMyCanceledInfo(player),
                                cancelCount: game.bingo.getMyCancelCount(player),
                                turn: game.bingo.getTurn() === player,
                                isGameOver: false
                            }
                        }))
                        return;
                    }
                    const waitingId = GameManager.getInstance().waitingId;
                    const waitingUser = GameManager.getInstance().waitingUser;
                    if(waitingId && waitingUser){
                        if(this.id == waitingId) return;
                        GameManager.getInstance().createNewGame(waitingId, waitingUser, this.id, this)
                        GameManager.getInstance().waitingId = null;
                        GameManager.getInstance().waitingUser = null;
                    } else {
                        GameManager.getInstance().waitingId = this.id
                        GameManager.getInstance().waitingUser = this

                        this.ws.send(JSON.stringify({
                            type: "waiting",
                            payload: {
                                text: "hey wait a minute we are looking for other player"
                            }
                        }))
                    }
                    break;
            
                case CANCLE_NUMBER:
                    const number = Number(message?.payload?.number)
                    if(!number) {
                        this.ws.send(JSON.stringify({
                            type: "error",
                            payload:{
                                text: "Invalid number"
                            }
                        }))
                        return;
                    }
                    if(this.gameId == ""){
                        this.ws.send(JSON.stringify({
                            type: "error",
                            payload:{
                                text: "not joined any game"
                            }
                        }))
                        return;
                    }
                    GameManager.getInstance().cancleNumber(this.gameId, number, this.id)
                    break;
                case SURRENDER: {
                    const game = GameManager.getInstance().games.get(this.gameId);
                    if(game){
                        const otherPlayerId = game.players[0] === this.id ? game.players[1]: game.players[0];
                        const otherPlayerIdx = game.players[0] === this.id ? 1: 0;
                        const otherPlayer = GameManager.getInstance().users.get(otherPlayerId)
                        otherPlayer?.ws.send(JSON.stringify({
                            type: "winner",
                            payload: {
                                boardInfo: game.bingo.getMyBoardInfo(otherPlayerIdx),
                                canceledInfo: game.bingo.getMyCanceledInfo(otherPlayerIdx),
                                cancelCount: game.bingo.getMyCancelCount(otherPlayerIdx),
                                turn: game.bingo.getTurn() === otherPlayerIdx,
                                isGameOver: true
                            }
                        }))
                        game.isGameOver = true;
                        GameManager.getInstance().removeGame(game.id);
                        return;
                    }
                    break;
                }

                case SEND_MESSAGE:
                    if(this.gameId == ""){
                        this.ws.send(JSON.stringify({
                            type: "error",
                            payload:{
                                text: "not joined any game"
                            }
                        }))
                        return;
                    }
                    if(message.payload && message.payload.text){
                        GameManager.getInstance().brodcast({
                            type: "normal",
                            payload: {
                                userId: this.id,
                                text: message.payload.text
                            }
                        }, this.id, this.gameId)
                    } else {
                        this.ws.send(JSON.stringify({
                            type: "error",
                            payload:{
                                text: "empty text..."
                            }
                        }))
                        return;
                    }
                    break;
                case SEND_EMOJI:
                    if(this.gameId == ""){
                        this.ws.send(JSON.stringify({
                            type: "error",
                            payload:{
                                text: "not joined any game"
                            }
                        }))
                        return;
                    }
                    if(message.payload &&  message.payload.text){
                        GameManager.getInstance().brodcast({
                            type: "emoji",
                            payload: {
                                userId: this.id,
                                text:  message.payload.text
                            }
                        }, this.id, this.gameId)
                    } else {
                        this.ws.send(JSON.stringify({
                            type: "error",
                            payload:{
                                text: "empty text..."
                            }
                        }))
                        return;
                    }
                    break;
                default:
                    this.ws.send(JSON.stringify({
                        type:"error",
                        payload:{
                            text: "Invalid message type..."
                        }
                    }))
                    break;
            }
        })
    }

    destroy() {
        const gameManager = GameManager.getInstance();
        const game = gameManager.games.get(this.gameId);

        if(!game) {
            gameManager.users.delete(this.id);
            return;
        }

        const players = game.players;
        const otherPlayerId = players[0] === this.id ? players[1]: players[0];

        const otherPlayer = gameManager.users.get(otherPlayerId);
        const isOtherPlayerConnected = otherPlayer?.ws.readyState === WebSocket.OPEN;
        if(isOtherPlayerConnected){
            gameManager.brodcast({
                type: "offline",
                payload: {
                    userId: this.id,
                    text: "if he don't come back in 60sec you are the winner"
                }
            }, this.id, this.gameId);
            game.timer = setTimeout(() => {
                const ind : number = players[0] === this.id ? 1: 0
                otherPlayer.ws.send(JSON.stringify({
                    type: "winner",
                    payload: {
                        boardInfo: game.bingo.getMyBoardInfo(ind),
                        cancelInfo: game.bingo.getMyCanceledInfo(ind),
                        cancelCount: game.bingo.getMyCancelCount(ind),
                        turn: false,
                        text: "you wone the game",
                        oponentInfo: game.bingo.getMyBoardInfo((ind + 1)/2),
                        oponentCancelInfo: game.bingo.getMyCanceledInfo((ind + 1)/2),
                        oponentCancelCount: game.bingo.getMyCancelCount((ind + 1)/2),
                        isGameOver: true
                    }
                }))
                gameManager.removeGame(this.gameId);
            }, 60 * 1000);
        } else {
            gameManager.removeGame(game.id)
            gameManager.users.delete(this.id);
            gameManager.users.delete(otherPlayerId);
        }
    }
    
}
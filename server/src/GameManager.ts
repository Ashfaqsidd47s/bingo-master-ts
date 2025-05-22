import { User } from "./User";
import { MessageData} from "./Types";
import { config } from "dotenv";
import { Game } from "./Game";

config();

export class GameManager {
    static instance : GameManager
    games: Map<string, Game>
    users: Map<string, User>
    waitingId: string | null;
    waitingUser: User| null;

    private constructor () {
        this.games = new Map();
        this.users = new Map();
        this.waitingId = null;
        this.waitingUser = null;
    }


    static getInstance() {
        if(!this.instance) {
            this.instance = new GameManager();
        }
        return this.instance;
    }

    public createNewGame(player1Id: string, player1: User, player2Id: string, player2: User) {
        // CREATE NEW GAME WITH THE PROVIDED USERS
        // ADD THE GAME TO THE GMES 
        // ADD THE USERS TO THE USERS MAP
        const newGame = new Game(player1Id, player2Id);
        this.games.set(newGame.id, newGame);
        player1.setgameId(newGame.id)
        player2.setgameId(newGame.id)
        this.users.set(player1Id, player1)
        this.users.set(player2Id, player2)

        // MAKE A DB REQUEST TO STORE A NEW GAME HAVE BEEN STARTED BETWEEN THE USESS 
        
    }

    public cancleNumber(gameId: string, num: number,playerId: string ){
        const game = this.games.get(gameId);
        if(!game ){
            GameManager.getInstance().users.get(playerId)?.ws.send(JSON.stringify({
                type: "error",
                payload: {
                    text: "No gamejoined..."
                }
            }))
            return;
        }
        game.cancelNumber(num, playerId)
    }
    public brodcast(message: MessageData, userId: string, gameId: string) {
        if(!this.games.get(gameId)) {
            this.users.get(userId)?.ws.send(JSON.stringify({
                type: "error",
                payload: {
                    text: "Game id not found"
                }
            }))
            return;
        } 
        const players = this.games.get(gameId)?.players
        if(players) {
            const sender = players[0] == userId ? players[0] : players[1];
            const reciever = players[0] == userId ? players[1] : players[0];
            this.users.get(reciever)?.ws.send(JSON.stringify(message))
        }

        
    }

    public removeGame(gameId: string) {
        this.games.delete(gameId);
    }

}



import express, { NextFunction, Request, Response } from "express";
import cors from "cors"
import userRouter from "./routes/user"
import authRouter from "./routes/auth"
import { config } from "dotenv";
import { decryptJWT, isValidJWT } from "./utils/auth";
import cookieParser from "cookie-parser";
import { WebSocketServer } from "ws";
import { User } from "./User";
import { GameManager } from "./GameManager";


const app = express();
config(); 

const JWT_SECRET = process.env.JWT_SECRET;
// MIDDLEWARES
app.use(express.json())
app.use(cookieParser())
app.use(cors({
    origin: [process.env.CLIENT_URL as string, process.env.BASE_URL as string],
    methods: ["GET","PUT", "POST", "DELETE"],
    credentials: true
}))


// ROUTES
app.use("/auth", authRouter);

// USE AUTH MIDDLE WARE FOR AUTHNTICATION 
app.use(authenticateJWT)

app.use("/api/user", userRouter);

app.get("/", async (req, res)=> {
    res.json({"message": "server working fine"}).status(200);
})


// MIDDLWARE TO AUTHENTICATE USER USING JWT
function authenticateJWT(req: Request, res: Response, next: NextFunction): void {
    try {
        const token = req.cookies?.token;

        if (!token) {
            res.status(302).redirect("/auth/login");
            return;
        }
        
        if(!isValidJWT(token)) {
            res.status(302).redirect("/auth/login");
           return;
        }

        next();
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Internal server error'});
    }
};

// ALL ROUTES BELOW THIS WILL BE AUTHENTICATED FIRST BY THIS MIDDLEWARE
app.use(authenticateJWT) 





// HTTP SERVER
const server = app.listen(process.env.PORT || 8080, ()=> {
    console.log("server listing to the port :", process.env.PORT || 8080)
})

// WEB SOCKET SERVER
const wss = new WebSocketServer({server});

wss.on("connection", async function connection(ws, req) {
    
    wss.clients.forEach((client) => {
        client.send(JSON.stringify({
            type: "user_count",
            payload: {
                count: wss.clients.size,
                text: "active users"
            }
        }));
    });
     
    const cookies = req.headers.cookie;
    let id = "";
    if(!cookies){
        ws.send(JSON.stringify({
            type:"error",
            text:"user not authorized"
        }))
        return;
    }
    const token = cookies.split("; ").find((cookie) => cookie.startsWith("token="))?.split("=")[1];
    if(!token) {
        ws.send(JSON.stringify({
            type:"error",
            text:"user not authorized"
        }))
        return;
    }
    const data = decryptJWT(token)
    if(data){
        id = data.id;
    } else {
        ws.send(JSON.stringify({
            type:"error",
            text:"user not authorized"
        }))
        return;
    }

    let user = new User(ws, id, data);
    
    ws.on("error", console.error);
    
    ws.on("message", async (data)=> {
        const message = JSON.parse(data.toString());
        // console.log(" message recieved :", message)
    })
    ws.on("close", async ()=> {
        // console.log("socket closing...")
        // if the otheruser has alredy left the game then destroy the game and user user as well 
        user.destroy();
        const waitingId = GameManager.getInstance().waitingId;
        if(user.getId() === waitingId){ 
            GameManager.getInstance().waitingId = null;
            GameManager.getInstance().waitingUser = null;
        }
        wss.clients.forEach((client) => {
            client.send(JSON.stringify({
                type: "user_count",
                payload: {
                    count: wss.clients.size,
                    text: "active users"
                }
            }));
        });
        // console.log(" active users" , GameManager.getInstance().users.size)
        // console.log(GameManager.getInstance().games.size)
    })
})
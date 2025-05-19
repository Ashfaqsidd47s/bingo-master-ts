import {WebSocket} from "ws"
import { describe, expect, beforeAll, afterAll, test } from "vitest";
import { generateJWT } from "../src/utils/auth";
import { JOIN } from "../src/Types";


const WS_URL = 'ws://localhost:8080'

let validToken1 = "";
let validToken2 = "";

beforeAll(() => {
    validToken1 = generateJWT({id: "1",name: "test1", email: "test1@gmail.com" })
    validToken2 = generateJWT({id: "2",name: "test2", email: "test2@gmail.com" })
});

afterAll(() => {

});

// the reason i am using sequential testes because i am simply using the same user id and if it would have now sequential 
// it might give some unpredicatable errors that why even thow i am using different ws connecion in each time but the id is same 
// and i have setup like if my id is same so it will dissconect previous one and connect new one so in that case this might create 
// some fuzzy errors


describe.sequential("WebSocket Server Tests", async () => {

    test("should reject a connection without a valid JWT", () => {
        const ws = new WebSocket(WS_URL);

        return new Promise<void>((resolve, reject) => {
            ws.on("message", (message) => {
                const response = JSON.parse(message.toString());
                expect(response.type).toBe("error");
                expect(response.text).toBe("user not authorized");
                ws.close();
                resolve();
            });

            ws.on("error", reject);
        })
    });
  
    test("should accept a connection with a valid JWT", async () => {
        const ws = new WebSocket(WS_URL, {
            headers: { cookie: `token=${validToken1}` },
        });

        return new Promise<void>((resolve, reject) => {
            ws.on("open",() => {
                expect(ws.readyState).toBe(WebSocket.OPEN);
                ws.close();
                resolve()
            });
            ws.on("error", reject)
        })
    });
  
    test("should allow two users to connect and start a game", async () => {
        const ws1 = new WebSocket(WS_URL, {
            headers: { cookie: `token=${validToken1}` },
        });
    
        const ws2 = new WebSocket(WS_URL, {
            headers: { cookie: `token=${validToken2}` },
        });

        // one interesting thing i learned 
        // its not manadatory to mention async it will automaticaly keep that in acount even ts wont gave an eror lets see
        // now when i think about it it seems like aah its obvious thing the function will be like it has a return type of promis 
        // which in my guess are treated as variables or those technicaly are objects if i am not wrong 

        async function isWsReady(ws: WebSocket): Promise<void> {
            return new Promise<void>((resolve, reject) => {
                ws.on("open", ()=> {
                    resolve()
                })
                ws.on("error", ()=>{
                    reject(new Error("error while connecting the websocket"))
                })
            })
        }

        await isWsReady(ws1); 
        await isWsReady(ws2); 
    
        return new Promise<void>((resolve, reject) => {
            ws1.send(JSON.stringify({
                type: JOIN,
                payload: {userId: "1"}
            }))
            ws1.on("message", (message)=>{
                const response = JSON.parse(message.toString());
                if (response.type === "waiting") {
                    if(ws2.readyState == WebSocket.OPEN) {
                        ws2.send(JSON.stringify({
                            type: JOIN,
                            payload: { userId: "2" }
                        }));
                    }
                } else if (response.type === "game_started") {
                    expect(response.payload.boardInfo).toBeDefined();
                    if(ws1.readyState == WebSocket.OPEN) ws1.close();
                    if(ws2.readyState == WebSocket.OPEN) ws2.close();
                    resolve();
                } else if (response.type === "offline") {
                    if(ws1.readyState == WebSocket.OPEN) ws1.close();
                    if(ws2.readyState == WebSocket.OPEN) ws2.close();
                    resolve();
                } else if (response.type === "error") {
                    reject(new Error("Game error: " + response.payload?.text));
                } else {
                    reject(new Error("Unexpected response type"));
                }
            })

            ws1.on("error", ()=> {reject(new Error("Something went wrong on making wsconnection"))})
            ws2.on("error", ()=> {reject(new Error("Something went wrong on making wsconnection"))})
        });
    });

    test('should make the winner after 60s if the other person left the game', async () => {
        const ws1 = new WebSocket(WS_URL, {
            headers: { cookie: `token=${validToken1}` },
        });
    
        const ws2 = new WebSocket(WS_URL, {
            headers: { cookie: `token=${validToken2}` },
        });

        async function isWsReady(ws: WebSocket): Promise<void> {
            return new Promise<void>((resolve, reject) => {
                ws.on("open", ()=> {
                    resolve()
                })
                ws.on("error", ()=>{
                    reject(new Error("error while connecting the websocket"))
                })
            })
        }

        await isWsReady(ws1); 
        await isWsReady(ws2); 

        return new Promise<void>((resolve, reject) => {
            ws1.send(JSON.stringify({
                type: JOIN,
                payload: {userId: "1"}
            }))
            ws1.on("message", (message)=>{
                const response = JSON.parse(message.toString());
                if (response.type === "waiting") {
                    ws2.send(JSON.stringify({
                        type: JOIN,
                        payload: { userId: "2" }
                    }));
                    ws2.close();
                } else if (response.type === "game_started") {
                    expect(response.payload.boardInfo).toBeDefined();
                } else if (response.type === "winner") {
                    if(ws1.readyState === WebSocket.OPEN) ws1.close()
                    if(ws2.readyState === WebSocket.OPEN) ws2.close()
                    resolve()
                } else if (response.type === "offline") {
                    setTimeout(() => {
                        reject(new Error("didnt became the winner even after the 60 seconds"))
                    }, 62 * 1000);
                } else if (response.type === "error") {
                    reject(new Error("Game error: " + response.payload?.text));
                } else {
                    reject(new Error("Unexpected response type"));
                }
            })
            ws2.on("message", (message)=>{
                const response = JSON.parse(message.toString());
                if (response.type === "game_started") {
                    expect(response.payload.boardInfo).toBeDefined();

                } else if (response.type === "offline") {
                    setTimeout(() => {
                        reject(new Error("didnt became the winner even after the 60 seconds"))
                    }, 62 * 1000);
                } else if (response.type === "error") {
                    reject(new Error("Game error: " + response.payload?.text));
                } else {
                    reject(new Error("Unexpected response type"));
                }
            })

            ws1.on("error", ()=> {reject(new Error("Something went wrong on making wsconnection"))})
            ws2.on("error", ()=> {reject(new Error("Something went wrong on making wsconnection"))})
        });
    }, 70 * 1000)
    
    // test('should make the winner if the other persone leavs the game in 60 sec', async () => {
    //     const ws1 = new WebSocket(WS_URL, {
    //         headers: { cookie: `token=${validToken1}` },
    //     });
    
    //     const ws2 = new WebSocket(WS_URL, {
    //         headers: { cookie: `token=${validToken2}` },
    //     });
    
    //     return new Promise<void>((resolve, reject) => {
            
    //         if(ws1 && ws2) {
    //             ws1.on("open", ()=>{
    //                 ws1?.send(JSON.stringify({
    //                     type: JOIN,
    //                     payload: {userId: "1"}
    //                 }))
    //                 ws1?.on("message", (message)=> {
    //                     const response = JSON.parse(message.toString());
    //                     if (response.type === "waiting") {
    //                         if(ws2?.readyState == WebSocket.OPEN) {
    //                             ws2.send(JSON.stringify({
    //                                 type: JOIN,
    //                                 payload: { userId: "2" }
    //                             }));
    //                         }
    //                     } else if (response.type === "game_started") {
    //                         expect(response.payload.boardInfo).toBeDefined();
    //                         if(ws1?.readyState == WebSocket.OPEN) ws1.close();
    //                     }  else if (response.type === "error") {
    //                         reject(new Error("Game error: " + response.payload?.text));
    //                     } else {
    //                         reject(new Error("Unexpected response type"));
    //                     }
    //                 })
    //             })
    //             ws2.on("open", ()=>{
    //                 ws2?.on("message", (message)=> {
    //                     const response = JSON.parse(message.toString());
    //                     if (response.type === "game_started") {
    //                         expect(response.payload.boardInfo).toBeDefined();
    //                     }  else if (response.type === "offline") {
    //                         setTimeout(() => {
    //                             reject(new Error("It took more then 60 seconds "))
    //                         }, 62* 1000);
    //                     }  else if (response.type === "winner") {
    //                         resolve()
    //                     }  else if (response.type === "error") {
    //                         reject(new Error("Game error: " + response.payload?.text));
    //                     } else {
    //                         reject(new Error("Unexpected response type"));
    //                     }
    //                 })
    //             })

    //             ws1.on("error", (error) => reject(new Error("ws1 error: " + error.message)));
    //             ws2.on("error", (error) => reject(new Error("ws2 error: " + error.message)));
    //         } else {
    //             reject(new Error("some thing went wrong..."))
    //         }
    //     });
    // }, 70000)

    // test('should determine a winner if someone have cancel count 5 or greater then 5', async () => {
    //     ws1 = new WebSocket(WS_URL, {
    //         headers: { cookie: `token=${validToken1}` },
    //     });
    
    //     ws2 = new WebSocket(WS_URL, {
    //         headers: { cookie: `token=${validToken2}` },
    //     });

    //     return new Promise<void>((resolve, reject) => {
    //         if(ws1 && ws2) {

    //             ws1.on("open", ()=>{
    //                 ws1?.send(JSON.stringify({
    //                     type: JOIN,
    //                     payload: {userId: "1"}
    //                 }))
    //                 ws1?.on("message", (message)=> {
    //                     const response = JSON.parse(message.toString());
    //                     if (response.type === "waiting") {
    //                         if(ws2?.readyState == WebSocket.OPEN) {
    //                             ws2.send(JSON.stringify({
    //                                 type: JOIN,
    //                                 payload: { userId: "2" }
    //                             }));
    //                         }
    //                     } else if (response.type === "game_started") {
    //                         expect(response.payload.boardInfo).toBeDefined();
    //                         if(ws1?.readyState == WebSocket.OPEN) ws1.close();
    //                     }  else if (response.type === "error") {
    //                         reject(new Error("Game error: " + response.payload?.text));
    //                     } else {
    //                         reject(new Error("Unexpected response type"));
    //                     }
    //                 })
    //             })
    //             ws2.on("open", ()=>{
    //                 ws2?.on("message", (message)=> {
    //                     const response = JSON.parse(message.toString());
    //                     if (response.type === "game_started") {
    //                         expect(response.payload.boardInfo).toBeDefined();
    //                     }  else if (response.type === "offline") {
    //                         setTimeout(() => {
    //                             reject(new Error("It took more then 60 seconds "))
    //                         }, 62* 1000);
    //                     }  else if (response.type === "winner") {
    //                         resolve()
    //                     }  else if (response.type === "error") {
    //                         reject(new Error("Game error: " + response.payload?.text));
    //                     } else {
    //                         reject(new Error("Unexpected response type"));
    //                     }
    //                 })
    //             })

    //             ws1.on("error", (error) => reject(new Error("ws1 error: " + error.message)));
    //             ws2.on("error", (error) => reject(new Error("ws2 error: " + error.message)));
    //         } else {
    //             reject(new Error("some thing went wrong..."))
    //         }
    //     });
    // })
    
});

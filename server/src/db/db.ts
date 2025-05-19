import { Pool } from "pg";
import { generateRandomStr } from "../utils/random";
import { UserJWTData } from "../Types";
import { config } from "dotenv";

config()


export const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
})

export const query = async (text: string, params: string[]) => {
    try {
        return await pool.query(text, params);
    } catch (err) {
        console.error('Database query error:', err);
        throw err;
    }
};

export async function createUser(name: string, email: string, profile_img: string): Promise<UserJWTData> {
    try {
      const password = "google" + generateRandomStr(6);
      const parameters = [name, email, password, profile_img];
      const queryStr = `
        INSERT INTO "users" (name, email, password, profile_img) 
        VALUES ($1, $2, $3, $4) 
        RETURNING id, name, email
      `;
      
      const { rows } = await pool.query(queryStr, parameters);
      return rows[0]; // Return the newly created user
    } catch (err) {
      console.error("Error in createUser:", err);
      throw err;
    }
}

export async function createGame(gameId:string, player1Id:string, player2Id: string) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const queryStr = `INSERT INTO "games" (id, state) VALUES ($1, $2) RETURNING id`;
    const gameResult = await client.query(queryStr, [gameId, "running"])
    
    await client.query(
      `INSERT INTO "game_players" (game_id, user_id) VALUES ($1, $2), ($1, $3)`,
      [gameId, player1Id, player2Id]
    );
    
    await client.query("COMMIT");
    return gameResult.rows[0]
  } catch (err) {
    await client.query("ROLLBACK")
    console.error("Error in creategame:", err);
    throw err;
  } finally {
    client.release()
  }
}

export async function updateWinner(gameId: string, isOver: boolean) {
  try {
    const queryStr = `
      UPDATE "games" SET state = $1
      WHERE id = $2
      RETURNING id, state, winner
    `;
    const { rows } = await pool.query(queryStr, [isOver ? 'over' : 'tied', gameId]);
    console.log("created data :", rows[0])
    return rows[0]
  } catch (err) {
    console.log("error while updating the game winner")
    throw err
  }
}


// createGame("b281147c-50ed-4e2c-9b46-ca7a4dbc4e5e", "b281147c-50ed-4e2c-9b46-ca7a4dbc4e5e", "886f7fbe-48a6-4808-816f-5bdb8b72832c")

updateWinner("b281147c-50ed-4e2c-9b46-ca7a4dbc4e5e", false);
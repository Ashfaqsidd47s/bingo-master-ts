import { Tile } from "bingo-master/dist/types";

// const prompt = `You are playing a strategic variation of Bingo on a 4x4 board, competing against another player. 

// ### **Game Rules:**
// 1. Each player has a unique **4x4 board** with numbers **1 to 16**, arranged randomly.
// 2. Players only **see their own board** and take turns calling out a number that hasn’t been canceled.
// 3. The goal is to **be the first to score 4 points**.
// 4. A **point is scored** when an entire **row, column, or diagonal** is fully canceled.
// 5. You win if you achieve **4 or more completed rows, columns, or diagonals**, whether from **your own selections or the opponent’s**.
// 6. The opponent's choices can impact your board, so plan your moves strategically.

// ### **Your Task:**
// - Treat this like a **strategy-based game (similar to chess or a card game)**, where randomness only affects initial board setup.
// - Think **mathematically**: Find the optimal number to cancel that maximizes your chance of winning.
// - Consider all possible winning paths, anticipating the best **move sequence** to reach 4 points first.

// ### **Your Input:**
// You will receive the **current state of your board** as a **JSON object**, structured as:
// - A **4x4 matrix**, where each cell contains:
//   - 'value' (1-16)
//   - 'isCanceled' (true/false)

// ### **Your Output:**
// - **Return a single number (1-16)** that represents your best move to get closer to victory.

// Now, analyze the board and choose the best number to cancel.`;


export function bingoBot(boardInfo: Tile[][]): number {
  // it would be fun if i have used ai insted of this bot but hope i will do it in future 
  // chek all rows columns which one can be finished first  cancel that one simple as that 
  // hey it could be a nice dsa problem if i look it from optimization prospective 
  // for now lets just brute force it 
  const size = boardInfo.length;

  const cancelCountOfRow = new Array<number>(size)
  const cancelCountOfCol = new Array<number>(size)
  const cancelCountOfDi = new Array<number>(2)

  let maxPoints = -1;
  let bestMove = -1;
  // -1 will come in handy if we try some stratagy for the begining like if only a few of tiles have canceled then it should follow a specific patter
  // that will be really fun hope i will do it next time
  
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      if(boardInfo[i][j].isCanceled){
        cancelCountOfRow[i]++;
        cancelCountOfCol[j]++;
        if(i === j){
          cancelCountOfDi[0]++;
        }
        if(i + j + 1 === size){
          cancelCountOfDi[1]++;
        }
      }
    }
  }

  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      if(!boardInfo[i][j].isCanceled){
        if(bestMove === -1) bestMove = boardInfo[i][j].value;
        let points = 0;
        if(cancelCountOfRow[i] === size - 1) points++;
        if(cancelCountOfCol[j] === size - 1) points++;
        if(i === j && cancelCountOfDi[0] === size - 1) points++;
        if(i + j === size - 1 && cancelCountOfDi[1] === size - 1) points++;

        if(points > maxPoints){
          maxPoints = points;
          bestMove = boardInfo[i][j].value;
        }
      }
    }
  }

  return bestMove;
}


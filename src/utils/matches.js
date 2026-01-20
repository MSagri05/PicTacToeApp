// this file handles all the SQLite stuff for match history
// I'm storing every game result here so players can look back at their past matches.
// kept in utils so the GameScreen + HistoryScreen can reuse the same database functions.

import { openDatabaseAsync } from "expo-sqlite";

let dbPromise;

// open (or create) the main app database only once
function getDb() {
  if (!dbPromise) dbPromise = openDatabaseAsync("app.db"); 
  return dbPromise;
}

export async function initMatchesTable() {
  const db = await getDb();

  // create the matches table if it doesn’t exist yet
  // this stores: who won, how many moves, full board state, and a timestamp
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS matches (
      id INTEGER PRIMARY KEY NOT NULL,
      created_at INTEGER NOT NULL,
      winner TEXT NOT NULL,          -- "P1" | "P2" | "Draw"
      moves_count INTEGER NOT NULL,  -- 0..9
      board_json TEXT NOT NULL       -- JSON.stringify([...9 cells with {uri,player} or null])
    );
  `);
}

export async function insertMatch({ winner, movesCount, board }) {
  const db = await getDb();
  const createdAt = Date.now();

  // store the whole board as JSON so I can show it later in match history if needed
  const boardJson = JSON.stringify(board);

  await db.runAsync(
    "INSERT INTO matches (created_at, winner, moves_count, board_json) VALUES (?, ?, ?, ?);",
    [createdAt, winner, movesCount, boardJson]
  );
}

export async function fetchMatches() {
  const db = await getDb();

  // get all saved matches in newest -> oldest order
  return db.getAllAsync("SELECT * FROM matches ORDER BY id DESC;");
}

export async function removeMatch(id) {
  const db = await getDb();

  // delete a single match by its ID
  await db.runAsync("DELETE FROM matches WHERE id = ?;", [id]);
}

export async function resetMatches() {
  const db = await getDb();

  // clear all match history (used for the reset button)
  await db.runAsync("DELETE FROM matches;");
}

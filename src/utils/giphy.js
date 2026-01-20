// helper function to fetch reaction GIFs from the GIPHY API
// I use this in the game to show fun reactions (celebrate, funny, win/loss vibes).
// lets the players interact with each other using GIFs… makes the match feel more alive.
// friends can react when they're about to win, when they're frustrated, happy, shocked, etc.
// basically it adds personality + emotion to the gameplay instead of just a normal board.

const GIPHY_API_KEY = "oLpyk21CLb8RfZgKuREigmDJ0b7h80C2";

export async function fetchReactionGif(query = "funny reaction") {
  // build the endpoint based on whatever mood/query I send in
  const endpoint =
    "https://api.giphy.com/v1/gifs/search" +
    `?api_key=${GIPHY_API_KEY}` +
    `&q=${encodeURIComponent(query)}` +
    "&limit=12" +   // grab 12, but later I only use up to 8
    "&rating=g" +   // keep it clean PG-rated gifs
    "&lang=en";

  try {
    const res = await fetch(endpoint);
    if (!res.ok) {
      // if api breaks, I want to know the status in dev
      throw new Error(`GIPHY HTTP error: ${res.status}`);
    }

    const json = await res.json();
    const results = json?.data;

    // if nothing comes back, just return empty so UI doesn’t break
    if (!results || !results.length) {
      return [];
    }

    // pick the downsized versions so they load quickly in the app
    const urls = results
      .map((gif) =>
        gif?.images?.downsized_medium?.url ||
        gif?.images?.downsized?.url ||
        gif?.images?.original?.url ||
        null
      )
      .filter(Boolean);

    // return max 8 gifs so I don’t overwhelm the screen
    return urls.slice(0, 8);
  } catch (e) {
    console.warn("GIPHY fetch error:", e);
    // fail gracefully...the rest of the game still works without gifs
    return [];
  }
}

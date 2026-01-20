// this screen shows all the past matches that were saved locally in sqlite
// can refresh, delete single matches, or reset everything if wanna start over
import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { fetchMatches, removeMatch, resetMatches } from "../utils/matches";
import { loadUserPrefs } from "../utils/storage"; // get  nickname

const BG = "#DD3A43";
const ACCENT = "#B3E5FC";

export default function MatchHistoryScreen({ route }) {
  const [items, setItems] = useState([]); // all saved matches from sqlite db
  const [loading, setLoading] = useState(true); // true = loading spinner on flatlist
  const [meName, setMeName] = useState("You"); // nickname 

  // name of the opponent passed from game screen (fallback friend)
  const friendName = route?.params?.p2Name || "Friend";

  // load my nickname from asyncstorage (shown in winner label)
  useEffect(() => {
    (async () => {
      try {
        const prefs = await loadUserPrefs();
        if (prefs?.name) setMeName(prefs.name);
      } catch (e) {
        console.warn("Failed to load prefs for history screen", e);
      }
    })();
  }, []);

  // helper to reload matches from sqlite
  const load = async () => {
    setLoading(true); // start refresh spinner
    try {
      const rows = await fetchMatches(); // fetch all saved rows
      setItems(rows || []); // store into local state
    } catch (e) {
      console.warn(e);
      Alert.alert("History error", String(e));
    } finally {
      setLoading(false); // stop spinner
    }
  };

  // load history when screen mounts
  useEffect(() => {
    load();
  }, []);

  // delete one match row
  const onDelete = async (id) => {
    await removeMatch(id); // remove from db
    await load(); 
  };

  // delete EVERYTHING
  const onReset = async () => {
    await resetMatches(); // clear db table
    await load(); 
  };

  // row renderer for each match card in list
  const renderItem = ({ item }) => {
    const date = new Date(item.created_at); 

    // formatting winner field (convert P1/P2 → my name / friend's name)
    let winnerLabel = item.winner;
    if (item.winner === "P1") {
      winnerLabel = meName || "You"; // your custom nickname
    } else if (item.winner === "P2") {
      winnerLabel = friendName; // friend's nickname
    } else if (item.winner === "Draw") {
      winnerLabel = "Draw"; // keep draw same
    }

    return (
      <View style={styles.card}>
        {/* left column with date + result */}
        <View style={{ flex: 1 }}>
          <Text style={styles.titleRow}>{date.toLocaleString()}</Text>
          <Text style={styles.subRow}>
            Winner: {winnerLabel} · Moves: {item.moves_count}
          </Text>
        </View>

        {/* delete match button */}
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => onDelete(item.id)}
        >
          <Text style={styles.deleteText}>Delete</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* top header */}
      <Text style={styles.header}>Match History </Text>

      {/* list of saved matches */}
      <FlatList
        data={items}
        keyExtractor={(it) => String(it.id)} // sqlite id → string
        renderItem={renderItem}
        refreshing={loading} // pull to refresh spinner
        onRefresh={load} // swipe refresh handler
        ListEmptyComponent={
          !loading && (
            <Text style={styles.empty}>No matches yet — play a game!</Text>
          )
        }
        contentContainerStyle={{ paddingVertical: 8 }}
      />

      {/* reset everything button (only if there are matches) */}
      {!!items.length && (
        <TouchableOpacity style={styles.resetBtn} onPress={onReset}>
          <Text style={styles.resetText}>Reset all</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
    padding: 16,
  },
  header: {
    color: "#fff",
    fontSize: 28,
    fontFamily: "SourGummy_600SemiBold",
    marginBottom: 8,
  },

  // match card style
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 3,
  },
  titleRow: {
    fontWeight: "800",
    color: "#222",
  },
  subRow: {
    color: "#555",
    marginTop: 2,
  },

  // delete match pill button
  deleteBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: "#FFE4E7",
  },
  deleteText: {
    color: "#B00020",
    fontWeight: "700",
  },

  // when no matches saved
  empty: {
    color: "#fff",
    marginTop: 12,
  },

  // reset-all button at bottom
  resetBtn: {
    alignSelf: "center",
    marginTop: 8,
    padding: 10,
  },
  resetText: {
    color: "#fff",
    textDecorationLine: "underline",
  },
});

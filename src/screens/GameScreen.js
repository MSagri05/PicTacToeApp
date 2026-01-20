// main game screen – this is where the actual Pic-Tac-Toe match happens
// 3x3 photo board: every move is a photo from camera or gallery
// players take turns as P1 (O) and P2 (X), and we detect win/draw like classic tic-tac-toe
// this screen also:
//  .. saves each finished match to SQLite (for Match History)
//  lets players react to the latest move with emojis + GIFs (GIPHY API)
//  shows haptic feedback for win/draw
//   shows a winner overlay with confetti + share button
//  -pulls player 1 avatar + nickname from AsyncStorage profile prefs

import { useState, useMemo, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  Alert,
  Button,
  Share,
  Modal,
  TextInput,
  TouchableOpacity,
  Vibration,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as Animatable from "react-native-animatable";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { initMatchesTable, insertMatch } from "../utils/matches";
import { fetchReactionGif } from "../utils/giphy";
import ConfettiCannon from "react-native-confetti-cannon";
import { loadUserPrefs } from "../utils/storage"; // pull profile avatar + name

const BG = "#DD3A43";
const ACCENT = "#B3E5FC";
const HINT_KEY = "REACTION_BAR_HINT_SEEN";

// all winning lines for classic tic-tac-toe
const LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

// simple haptic helpers for end of game feedback
const vibrateWin = () => Vibration.vibrate([120, 60, 120, 60, 220]);
const vibrateDraw = () => Vibration.vibrate([80, 40, 80]);

export default function GameScreen({ navigation, route }) {
  // names passed from previous screen... fallback to "You" + "Friend"
  const p1Name = route?.params?.p1Name || "You";
  const p2Name = route?.params?.p2Name || "Friend";

  // each cell: { uri: string | null, player: "P1" | "P2" | null }
  const [board, setBoard] = useState(Array(9).fill(null));
  const [turn, setTurn] = useState("P1");       // P1 starts
  const [ended, setEnded] = useState(false);    // game finished flag
  const [winner, setWinner] = useState(null);   // "P1" | "P2" | "Draw" | null
  const [lastMoveUri, setLastMoveUri] = useState(null);
  const [lastMoveIndex, setLastMoveIndex] = useState(null); // which tile was just played

  // emoji reactions (local, no API)
  // shape: { [cellIndex]: Array<{ id: string, emoji: string }> }
  const [emojiReactions, setEmojiReactions] = useState({});

  // GIF reaction search (uses GIPHY API)
  const [reactionPromptCell, setReactionPromptCell] = useState(null); // cell index to react to
  const [reactionQuery, setReactionQuery] = useState("");
  const [reactionLoading, setReactionLoading] = useState(false);
  const [gifResults, setGifResults] = useState([]); // list of GIF URLs

  // temporary big GIF pop-up
  const [reactionOverlayUrl, setReactionOverlayUrl] = useState(null);
  const [reactionOverlayVisible, setReactionOverlayVisible] = useState(false);
  const [reactionOverlayBy, setReactionOverlayBy] = useState(null); // who reacted

  // one-time hint for the bottom reaction bar
  const [hintSeen, setHintSeen] = useState(true);
  const [showHint, setShowHint] = useState(false);

  // your profile avatar (from user prefs)
  const [meAvatarUri, setMeAvatarUri] = useState(null);

  // make sure our local sqlite table exists before first save
  useEffect(() => {
    (async () => {
      try {
        await initMatchesTable();
      } catch (e) {
        console.warn(e);
      }
    })();
  }, []);

  // load hint seen flag from AsyncStorage
  useEffect(() => {
    (async () => {
      try {
        const seen = await AsyncStorage.getItem(HINT_KEY);
        setHintSeen(!!seen);
      } catch {
        setHintSeen(true);
      }
    })();
  }, []);

  // load your avatar from user prefs so we can show it as P1
  useEffect(() => {
    (async () => {
      try {
        const prefs = await loadUserPrefs();
        if (prefs?.avatarUri) {
          setMeAvatarUri(prefs.avatarUri);
        }
      } catch (e) {
        console.warn("Failed to load avatar for game screen", e);
      }
    })();
  }, []);

  // once the first photo is placed, show the little hint (only if not seen before)
  useEffect(() => {
    if (hintSeen || ended) return;
    const anyPhoto = board.some((c) => !!c?.uri);
    if (anyPhoto) setShowHint(true);
  }, [board, hintSeen, ended]);

  const dismissHint = async () => {
    setShowHint(false);
    setHintSeen(true);
    try {
      await AsyncStorage.setItem(HINT_KEY, "1");
    } catch {}
  };

  // helper... show correct label for each player
  const labelFor = (p) => (p === "P1" ? p1Name : p2Name);

  // check if someone won on the given board
  const checkWinner = (nextBoard) => {
    for (const [a, b, c] of LINES) {
      const A = nextBoard[a]?.player,
        B = nextBoard[b]?.player,
        C = nextBoard[c]?.player;
      if (A && A === B && B === C) return A;
    }
    return null;
  };

  // drop a photo into a cell + handle win/draw/turn switch
  const applyMove = async (uri, index) => {
    if (!uri) return;

    const next = [...board];

    // basic cell object first (no GIF saved on tile, just photo + who played)
    const baseCell = { uri, player: turn };
    next[index] = baseCell;

    setLastMoveUri(uri);
    setLastMoveIndex(index);

    const w = checkWinner(next);
    if (w) {
      setBoard(next);
      setWinner(w);
      setEnded(true);

      // haptic: celebratory pattern on win
      vibrateWin();

      // save result to local db... winner + moves + final board
      try {
        await insertMatch({
          winner: w,
          movesCount: next.filter(Boolean).length,
          board: next,
        });
      } catch (e) {
        console.warn("Failed to save match", e);
      }
      return;
    }

    // if board is full and no winner... it’s a draw
    if (next.every(Boolean)) {
      setBoard(next);
      setWinner("Draw");
      setEnded(true);

      // haptic: short double buzz on draw
      vibrateDraw();

      try {
        await insertMatch({ winner: "Draw", movesCount: 9, board: next });
      } catch (e) {
        console.warn("Failed to save match", e);
      }
      return;
    }

    // otherwise keep playing... flip turn
    setBoard(next);
    setTurn(turn === "P1" ? "P2" : "P1");
  };

  // take a new photo from camera
  const pickFromCamera = async (index) => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission needed",
        "Camera access is required to take photos."
      );
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      const uri = result.assets?.[0]?.uri;
      await applyMove(uri, index);
    }
  };

  // choose from gallery
  const pickFromGallery = async (index) => {
    const { status } =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission needed",
        "Photo library access is required."
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });
    if (!result.canceled) {
      const uri = result.assets?.[0]?.uri;
      await applyMove(uri, index);
    }
  };

  // on empty cell press... ask camera or gallery
  const onPickImage = (index) => {
    if (ended || board[index]) return;
    Alert.alert("Choose Photo Source", `It's ${labelFor(turn)}'s move`, [
      { text: "Camera", onPress: () => pickFromCamera(index) },
      { text: "Gallery", onPress: () => pickFromGallery(index) },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  // add an emoji reaction burst to the last move
  const addEmojiReaction = (emoji) => {
    if (lastMoveIndex === null || !board[lastMoveIndex]?.uri) {
      Alert.alert("Play first", "Place a photo before sending a reaction.");
      return;
    }
    setEmojiReactions((prev) => {
      const list = prev[lastMoveIndex] || [];
      const next = {
        ...prev,
        [lastMoveIndex]: [
          ...list,
          { id: String(Date.now() + Math.random()), emoji },
        ],
      };
      return next;
    });
    if (!hintSeen) dismissHint();
  };

  // open GIF popup for the most recent move
  const openGifPrompt = () => {
    if (lastMoveIndex === null || !board[lastMoveIndex]?.uri) {
      Alert.alert("Play first", "Place a photo before sending a GIF.");
      return;
    }
    setReactionPromptCell(lastMoveIndex);
    setReactionQuery("");
    setGifResults([]); // clear old results
  };

  // user pressed "Skip" on GIF reaction
  const onSkipReaction = () => {
    setReactionPromptCell(null);
    setReactionQuery("");
    setReactionLoading(false);
    setGifResults([]);
    if (!hintSeen) dismissHint();
  };

  // user pressed "Search GIFs" → actually searches & shows choices
  const onSendReaction = async () => {
    if (reactionPromptCell === null) return;

    const query = reactionQuery.trim() || "reaction";

    try {
      setReactionLoading(true);
      const urls = await fetchReactionGif(query);
      setReactionLoading(false);

      const list = Array.isArray(urls) ? urls : urls ? [urls] : [];
      setGifResults(list);

      if (!list.length) {
        Alert.alert(
          "No GIF found",
          "Try a different word like 'happy', 'salty', or 'crying'."
        );
      }

      if (!hintSeen) dismissHint();
    } catch (e) {
      console.warn("GIF reaction error", e);
      setReactionLoading(false);
      Alert.alert("GIF error", "We couldn't load a GIF right now.");
    }
  };

  // when the user taps a GIF thumbnail .. shows overlay for 4.5s, then hide
  const onSelectGif = (url) => {
    if (!url) return;

    const reactingName = turn === "P1" ? p1Name : p2Name;

    setReactionOverlayBy(reactingName);
    setReactionOverlayUrl(url);
    setReactionOverlayVisible(true);

    setTimeout(() => {
      setReactionOverlayVisible(false);
      setReactionOverlayUrl(null);
      setReactionOverlayBy(null);
    }, 4500);

    // close modal + reset search
    setReactionPromptCell(null);
    setReactionQuery("");
    setGifResults([]);
  };

  // reset everything for a fresh match
  const onReset = () => {
    setBoard(Array(9).fill(null));
    setTurn("P1");
    setWinner(null);
    setEnded(false);
    setLastMoveUri(null);
    setLastMoveIndex(null);
    setEmojiReactions({});
    setReactionPromptCell(null);
    setReactionQuery("");
    setReactionLoading(false);
    setGifResults([]);
    setReactionOverlayUrl(null);
    setReactionOverlayVisible(false);
    setReactionOverlayBy(null);
  };

  // quick share action (system share sheet)
  const onShare = async () => {
    try {
      await Share.share({
        message: "Our Pic-Tac-Toe board — memories unlocked! #PicTacToe",
      });
    } catch (e) {
      Alert.alert("Share error", String(e));
    }
  };

  // dedicated share for the winner popup
  const onShareVictory = async () => {
    if (!winner) return;

    const msg =
      winner === "Draw"
        ? `We just drew in Pic-Tac-Toe! #PicTacToe`
        : `${labelFor(
            winner
          )} just won a Pic-Tac-Toe match on Pic-Tac-Toe! 🏆`;

    try {
      await Share.share({ message: msg });
    } catch (e) {
      Alert.alert("Share error", String(e));
    }
  };

  // status line under the title... shows turn or winner/draw
  const statusText = useMemo(() => {
    if (winner === "Draw") return "It’s a draw!";
    if (winner) return `${labelFor(winner)} wins!`;
    return `${labelFor(turn)}’s turn`;
  }, [winner, turn, p1Name, p2Name]);

  // dynamic colors per turn (background swaps red/blue)
  const isP1Turn = turn === "P1";
  const bgColor = isP1Turn ? BG : ACCENT; // red for P1, blue for P2
  const accentColor = isP1Turn ? ACCENT : BG; // blue for P1, red for P2

  return (
    <View
      style={[
        styles.container,
        turn === "P1" ? styles.bgP1 : styles.bgP2,
        { backgroundColor: bgColor },
      ]}
    >
      <Text style={styles.title}>PIC-TAC-TOE</Text>
      <Text style={[styles.subtitle, { color: accentColor }]}>
        {statusText}
      </Text>

      {/* one-time hint bubble, pointing to the bottom reaction bar */}
      {showHint && (
        <Modal
          visible
          transparent
          animationType="fade"
          onRequestClose={dismissHint}
        >
          <View style={styles.hintOverlay}>
            <Animatable.View
              animation="zoomIn"
              duration={220}
              style={styles.hintCard}
            >
              <Text style={styles.hintTitle}>React to each move ✨</Text>
              <Text style={styles.hintBody}>
                Use the bar at the bottom to send{" "}
                <Text style={styles.inlineBold}>emoji</Text> or{" "}
                <Text style={styles.inlineBold}>GIF</Text> reactions for the
                latest photo.
              </Text>
              <TouchableOpacity
                onPress={dismissHint}
                style={styles.hintBtn}
              >
                <Text style={styles.hintBtnText}>Got it</Text>
              </TouchableOpacity>
            </Animatable.View>
          </View>
        </Modal>
      )}

      {/* small chips to show whose turn it is... now with avatars above */}
      <View style={styles.pillsRow}>
        <View style={styles.playerCol}>
          {/* P1 avatar = your real profile photo if set, otherwise placeholder */}
          <View style={styles.p1AvatarCircle}>
            <Image
              source={
                meAvatarUri
                  ? { uri: meAvatarUri }
                  : require("../../assets/placeholderProfile.png")
              }
              style={styles.p1AvatarImage}
            />
          </View>
          <View
            style={[
              styles.pill,
              turn === "P1" && styles.pillActive,
              turn === "P1" && { backgroundColor: accentColor },
            ]}
          >
            <Text style={styles.pillText}>{p1Name}</Text>
          </View>
        </View>

        <View style={styles.playerCol}>
          {/* P2 stays with simple icon-in-circle */}
          <View style={styles.playerAvatarCircle}>
            <Image
              source={require("../../assets/placeholderProfile.png")}
              style={styles.playerAvatarImage}
            />
          </View>
          <View
            style={[
              styles.pill,
              turn === "P2" && styles.pillActive,
              turn === "P2" && { backgroundColor: accentColor },
            ]}
          >
            <Text style={styles.pillText}>{p2Name}</Text>
          </View>
        </View>
      </View>

      {/* 3x3 grid... tap a cell to drop a photo */}
      <View style={styles.grid}>
        {Array.from({ length: 9 }).map((_, i) => {
          const cell = board[i];
          return (
            <Pressable
              key={i}
              style={styles.cell}
              onPress={() => onPickImage(i)}
            >
              {/* if cell has a photo... show it... else show a big plus */}
              {cell?.uri ? (
                <Image source={{ uri: cell.uri }} style={styles.photo} />
              ) : (
                <Text style={styles.plus}>+</Text>
              )}

              {/* tiny corner badge to show O/X */}
              {cell?.player && (
                <View
                  style={[
                    styles.badge,
                    cell.player === "P1"
                      ? styles.badgeO
                      : styles.badgeX,
                  ]}
                >
                  <Text
                    style={[
                      styles.badgeGlyph,
                      cell.player === "P1"
                        ? styles.badgeTextO
                        : styles.badgeTextX,
                    ]}
                  >
                    {cell.player === "P1" ? "O" : "X"}
                  </Text>
                </View>
              )}

              {/* floating emoji layer – bursts animate up and then disappear */}
              <View pointerEvents="none" style={styles.emojiLayer}>
                {(emojiReactions[i] || []).map((r) => (
                  <Animatable.Text
                    key={r.id}
                    animation={{
                      0: {
                        opacity: 0,
                        transform: [
                          { translateY: 10 },
                          { scale: 0.6 },
                        ],
                      },
                      0.2: {
                        opacity: 1,
                        transform: [
                          { translateY: 0 },
                          { scale: 1.0 },
                        ],
                      },
                      1: {
                        opacity: 0,
                        transform: [
                          { translateY: -30 },
                          { scale: 1.2 },
                        ],
                      },
                    }}
                    duration={900}
                    easing="ease-out"
                    style={[
                      styles.emojiBurst,
                      { left: 10 + Math.random() * 40 },
                    ]}
                    useNativeDriver
                    onAnimationEnd={() => {
                      setEmojiReactions((prev) => {
                        const list = prev[i] || [];
                        return {
                          ...prev,
                          [i]: list.filter((x) => x.id !== r.id),
                        };
                      });
                    }}
                  >
                    {r.emoji}
                  </Animatable.Text>
                ))}
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* bottom row actions: reset, share board, open history */}
      <View style={styles.actions}>
        <Button title="Reset" onPress={onReset} color="#fff" />
        <View style={styles.actionsSpacer} />
        <Button title="Share board" onPress={onShare} color="#fff" />
        <View style={styles.actionsSpacer} />
        <Button
          title="History"
          onPress={() => navigation.navigate("MatchHistory", { p2Name })}
          color="#fff"
        />
      </View>

      {/* spacer to push reaction bar to the bottom */}
      <View style={styles.flexSpacer} />

      {/* permanent reaction bar similar to Locket / BeReal – emojis + GIF entry */}
      <View style={styles.reactionBar}>
        <TouchableOpacity
          style={styles.reactionInputFake}
          onPress={openGifPrompt}
        >
          <Text style={styles.reactionPlaceholder}>Send reaction...</Text>
        </TouchableOpacity>
        <View style={styles.reactionQuickRow}>
          {["💅", "🙄", "😭"].map((e) => (
            <Text
              key={e}
              style={styles.quickEmoji}
              onPress={() => addEmojiReaction(e)}
            >
              {e}
            </Text>
          ))}
          <TouchableOpacity onPress={openGifPrompt} style={styles.gifChip}>
            <Text style={styles.gifChipText}>+ GIF</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* winner overlay... dims the screen and shows the last photo + actions */}
      <Modal visible={!!winner} transparent animationType="fade">
        <View style={styles.overlay}>
          <Animatable.View
            animation="zoomIn"
            duration={250}
            style={styles.card}
          >
            <Text style={styles.victoryLabel}>match complete</Text>

            <Text style={styles.victoryTitle}>
              {winner === "Draw"
                ? "It's a draw!"
                : `${labelFor(winner)} wins!`}
            </Text>

            {/* confetti when there is a winner (not draw) */}
            {winner && winner !== "Draw" && (
              <ConfettiCannon
                count={180}
                origin={{ x: 0, y: 0 }}
                explosionSpeed={400}
                fadeOut
              />
            )}

            {/* big preview of last move... if no photo found, show placeholder box */}
            {lastMoveUri ? (
              <Image
                source={{ uri: lastMoveUri }}
                style={styles.winnerPhoto}
              />
            ) : (
              <View
                style={[
                  styles.winnerPhoto,
                  styles.winnerPhotoPlaceholder,
                ]}
              >
                <Text style={styles.noPhotoText}>No photo</Text>
              </View>
            )}

            {/* actions row in the winner overlay */}
            <View style={styles.winnerActionsRow}>
              <TouchableOpacity
                style={styles.victorySecondaryBtn}
                onPress={onReset}
              >
                <Text style={styles.victorySecondaryText}>Play again</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.victorySecondaryBtn}
                onPress={() => {
                  onReset();
                  navigation.navigate("MatchHistory", { p2Name });
                }}
              >
                <Text style={styles.victorySecondaryText}>View history</Text>
              </TouchableOpacity>
            </View>

            {/* share victory pill */}
            <TouchableOpacity
              onPress={onShareVictory}
              style={styles.shareVictoryButton}
            >
              <Text style={styles.shareVictoryText}>Share victory</Text>
            </TouchableOpacity>
          </Animatable.View>
        </View>
      </Modal>

      {/* GIF reaction prompt popup (search + choose a GIF) */}
      <Modal
        visible={reactionPromptCell !== null}
        transparent
        animationType="fade"
      >
        <View style={styles.reactionModalOverlay}>
          <View style={styles.reactionModalCard}>
            <Text style={styles.reactionTitle}>Send a GIF reaction?</Text>
            <Text style={styles.reactionBody}>
              Type how you feel and we’ll pull a few GIFs for the{" "}
              <Text style={styles.inlineBold}>latest move</Text>. Tap one
              to send it.
            </Text>

            <TextInput
              placeholder='Type "happy", "sassy", "crying"...'
              placeholderTextColor="#9CA3AF"
              value={reactionQuery}
              onChangeText={setReactionQuery}
              style={styles.reactionInput}
            />

            <View style={styles.reactionButtonsRow}>
              <TouchableOpacity
                onPress={onSkipReaction}
                style={styles.reactionSecondaryBtn}
                disabled={reactionLoading}
              >
                <Text style={styles.reactionSecondaryText}>Skip</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={onSendReaction}
                style={styles.reactionPrimaryBtn}
                disabled={reactionLoading}
              >
                <Text style={styles.reactionPrimaryText}>
                  {reactionLoading ? "Finding GIFs..." : "Search GIFs"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* GIF choices row */}
            {gifResults.length > 0 && (
              <View style={styles.gifResultsRow}>
                {gifResults.map((url) => (
                  <TouchableOpacity
                    key={url}
                    onPress={() => onSelectGif(url)}
                  >
                    <Image
                      source={{ uri: url }}
                      style={styles.gifResultThumb}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* big GIF pop-up that appears for ~4.5s and animates away */}
      {reactionOverlayVisible && reactionOverlayUrl && (
        <View style={styles.gifOverlay}>
          {reactionOverlayBy && (
            <Animatable.View
              animation="fadeInDown"
              duration={300}
              style={styles.gifReactionBadge}
            >
              <Text style={styles.gifReactionBadgeText}>
                {reactionOverlayBy} sent a reaction
              </Text>
            </Animatable.View>
          )}

          <Animatable.Image
            source={{ uri: reactionOverlayUrl }}
            style={styles.gifImage}
            animation="zoomIn"
            duration={250}
          />
        </View>
      )}
    </View>
  );
}

const CELL = 100;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
    paddingTop: 24,
    alignItems: "center",
  },

  // background variants per turn
  bgP1: {
    backgroundColor: BG,
  },
  bgP2: {
    backgroundColor: ACCENT,
  },

  title: {
    color: "#fff",
    fontSize: 32,
    fontFamily: "SourGummy_600SemiBold",
    marginBottom: 6,
  },
  subtitle: {
    color: ACCENT,
    fontSize: 16,
    fontFamily: "SourGummy_400Regular",
    marginBottom: 10,
  },

  inlineBold: {
    fontWeight: "800",
  },

  // turn pills
  pillsRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 10,
  },

  // column for each player (avatar + pill)
  playerCol: {
    alignItems: "center",
    gap: 4,
  },

  // P1 avatar = full image inside circle
  p1AvatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#fff",
    backgroundColor: "#000",
  },
  p1AvatarImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },

  // P2 avatar (kept as simple icon-in-circle)
  playerAvatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  playerAvatarImage: {
    width: 26,
    height: 26,
    resizeMode: "contain",
  },

  pill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  pillActive: {
    backgroundColor: ACCENT,
  },
  pillText: {
    color: "#0F2D3D",
    fontWeight: "800",
  },

  // grid layout
  grid: {
    width: CELL * 3 + 16 * 2,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    justifyContent: "center",
  },
  cell: {
    width: CELL,
    height: CELL,
    backgroundColor: "#fff",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    position: "relative",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 3,
  },
  plus: {
    fontSize: 48,
    color: "#bbb",
    fontWeight: "600",
  },
  photo: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },

  // emoji layer + burst
  emojiLayer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  emojiBurst: {
    position: "absolute",
    bottom: 10,
    fontSize: 22,
  },

  // O/X badges
  badge: {
    position: "absolute",
    bottom: 6,
    right: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgeO: {
    backgroundColor: ACCENT,
  },
  badgeX: {
    backgroundColor: BG,
  },
  badgeGlyph: {
    fontWeight: "900",
    fontSize: 20,
  },
  badgeTextO: {
    color: BG,
  },
  badgeTextX: {
    color: ACCENT,
  },

  // bottom action row
  actions: {
    flexDirection: "row",
    marginTop: 14,
  },
  actionsSpacer: {
    width: 12,
  },

  flexSpacer: {
    flex: 1,
  },

  // winner overlay
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 24,
    paddingVertical: 20,
    paddingHorizontal: 18,
    width: 340,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 18,
    elevation: 8,
    borderWidth: 2,
    borderColor: ACCENT,
  },
  victoryLabel: {
    fontSize: 13,
    textTransform: "uppercase",
    letterSpacing: 1,
    color: ACCENT,
    marginBottom: 4,
    fontFamily: "SourGummy_400Regular",
  },
  victoryTitle: {
    fontSize: 22,
    marginBottom: 12,
    color: "#0F2D3D",
    fontFamily: "SourGummy_600SemiBold",
    textAlign: "center",
  },
  winnerPhoto: {
    width: 230,
    height: 230,
    borderRadius: 20,
    backgroundColor: "#ddd",
    marginBottom: 16,
  },
  winnerPhotoPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  noPhotoText: {
    color: "#999",
  },
  winnerActionsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
    marginBottom: 10,
  },
  victorySecondaryBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: ACCENT,
    backgroundColor: "#fff",
  },
  victorySecondaryText: {
    color: "#0F2D3D",
    fontFamily: "SourGummy_600SemiBold",
    fontSize: 14,
  },
  shareVictoryButton: {
    marginTop: 4,
    alignSelf: "stretch",
    backgroundColor: BG,
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  shareVictoryText: {
    color: "#fff",
    fontFamily: "SourGummy_600SemiBold",
    fontSize: 16,
  },

  // permanent reaction bar (white, bottom)
  reactionBar: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "stretch",
    backgroundColor: "#FFFFFF",
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 20,
    marginBottom: 30,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
  },
  reactionInputFake: {
    flex: 1,
    paddingVertical: 6,
  },
  reactionPlaceholder: {
    color: "#9CA3AF",
    fontFamily: "SourGummy_400Regular",
  },
  reactionQuickRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  quickEmoji: {
    fontSize: 20,
    marginHorizontal: 2,
  },
  gifChip: {
    marginLeft: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: ACCENT,
  },
  gifChipText: {
    color: BG,
    fontWeight: "800",
    fontSize: 12,
  },

  // GIF prompt modal
  reactionModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  reactionModalCard: {
    width: 320,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
  },
  reactionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F2D3D",
    marginBottom: 6,
  },
  reactionBody: {
    fontSize: 13,
    color: "#374151",
    marginBottom: 8,
  },
  reactionInput: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: "#111827",
    marginBottom: 10,
  },
  reactionButtonsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    marginBottom: 10,
  },
  reactionSecondaryBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  reactionSecondaryText: {
    color: "#6B7280",
    fontSize: 13,
  },
  reactionPrimaryBtn: {
    backgroundColor: ACCENT,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 999,
  },
  reactionPrimaryText: {
    color: BG,
    fontWeight: "800",
    fontSize: 13,
  },

  gifResultsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
    marginTop: 6,
  },
  gifResultThumb: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },

  // big GIF overlay
  gifOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 90,
    alignItems: "center",
    justifyContent: "center",
    pointerEvents: "none",
  },
  gifImage: {
    width: 220,
    height: 220,
    borderRadius: 24,
  },
  gifReactionBadge: {
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    marginBottom: 12,
  },
  gifReactionBadgeText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },

  // one-time hint modal
  hintOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  hintCard: {
    width: 320,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    alignItems: "center",
  },
  hintTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F2D3D",
    marginBottom: 6,
  },
  hintBody: {
    textAlign: "center",
    color: "#333",
  },
  hintBtn: {
    marginTop: 12,
    backgroundColor: ACCENT,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
  },
  hintBtnText: {
    color: BG,
    fontWeight: "800",
  },
});

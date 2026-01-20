// Find Friends screen – this is where the user picks who they want to play with.
// pulls real contacts from the device (if permission is granted) or falls back to a mock list.
// after they pick a friend, we pass both names into the Game screen.

import { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, SafeAreaView, Alert, ActivityIndicator, Image, } from "react-native";
import * as Contacts from "expo-contacts";
import { loadUserPrefs } from "../utils/storage";

const BG = "#DD3A43";
const ACCENT = "#B3E5FC";

//created mock contacts for demo..
const MOCK_CONTACTS = [
  { id: "1", name: "Hind H.", handle: "@hind" },
  { id: "2", name: "Davina P.", handle: "@davina" },
  { id: "3", name: "Sindokht A.", handle: "@sindokht" },
];

export default function FindFriendsScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [granted, setGranted] = useState(null);   // remember if contacts permission was granted
  const [data, setData] = useState(MOCK_CONTACTS); // list of contacts shown in the UI
  const [selected, setSelected] = useState(null);  // the friend user tapped on

  const [meName, setMeName] = useState("You");     // player 1 name from profile prefs

  // load my saved nickname so I can pass it into the Game screen as p1Name
  useEffect(() => {
    (async () => {
      try {
        const prefs = await loadUserPrefs();
        if (prefs?.name?.trim()) setMeName(prefs.name.trim());
      } catch (e) {
        console.warn("Failed to load user prefs", e);
      }
    })();
  }, []);

  // ask for contacts permission and then fetch the list
  const askPermission = async () => {
    setLoading(true);
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      const ok = status === "granted";
      setGranted(ok);

      if (ok) {
        const { data: contacts } = await Contacts.getContactsAsync({
          fields: [
            Contacts.Fields.Name,
            Contacts.Fields.Emails,
            Contacts.Fields.PhoneNumbers,
          ],
          pageSize: 50,
        });

        // map raw contacts into a simple array the FlatList can use
        const mapped = (contacts || [])
          .filter((c) => c?.name)
          .slice(0, 10)
          .map((c, i) => ({
            id: String(i),
            name: c.name,
            handle:
              c?.emails?.[0]?.email ||
              c?.phoneNumbers?.[0]?.number ||
              "",
          }));

        // if we somehow got an empty list, fall back to mock contacts
        setData(mapped.length ? mapped : MOCK_CONTACTS);
      } else {
        Alert.alert("Access denied", "Showing a demo list instead");
        setData(MOCK_CONTACTS);
      }
    } catch (e) {
      Alert.alert("Contacts error", String(e));
      setData(MOCK_CONTACTS);
    } finally {
      setLoading(false);
    }
  };

  // when user taps "Start game" with a selected friend
  const onStartGame = () => {
    if (!selected) return;
    const friendName = selected.name || "Friend";
    navigation.navigate("Game", {
      p1Name: meName || "You",
      p2Name: friendName,
    });
  };

  // how each contact card looks inside the list
  const renderItem = ({ item }) => {
    const isSelected = selected?.id === item.id;
    return (
      <TouchableOpacity
        style={[styles.card, isSelected && styles.cardSelected]}
        onPress={() => setSelected(item)}
        activeOpacity={0.8}
      >
        {/* avatar placeholder in mini circle */}
        <View style={styles.avatarCircle}>
          <Image
            source={require("../../assets/placeholderProfile.png")}
            style={styles.avatarImage}
          />
        </View>

        {/* name + handle (could be email or phone) */}
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{item.name}</Text>
          {!!item.handle && <Text style={styles.handle}>{item.handle}</Text>}
        </View>

        {/* small badge to show which friend is currently selected */}
        {isSelected && <Text style={styles.selectedBadge}>Selected</Text>}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BG }}>
      <View style={styles.container}>
        <Text style={styles.title}>Invite friends</Text>
        <Text style={styles.subtitle}>
          Select a contact to start a Pic-Tac-Toe match.
        </Text>

        {/* button to request / reload contacts from the device */}
        <TouchableOpacity
          style={[styles.cta, loading && { opacity: 0.7 }]}
          onPress={askPermission}
          disabled={loading}
        >
          <Text style={styles.ctaText}>
            {granted ? "Reload contacts" : "Allow contact access"}
          </Text>
        </TouchableOpacity>

        {/* if loading, show spinner; otherwise show the list */}
        {loading ? (
          <ActivityIndicator
            size="large"
            color="#fff"
            style={{ marginTop: 8 }}
          />
        ) : (
          <FlatList
            data={data}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={{ paddingVertical: 12 }}
          />
        )}

        {/* only show "Start game" button after a friend is selected */}
        {selected && (
          <TouchableOpacity style={styles.startCta} onPress={onStartGame}>
            <Text style={styles.startCtaText}>
              Start game with {selected.name} →
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
    paddingTop: 24,
    paddingHorizontal: 20,
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
    marginBottom: 16,
  },

  cta: {
    backgroundColor: ACCENT,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 12,
    elevation: 6,
  },
  ctaText: {
    color: BG,
    fontSize: 16,
    fontWeight: "800",
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 3,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  cardSelected: { borderWidth: 2, borderColor: ACCENT },

  // mini avatar 
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: ACCENT,
  },
  avatarImage: {
    width: 28,
    height: 28,
    resizeMode: "contain",
  },

  name: {
    fontSize: 18,
    fontWeight: "700",
    color: "#DD3A43"
  },
  handle: {
    color: "#666",
    marginTop: 2,
    marginBottom: 2
  },

  selectedBadge: {
    color: "#DD3A43",
    fontWeight: "800",
    backgroundColor: ACCENT,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },

  startCta: {
    backgroundColor: "#B3E5FC",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignSelf: "center",
    marginTop: 6,
    marginBottom: 10,
    shadowColor: "#B3E5FC",
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
  },
  startCtaText: {
    color: "#DD3A43",
    fontWeight: "800",
    fontSize: 16
  },
});

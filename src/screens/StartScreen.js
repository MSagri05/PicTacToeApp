// start screen of the app... first thing the user sees
// shows a quick gameplay preview, logo + tagline, and a CTA button to go set up their account

import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";

export default function StartScreen({ navigation }) {
  return (
    <View style={styles.container}>
      {/* preview image of the game so users instantly see what the app is about */}
      <Image
        source={require("../../assets/gameplay3.png")}
        style={styles.preview}
      />

      {/* logo + app name on one line */}
      <View style={styles.brandRow}>
        <Image
          source={require("../../assets/icon.png")}
          style={styles.brandIcon}
        />
        <Text style={styles.brandText}>PIC-TAC-TOE</Text>
      </View>

      {/* short tagline to explain the concept in one line */}
      <Text style={styles.subtitle}>
        Because memories are better when you play them!
      </Text>

      {/* main call-to-action – pushes user into onboarding / auth flow */}
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate("SignUp")}
      >
        <Text style={styles.buttonText}>Set up my account →</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#DD3A43",
  },

  // the gameplay image preview
  preview: {
    marginTop: 80,
    width: 300,
    height: 300,
    resizeMode: "contain",
    marginBottom: 10,
  },

  // logo and title together in one row
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    marginBottom: 10,
  },
  brandIcon: {
    width: 48,
    height: 48,
    borderRadius: 10,
    marginRight: 12,
  },
  brandText: {
    color: "#FFFFFF",
    fontSize: 44,
    fontFamily: "SourGummy_600SemiBold",
  },

  subtitle: {
    color: "#B3E5FC",
    fontSize: 20,
    fontFamily: "SourGummy_400Regular",
    fontWeight: "800",
    textAlign: "center",
    marginHorizontal: 30,
    marginBottom: 40,
  },

  button: {
    backgroundColor: "#B3E5FC",
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 25,
    shadowColor: "#B3E5FC",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    marginTop: 100,
  },
  buttonText: {
    color: "#DD3A43",
    fontWeight: "800",
    fontSize: 18,
    // same font family as the rest of the app is handled globally when  load SourGummy
  },
});

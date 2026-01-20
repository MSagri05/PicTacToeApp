// sign in screen.. if users already have an account, they log in here with email + password
// after login,  check if their profile is set up (nickname saved) and then navigate them either to FindFriends or ProfileSetup

import { useState } from "react";
import { View, Text, TextInput, StyleSheet, Alert, Pressable, KeyboardAvoidingView, Platform, Image, SafeAreaView, StatusBar, ScrollView, } from "react-native";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebaseConfig";
import { loadUserPrefs } from "../utils/storage";

export default function SignInScreen({ navigation }) {
  // local state... keep email + password + which input is focused
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [focus, setFocus] = useState(null); // "email" | "pwd" | null

  // main sign in flow... basic checks then Firebase Auth
  // after auth, I look at AsyncStorage to see if the user already finished profile setup
  const handleSignIn = async () => {
    if (!email.trim())
      return Alert.alert("Missing email", "Enter your email.");
    if (!pwd) return Alert.alert("Missing password", "Enter your password.");

    try {
      await signInWithEmailAndPassword(auth, email.trim(), pwd);

      // after auth: decide where to go based on saved profile prefs
      // if nickname exists -> straight to contacts screen, otherwise go finish ProfileSetup
      const prefs = await loadUserPrefs();
      if (prefs?.name?.trim()) {
        navigation.replace("FindFriends");
      } else {
        navigation.replace("ProfileSetup");
      }
    } catch (e) {
      Alert.alert("Sign in error", e.message || String(e));
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* brand row – keeps logo + app name consistent with signup screen */}
          <View style={styles.brandRow}>
            <Image
              source={require("../../assets/icon.png")}
              style={styles.brandIcon}
            />
            <Text style={styles.brandText}>PIC-TAC-TOE</Text>
          </View>

          <Text style={styles.title}>Sign in</Text>

          {/* form column – email + password inputs */}
          <View style={styles.formCol}>
            <TextInput
              style={[styles.input, focus === "email" && styles.inputFocus]}
              placeholder="Email"
              placeholderTextColor="#9CCFEA"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              onFocus={() => setFocus("email")}
              onBlur={() => setFocus(null)}
            />
            <TextInput
              style={[styles.input, focus === "pwd" && styles.inputFocus]}
              placeholder="Password"
              placeholderTextColor="#9CCFEA"
              secureTextEntry
              value={pwd}
              onChangeText={setPwd}
              onFocus={() => setFocus("pwd")}
              onBlur={() => setFocus(null)}
            />
          </View>
        </ScrollView>

        {/* sticky bottom actions – main sign in button + link to create account */}
        <View style={styles.bottomContainer}>
          <Pressable
            onPress={handleSignIn}
            style={({ pressed }) => [
              styles.button,
              pressed && { transform: [{ scale: 0.98 }], opacity: 0.95 },
            ]}
          >
            <Text style={styles.buttonText}>Sign in →</Text>
          </Pressable>

          <Pressable
            onPress={() => navigation.navigate("SignUp")}
            style={{ marginTop: 10 }}
          >
            <Text style={styles.link}>
              New here? <Text style={styles.linkBold}>Create an account</Text>
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const ACCENT = "#B3E5FC";
const BG = "#DD3A43";

const styles = StyleSheet.create({
  // layout + colors match signup so both screens feel cohesive
  safe: {
    flex: 1,
    backgroundColor: BG,
  },
  container: {
    flex: 1,
    backgroundColor: BG,
  },

  // spacing for top area... keeps things comfy on all phones
  scroll: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },

  // logo + app name inline
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  brandIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    marginRight: 8,
  },
  brandText: {
    color: "#FFFFFF",
    fontSize: 22,
    fontFamily: "SourGummy_600SemiBold",
  },

  // big title vibe
  title: {
    marginTop: 60,
    color: "#FFFFFF",
    fontFamily: "SourGummy_600SemiBold",
    fontSize: 40,
    textAlign: "center",
    marginBottom: 20,
  },

  // centered column... fixed max width keeps it neat
  formCol: {
    width: "100%",
    maxWidth: 360,
    alignSelf: "center",
    gap: 14,
  },

  // inputs... soft shadow + rounded to match brand
  input: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 28,
    fontSize: 17,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 2,
    borderColor: "transparent",
  },
  inputFocus: {
    borderColor: ACCENT,
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },

  // bottom area... main cta + subtle link
  bottomContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    alignItems: "center",
  },
  button: {
    backgroundColor: ACCENT,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 25,
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    marginTop: 100,
  },
  buttonText: {
    color: BG,
    fontSize: 18,
    fontWeight: "800",
  },

  // link to sign up
  link: {
    color: ACCENT,
    fontSize: 18,
    fontFamily: "SourGummy_400Regular",
    textAlign: "center",
  },
  linkBold: {
    fontFamily: "SourGummy_600SemiBold",
    fontSize: 20,
  },
});

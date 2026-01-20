// signup screen... users create their account here using email + password
// after creating an account, we navigate them to Profile Setup so they can add nickname + avatar

import { useState } from "react";
import { View, Text, TextInput, StyleSheet, Alert, Pressable, KeyboardAvoidingView, Platform, Image, StatusBar, ScrollView, } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebaseConfig";

export default function SignUpScreen({ navigation }) {
  // local state for email + password fields
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const [focus, setFocus] = useState(null); // track which input is active so I can highlight it

  // main signup function... basic validation then create user in Firebase Auth
  const handleSignUp = async () => {
    if (!email.trim())
      return Alert.alert("Missing email", "Enter your email.");
    if (pwd.length < 6)
      return Alert.alert("Weak password", "Password must be 6+ characters.");
    if (pwd !== confirm)
      return Alert.alert("Password mismatch", "Both passwords must match.");

    try {
      await createUserWithEmailAndPassword(auth, email.trim(), pwd);
      // go straight to Profile Setup after account creation
      navigation.replace("ProfileSetup");
    } catch (e) {
      Alert.alert("Sign up error", e.message || String(e));
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
          {/* logo + app name at the top to keep branding consistent */}
          <View style={styles.brandRow}>
            <Image
              source={require("../../assets/icon.png")}
              style={styles.brandIcon}
            />
            <Text style={styles.brandText}>PIC-TAC-TOE</Text>
          </View>

          <Text style={styles.title}>Sign up</Text>

          {/* form section... user types email + password info here */}
          <View style={styles.formCol}>
            {/* email input... highlights when focused */}
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

            {/* password input */}
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

            {/* confirm password... makes sure both match */}
            <TextInput
              style={[styles.input, focus === "confirm" && styles.inputFocus]}
              placeholder="Confirm password"
              placeholderTextColor="#9CCFEA"
              secureTextEntry
              value={confirm}
              onChangeText={setConfirm}
              onFocus={() => setFocus("confirm")}
              onBlur={() => setFocus(null)}
            />
          </View>
        </ScrollView>

        {/* bottom buttons... create account + link to sign in */}
        <View style={styles.bottomContainer}>
          <Pressable
            onPress={handleSignUp}
            style={({ pressed }) => [
              styles.button,
              pressed && {
                transform: [{ scale: 0.98 }],
                opacity: 0.95,
              },
            ]}
          >
            <Text style={styles.buttonText}>Create account →</Text>
          </Pressable>

          {/* link... if user already has account they can jump to sign in */}
          <Pressable
            onPress={() => navigation.navigate("SignIn")}
            style={{ marginTop: 10 }}
          >
            <Text style={styles.link}>
              Already have an account?{" "}
              <Text style={styles.linkBold}>Sign in</Text>
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
  safe: {
    flex: 1,
    backgroundColor: BG,
  },
  container: {
    flex: 1,
    backgroundColor: BG,
  },

  scroll: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },

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

  title: {
    marginTop: 60,
    color: "#FFFFFF",
    fontFamily: "SourGummy_600SemiBold",
    fontSize: 40,
    textAlign: "center",
    marginBottom: 20,
  },

  // constrained column for harmony across devices
  formCol: {
    width: "100%",
    maxWidth: 360,
    alignSelf: "center",
    gap: 14,
  },

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

  bottomContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    alignItems: "center",
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
    color: BG,
    fontSize: 18,
    fontWeight: "800",
  },

  // link to sign in
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

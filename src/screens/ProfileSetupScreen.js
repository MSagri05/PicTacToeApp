// quick profile setup screen – user picks nickname + optional fave color + avatar photo
// we save this locally with AsyncStorage so their info stays even after app restarts
// once saved, user moves straight into the Find Friends flow

import { useEffect, useState } from "react";
import {View,Text,TextInput,StyleSheet,TouchableOpacity,Image,Alert,SafeAreaView,} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { saveUserPrefs, loadUserPrefs } from "../utils/storage";

const BG = "#DD3A43";
const ACCENT = "#B3E5FC";

const AVATAR_SIZE = 115;
const AVATAR_RADIUS = AVATAR_SIZE / 2;
const AVATAR_IMAGE_SIZE = 90; // slightly smaller so it doesn't get cut off

export default function ProfileSetupScreen({ navigation }) {
  // local state for nickname, fav color, and avatar uri
  const [nickname, setNickname] = useState("");
  const [color, setColor] = useState(""); // optional field
  const [avatarUri, setAvatarUri] = useState(null);

  // preload saved prefs (if returning user comes back to this screen)
  useEffect(() => {
    (async () => {
      const prefs = await loadUserPrefs();
      if (prefs) {
        setNickname(prefs.name || "");
        setColor(prefs.color || "");
        setAvatarUri(prefs.avatarUri || null);
      }
    })();
  }, []);

  // pick an avatar from the gallery
  const pickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission needed",
        "Photo access is required to select an avatar."
      );
      return;
    }

    const res = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],      // keep avatar square
      quality: 0.9,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });

    if (!res.canceled) setAvatarUri(res.assets?.[0]?.uri || null);
  };

  // take a photo with camera for avatar
  const pickFromCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission needed",
        "Camera access is required to take a profile photo."
      );
      return;
    }

    const res = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
    });

    if (!res.canceled) setAvatarUri(res.assets?.[0]?.uri || null);
  };

  // small action sheet to choose between camera vs gallery
  const openAvatarOptions = () => {
    Alert.alert("Profile photo", "Choose a photo source", [
      { text: "Take photo", onPress: pickFromCamera },
      { text: "Choose from gallery", onPress: pickFromGallery },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  // save nickname + color + avatar locally then move on
  const onContinue = async () => {
    const name = nickname.trim();
    if (!name) {
      Alert.alert("Nickname required", "Please enter a nickname to continue.");
      return;
    }

    await saveUserPrefs(name, color.trim(), avatarUri || null);
    navigation.replace("FindFriends"); // next screen in the flow
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>

        {/* header section */}
        <View style={styles.header}>
          <Text style={styles.title}>Profile setup</Text>
          <Text style={styles.subtitle}>
            Set your nickname and profile photo before inviting friends.
          </Text>
        </View>

        {/* avatar – user taps this to change their photo */}
        <View style={styles.avatarSection}>
          <TouchableOpacity
            style={styles.avatarWrap}
            onPress={openAvatarOptions}
            activeOpacity={0.85}
          >
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarFull} />
            ) : (
              <Image
                source={require("../../assets/placeholderProfile.png")}
                style={styles.avatarPlaceholder}
              />
            )}

            {/* plus badge to show it's editable */}
            <View style={styles.avatarPlusBadge}>
              <Text style={styles.avatarPlusText}>+</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* nickname – required */}
        <Text style={styles.label}>Enter your nickname</Text>
        <TextInput
          placeholder="Enter your nickname"
          placeholderTextColor="#888"
          value={nickname}
          onChangeText={setNickname}
          style={styles.input}
        />

        {/* optional color */}
        <Text style={styles.label}>Favorite color (optional)</Text>
        <TextInput
          placeholder="#DD3A43 or blue, etc."
          placeholderTextColor="#888"
          value={color}
          onChangeText={setColor}
          style={styles.input}
        />

        {/* continue button */}
        <TouchableOpacity style={styles.cta} onPress={onContinue}>
          <Text style={styles.ctaText}>Continue →</Text>
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // keep bg consistent with the rest of the app
  safe: {
    flex: 1,
    backgroundColor: BG,
  },

  container: {
    flex: 1,
    paddingTop: 24,
    paddingHorizontal: 20,
  },

  // centered heading block
  header: {
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    color: "#fff",
    fontSize: 32,
    fontFamily: "SourGummy_600SemiBold",
    marginBottom: 6,
    textAlign: "center",
  },
  subtitle: {
    color: ACCENT,
    fontSize: 16,
    fontFamily: "SourGummy_400Regular",
    marginBottom: 12,
    textAlign: "center",
  },

  // avatar section
  avatarSection: {
    alignItems: "center",
    marginBottom: 20,
  },
  avatarWrap: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_RADIUS,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 10,
    elevation: 5,
  },

  avatarFull: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_RADIUS,
    resizeMode: "cover",
  },
  avatarPlaceholder: {
    width: AVATAR_IMAGE_SIZE,
    height: AVATAR_IMAGE_SIZE,
    resizeMode: "contain",
  },

  avatarPlusBadge: {
    position: "absolute",
    bottom: 4,
    right: 4,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: ACCENT,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 4,
  },
  avatarPlusText: {
    color: BG,
    fontWeight: "800",
    fontSize: 18,
    lineHeight: 18,
  },

  // labels + inputs
  label: {
    color: "#fff",
    marginTop: 4,
    marginBottom: 6,
    fontFamily: "SourGummy_600SemiBold",
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: "#222",
    marginBottom: 8,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 3,
  },

  // big continue button
  cta: {
    backgroundColor: ACCENT,
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 18,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 12,
    elevation: 6,
  },
  ctaText: {
    color: BG,
    fontSize: 16,
    fontWeight: 800,
  },
});

import { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

// Firebase (kept only to initialize your app/auth context)
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./src/firebaseConfig";

// Screens
import StartScreen from "./src/screens/StartScreen";
import SignUpScreen from "./src/screens/SignUpScreen";
import SignInScreen from "./src/screens/SignInScreen";
import FindFriendsScreen from "./src/screens/FindFriendsScreen";
import GameScreen from "./src/screens/GameScreen";
import NotesScreen from "./src/screens/NotesScreen";
import MatchHistoryScreen from "./src/screens/MatchHistoryScreen";
import ProfileSetupScreen from "./src/screens/ProfileSetupScreen";

// Fonts
import { useFonts, SourGummy_400Regular, SourGummy_600SemiBold } from "@expo-google-fonts/sour-gummy";

const Stack = createNativeStackNavigator();

export default function App() {
  const [fontsLoaded] = useFonts({
    SourGummy_400Regular,
    SourGummy_600SemiBold,
  });

  useEffect(() => {
    
    const unsub = onAuthStateChanged(auth, () => { });
    return unsub;
  }, []);

  if (!fontsLoaded) return null;

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Start">
        <Stack.Screen
          name="Start"
          component={StartScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="SignUp"
          component={SignUpScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="SignIn"
          component={SignInScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ProfileSetup"
          component={ProfileSetupScreen}
          options={{ title: "Profile Setup" }}
        />

        <Stack.Screen
          name="FindFriends"
          component={FindFriendsScreen}
          options={{ title: "Find friends" }}
        />
        <Stack.Screen
          name="Game"
          component={GameScreen}
          options={{ title: "Game" }}
        />
        <Stack.Screen name="MatchHistory" component={MatchHistoryScreen} options={{ title: "Match History" }} />

      </Stack.Navigator>
    </NavigationContainer>
  );
}

# Pic-Tac-Toe 📸❌⭕️

Pic-Tac-Toe is a photo-based mobile game that reimagines classic Tic-Tac-Toe as a playful, social experience.  
Instead of using X’s and O’s, players take real-time photos to make their moves, turning each game into a shared memory.

Inspired by apps like BeReal and the Locket widget, Pic-Tac-Toe encourages spontaneous interaction, creativity, and connection between friends through lightweight, asynchronous gameplay.

## 👥 Team

- **Manmeet Sagri**
- **Hind Hammad**
---

## 🎯 What Is Pic-Tac-Toe?

Pic-Tac-Toe transforms a familiar game into a social storytelling tool.

- Each move is a **real photo**
- Every board becomes a **collection of moments**
- Gameplay feels casual, personal, and expressive rather than competitive

The app is designed for friends who want to stay connected without the pressure of constant messaging or long conversations.

---

## ✨ Key Features

### 📷 Photo-Based Gameplay
- Players tap a tile to take a real-time photo or choose one from their gallery
- Photos replace traditional X’s and O’s
- Each game board becomes a visual memory of the match

### 🔐 User Authentication (Firebase)
- Email sign-up and sign-in using Firebase Authentication
- Automatic session persistence
- Secure user state management

### 👤 Profile Setup
- Users choose a nickname, profile photo, and optional favorite color
- Profile data is saved locally and used across screens

### 📱 Native Device Features
- Camera access using Expo Image Picker
- Contacts access to find and invite friends
- Permission handling with fallback demo data if access is denied

### 🎉 Social Reactions (GIPHY)
- Players can send GIF reactions during gameplay
- Reactions appear directly in the game, adding humor and personality

### 🗂 Match History (SQLite)
- Game results are stored locally using SQLite
- Stores winner name, total moves, and board data
- Match history persists between app sessions

### 🎨 Custom UI & Branding
- Bright, playful color palette
- Hand-designed logo
- Consistent visual language across all screens

---

## 🧠 App Flow

1. Start Screen  
2. Sign Up / Sign In  
3. Profile Setup  
4. Find Friends  
5. Game Screen  
6. Match History  

Navigation is handled using React Navigation with smooth transitions between screens.

---

## 🛠 Tech Stack

- React Native (Expo)
- Firebase Authentication
- SQLite
- AsyncStorage
- GIPHY API
- Expo Image Picker
- Expo Contacts
- React Navigation

---

## 🚀 Running the App Locally

### Prerequisites
Before running the app, make sure you have:

- Node.js installed
- npm installed
- Expo Go app on your phone **or** an iOS / Android simulator installed
- Xcode (for iOS simulator) or Android Studio (for Android emulator)

---

### Installation & Setup

1. Download this repository as a **ZIP file** from GitHub  
2. Unzip the folder on your computer  
3. Open the folder in your **terminal / command prompt**

In command promt/ terminal run: npm install, then Start the Expo development server: npx expo start

Then:
- Scan the QR code using the **Expo Go** app on your phone  
- **OR** run the app on an iOS / Android simulator if you have one installed  

---

## 🎓 Academic Context

This project was developed as part of:

**IAT 359 – Mobile Computing (Fall 2025)**  
**Simon Fraser University**

The project explores mobile development concepts including:
- Native device features
- Local and structured data storage
- Authentication flows
- API integration
- UI and interaction design for mobile platforms

---

## 👥 Team

- **Manmeet Sagri**
- **Hind Hammad**

---

## 🔮 Future Improvements

- Push notifications for turn reminders  
- Online multiplayer syncing  
- Animated transitions and micro-interactions  
- Expanded social sharing features  

---

## 🔗 Project Slides & Demo

Feel free to check out the full project slides and visuals on my LinkedIn post:  
https://www.linkedin.com/posts/manmeet-sagri-5616271a7_hello-linkedin-being-part-of-siat-at-activity-7414742593969860610-vrNC

---

## 💬 Why Pic-Tac-Toe?

Pic-Tac-Toe explores how simple games can become meaningful social tools.  
By blending gameplay with real-time photos and reactions, the app turns everyday moments into playful, shared experiences.




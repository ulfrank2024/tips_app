import React, { useEffect, useRef, useState } from 'react';
import { View, Image, StyleSheet, Animated, Easing } from 'react-native';
import { useNavigation } from '@react-navigation/native'; // To get navigation prop

const SplashScreen = () => {
  const navigation = useNavigation();
  const scaleAnim = useRef(new Animated.Value(0.7)).current; // Initial scale for animation

  // Placeholder for checking login status
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Set to true for testing logged in user

  useEffect(() => {
    // Start animation
    Animated.timing(scaleAnim, {
      toValue: 1, // Scale up to normal size
      duration: 1500, // Animation duration
      easing: Easing.elastic(1), // A nice bouncy effect
      useNativeDriver: true,
    }).start();

    // Redirect after 2 seconds
    const timer = setTimeout(() => {
      // In a real app, you would check AsyncStorage or a global state for a token
      if (isLoggedIn) {
        navigation.replace('Dashboard'); // Replace to prevent going back to splash
      } else {
        navigation.replace('Login'); // Replace to prevent going back to splash
      }
    }, 2000); // 2 seconds delay

    return () => clearTimeout(timer); // Clear timeout if component unmounts
  }, [isLoggedIn, navigation, scaleAnim]);

  return (
      <View style={styles.container}>
          <Animated.Image
              source={require("../../../assets/logo/logoversion5.png")}
              style={[styles.logo, { transform: [{ scale: scaleAnim }] }]}
          />
      </View>
  );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#01091F", // Dark background
    },
    logo: {
        width: 400, // Adjust size as needed
        height: 350, // Adjust size as needed
        resizeMode: "contain",
    },
});

export default SplashScreen;
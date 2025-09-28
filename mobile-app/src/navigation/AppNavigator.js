import React, { useState, useEffect } from 'react';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'; // New import
import { StatusBar } from 'expo-status-bar';
import * as Linking from 'expo-linking';
import AsyncStorage from '@react-native-async-storage/async-storage'; // New import
import { Ionicons } from '@expo/vector-icons'; // New import
import { useTranslation } from 'react-i18next'; // New import

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import SignupScreen from '../screens/auth/SignupScreen';
import VerifyOtpScreen from '../screens/auth/VerifyOtpScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import EnterOtpForPasswordResetScreen from '../screens/auth/EnterOtpForPasswordResetScreen';
import SetupPasswordScreen from '../screens/auth/SetupPasswordScreen';
import SplashScreen from '../screens/auth/SplashScreen';
import JoinScreen from '../screens/auth/JoinScreen';

// App Screens
import DashboardScreen from '../screens/gestion/DashboardScreen';
import CreatePoolScreen from '../screens/manager/CreatePoolScreen';
import PoolHistoryScreen from '../screens/manager/PoolHistoryScreen';
import PoolDetailsScreen from '../screens/manager/PoolDetailsScreen';
import EmployeeTipHistoryScreen from '../screens/employee/EmployeeTipHistoryScreen';
import ProfileScreen from '../screens/auth/ProfileScreen'; // Assuming ProfileScreen is a main tab


const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator(); // Initialize Bottom Tab Navigator

const prefix = Linking.createURL('/');

const linking = {
  prefixes: [prefix],
  config: {
    screens: {
      SetupPassword: 'setup-password',
      Profile: 'profile',
      MainTabs: { // Add MainTabs to linking config
        path: 'main',
        screens: {
          DashboardTab: 'dashboard',
          PoolHistoryTab: 'pool-history',
          ProfileTab: 'profile-tab',
          CreatePoolTab: 'create-pool',
          EmployeeTipHistoryTab: 'employee-tip-history',
        },
      },
    },
  },
};

// Main Tabs Navigator
const MainTabs = () => {
  const [userRole, setUserRole] = useState(null);
  const [loadingRole, setLoadingRole] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const userString = await AsyncStorage.getItem('user');
        if (userString) {
          const user = JSON.parse(userString);
          setUserRole(user.role);
        }
      } catch (e) {
        console.error("Failed to load user role from AsyncStorage in MainTabs:", e);
      } finally {
        setLoadingRole(false);
      }
    };
    fetchUserRole();
  }, []);

  if (loadingRole) {
    // You might want a loading screen here
    return null; // Or a simple loading indicator
  }

  return (
      <Tab.Navigator
          screenOptions={({ route }) => ({
              tabBarIcon: ({ focused, color, size }) => {
                  let iconName;

                  if (route.name === "DashboardTab") {
                      iconName = focused ? "home" : "home-outline";
                  } else if (route.name === "PoolHistoryTab") {
                      iconName = focused ? "time" : "time-outline";
                  } else if (route.name === "ProfileTab") {
                      iconName = focused ? "person" : "person-outline";
                  } else if (route.name === "CreatePoolTab") {
                      iconName = focused ? "add-circle" : "add-circle-outline";
                  } else if (route.name === "EmployeeTipHistoryTab") {
                      iconName = focused ? "wallet" : "wallet-outline";
                  }

                  // You can return any component that you like here!
                  return <Ionicons name={iconName} size={size} color={color} />;
              },
              tabBarActiveTintColor: "#ad9407ff",
              tabBarInactiveTintColor: "#cccccc",
              tabBarStyle: {
                  backgroundColor: "#1b2646ff",

                  borderTopLeftRadius: 15,
                  borderTopRightRadius: 15,
              },
              headerShown: false, // Hide header for tabs, Stack Navigator will handle it
          })}
      >
          <Tab.Screen
              name="DashboardTab"
              component={DashboardScreen}
              options={{ title: t("bottomTabs.dashboard") }}
          />

          {userRole === "manager" && (
              <>
                  <Tab.Screen
                      name="CreatePoolTab"
                      component={CreatePoolScreen}
                      options={{ title: t("bottomTabs.createPool") }}
                  />
                  <Tab.Screen
                      name="PoolHistoryTab"
                      component={PoolHistoryScreen}
                      options={{ title: t("bottomTabs.poolHistory") }}
                  />
              </>
          )}

          {userRole === "employee" && (
              <Tab.Screen
                  name="EmployeeTipHistoryTab"
                  component={EmployeeTipHistoryScreen}
                  options={{ title: t("bottomTabs.myTips") }}
              />
          )}
          <Tab.Screen
              name="ProfileTab"
              component={ProfileScreen}
              options={{ title: t("bottomTabs.profile") }}
          />
      </Tab.Navigator>
  );
};


const AppNavigator = () => {
  return (
    <NavigationContainer theme={DarkTheme} linking={linking}>
      <StatusBar style="light" backgroundColor="transparent" translucent={true} />
      <Stack.Navigator initialRouteName="Splash">
        <Stack.Screen name="Splash" component={SplashScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Signup" component={SignupScreen} options={{ headerShown: false }} />
        <Stack.Screen name="VerifyOtp" component={VerifyOtpScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ headerShown: false }} />
        <Stack.Screen name="EnterOtpForPasswordReset" component={EnterOtpForPasswordResetScreen} options={{ headerShown: false }} />
        <Stack.Screen name="SetupPassword" component={SetupPasswordScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Join" component={JoinScreen} options={{ headerShown: false }} />

        {/* Main app flow after authentication */}
        <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />

        {/* These screens might be accessed from within tabs, so keep them as Stack.Screens */}
        <Stack.Screen name="PoolDetails" component={PoolDetailsScreen} options={{ headerShown: false }} />
           </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;

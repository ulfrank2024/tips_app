import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Button, Alert, TouchableOpacity, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '../../i18n/i18n';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import LanguageModal from '../../components/LanguageModal';
import ChangePasswordModal from '../../components/ChangePasswordModal';
import EditProfileModal from '../../components/EditProfileModal';
import * as authApi from '../../api/auth/authApi';

const ProfileScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const [user, setUser] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [changePasswordModalVisible, setChangePasswordModalVisible] = useState(false);
  const [editProfileModalVisible, setEditProfileModalVisible] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userString = await AsyncStorage.getItem('user');
        if (userString) {
          setUser(JSON.parse(userString));
        }
      } catch (error) {
        console.error('Failed to load user data from AsyncStorage', error);
      }
    };
    fetchUserData();
  }, []);

  const handleLanguageChange = async (lang) => {
    setSelectedLanguage(lang);
    await i18n.changeLanguage(lang);
    await AsyncStorage.setItem('userLanguage', lang);
  };

  const handleChangePassword = async (currentPassword, newPassword) => {
    try {
      await authApi.changePassword(currentPassword, newPassword);
      Alert.alert(t('common.success'), t('changePasswordScreen.passwordChangeSuccess'));
    } catch (error) {
      console.error('Failed to change password', error);
      Alert.alert(t('common.error'), t(`error.${error.message}`));
    }
  };

  const handleSaveProfile = async (firstName, lastName) => {
    try {
      const response = await authApi.updateProfile(firstName, lastName);
      // Update user data in AsyncStorage
      const updatedUser = { ...user, first_name: firstName, last_name: lastName };
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser); // Update local state
      Alert.alert(t('common.success'), t('editProfileScreen.profileUpdateSuccess'));
    } catch (error) {
      console.error('Failed to update profile', error);
      Alert.alert(t('common.error'), t(`error.${error.message}`));
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('token');
      navigation.replace('Login'); // Navigate to Login screen and clear navigation stack
    } catch (error) {
      console.error('Failed to log out', error);
      Alert.alert(t('common.error'), t('profileScreen.logoutFailed'));
    }
  };

  if (!user) {
    return (
      <View style={styles.centered}>
        <Text>{t('profileScreen.loadingUserData')}</Text>
      </View>
    );
  }

  return (
      <View style={styles.container}>
          <LanguageModal
              isVisible={languageModalVisible}
              onClose={() => setLanguageModalVisible(false)}
              onSelectLanguage={handleLanguageChange}
          />
          <ChangePasswordModal
              isVisible={changePasswordModalVisible}
              onClose={() => setChangePasswordModalVisible(false)}
              onChangePassword={handleChangePassword}
          />
          <EditProfileModal
              isVisible={editProfileModalVisible}
              onClose={() => setEditProfileModalVisible(false)}
              onSave={handleSaveProfile}
              firstName={user.first_name}
              lastName={user.last_name}
          />
          <View style={styles.profileHeader}>
              <View style={styles.avatarContainer}>
                  <Ionicons
                      name="person-circle-outline"
                      size={60}
                      color="#ad9407ff"
                  />
              </View>
              <View style={styles.nameEditContainer}>
                  {user.first_name && user.last_name && (
                      <Text style={styles.userName}>
                          {`${user.first_name} ${user.last_name}`}
                      </Text>
                  )}
                  <TouchableOpacity onPress={() => setEditProfileModalVisible(true)}>
                      <Ionicons name="pencil-outline" size={20} color="#ad9407ff" style={styles.editIcon} />
                  </TouchableOpacity>
              </View>
              <Text style={styles.userEmail}>{user.email}</Text>
          </View>

          <TouchableOpacity
              style={styles.card}
              onPress={() => setLanguageModalVisible(true)}
          >
              <Text style={styles.label}>
                  {t("profileScreen.selectLanguage")}
              </Text>
              <View style={styles.languageDisplay}>
                  <Image
                      source={selectedLanguage === 'fr' ? require('../../../assets/flags/fr.png') : require('../../../assets/flags/us.png')}
                      style={styles.flagIcon}
                  />
                  
                  <Text style={styles.languageText}>
                      {selectedLanguage === 'fr' ? 'Français' : 'English'}
                  </Text>
              </View>
          </TouchableOpacity>

          <TouchableOpacity
              style={styles.menuButton}
              onPress={() => setChangePasswordModalVisible(true)}
          >
              <Text style={styles.menuButtonText}>
                  {t("profileScreen.changePassword")}
              </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Text style={styles.logoutButtonText}>
                  {t("profileScreen.logout")}
              </Text>
          </TouchableOpacity>
      </View>
  );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: "#01091F",
    },
    centered: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#01091F",
    },
    profileHeader: {
        alignItems: "center",
        marginBottom: 25,
        marginTop: 40,
        backgroundColor: "#1b2646ff",
        padding: 10,
        borderRadius: 15,
        shadowColor: "#ffffff",
        marginBottom: 50,
    },
    avatarContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: "#2a2a3e",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 10,
    },
    nameEditContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 5,
    },
    userName: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#fff",
        marginRight: 10,
    },
    editIcon: {
        borderRadius: 40,
        backgroundColor: "#2a2a3e",
        width: 20,
        height: 20,
    },
    userEmail: {
        fontSize: 14,
        color: "#ad9407ff",
        marginTop: 4,
    },
    card: {
        backgroundColor: "#1b2646ff",
        borderRadius: 10,
        padding: 15,
        marginBottom: 15,
        shadowColor: "#ffffff",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 5,
    },
    menuButton: {
        backgroundColor: "#1b2646ff",
        borderRadius: 10,
        padding: 15,
        marginBottom: 15,
        shadowColor: "#ffffff",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 5,
    },
    menuButtonText: {
        fontSize: 18,
        fontWeight: "600",
        color: "#ffffffff",
        marginBottom: 5,
    },
    label: {
        fontSize: 18,
        fontWeight: "600",
        color: "#ffffffff",
        marginBottom: 5,
    },
    languageDisplay: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 5,
    },
    flagIcon: {
        width: 30,
        height: 20,
        marginRight: 10,
        borderRadius: 3,
        borderWidth: 0.5,
        borderColor: "#ccc",
    },
    languageText: {
        fontSize: 16,
        color: "#ad9407ff",
        marginTop: 5,
    },
    picker: {
        height: 50,
        width: "100%",
        color: "#333",
    },
    pickerItem: {
        color: "#333",
    },

    logoutButton: {
        backgroundColor: "#dc3545",
        padding: 15,
        borderRadius: 5,
        alignItems: "center",
        marginTop: 20,
    },
    logoutButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
    },
});

export default ProfileScreen;

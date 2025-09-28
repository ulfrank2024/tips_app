import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    Image,
    TouchableOpacity,
    Platform,
    KeyboardAvoidingView,
    ScrollView,
    Keyboard,
} from "react-native";
import { login } from "../../api/auth/authApi";
import { useTranslation } from "react-i18next";
import { FontAwesome, MaterialCommunityIcons } from "@expo/vector-icons";
import i18n from "../../i18n/i18n";
import LoadingOverlay from "../../components/LoadingOverlay";
import ErrorModal from "../../components/ErrorModal";
import AsyncStorage from '@react-native-async-storage/async-storage';

const LoginScreen = ({ navigation }) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [currentLanguage, setCurrentLanguage] = useState(i18n.language);
    const [isKeyboardVisible, setKeyboardVisible] = useState(false);
    const { t } = useTranslation();

    const [modalVisible, setModalVisible] = useState(false);
    const [modalTitle, setModalTitle] = useState('');
    const [modalMessage, setModalMessage] = useState('');

    useEffect(() => {
        const keyboardDidShowListener = Keyboard.addListener(
            "keyboardDidShow",
            () => {
                setKeyboardVisible(true);
            }
        );
        const keyboardDidHideListener = Keyboard.addListener(
            "keyboardDidHide",
            () => {
                setKeyboardVisible(false);
            }
        );

        const unsubscribe = navigation.addListener('blur', () => {
            setLoading(false);
        });

        return () => {
            keyboardDidHideListener.remove();
            keyboardDidShowListener.remove();
            unsubscribe();
        };
    }, [navigation]);

    const toggleLanguage = () => {
        const newLanguage = currentLanguage === "fr" ? "en" : "fr";
        i18n.changeLanguage(newLanguage);
        setCurrentLanguage(newLanguage);
    };

    const handleLogin = async () => {
        setError("");
        setLoading(true);

        try {
            const response = await login(email, password);
            if (response.token && response.user) {
                await AsyncStorage.setItem('userToken', response.token);
                await AsyncStorage.setItem('user', JSON.stringify(response.user));
                // Navigate immediately on success, replacing the login screen
                navigation.replace("MainTabs");
            } else {
                // Handle cases where login is successful but token/user is missing
                throw new Error('LOGIN_FAILED_NO_TOKEN');
            }
        } catch (err) {
            const errorCode = err.message;
            console.error(t("login.errorMessage"), errorCode);
            const translatedMessage = t(`error.${errorCode}`);
            const finalMessage = translatedMessage.startsWith('error.') ? t('common.somethingWentWrong') : translatedMessage;
            setError(finalMessage);
            setModalTitle(t('common.error'));
            setModalMessage(finalMessage);
            setModalVisible(true);
        } finally {
            setLoading(false);
        }
    };

    const handleModalClose = () => {
        setModalVisible(false);
        // Navigation is now handled directly in handleLogin
    };

    return (
        <View style={styles.container}>
            <ErrorModal
                isVisible={modalVisible}
                title={modalTitle}
                message={modalMessage}
                onClose={handleModalClose}
            />

            {loading && <LoadingOverlay />}
            <KeyboardAvoidingView
                style={styles.formSection}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={0}
            >
                <ScrollView
                    contentContainerStyle={[
                        styles.scrollContent,
                        {
                            justifyContent: isKeyboardVisible
                                ? "flex-end"
                                : "center",
                        },
                    ]}
                >
                    <View style={styles.logoSection}>
                        <Image
                            source={require("../../../assets/logo/logoversion5.png")}
                            style={styles.logo}
                        />
                    </View>
                    <View style={styles.titleContainer}>
                        <Text style={styles.title}>{t("login.title")}</Text>
                        <TouchableOpacity onPress={toggleLanguage}>
                            <Image
                                source={
                                    currentLanguage === "fr"
                                        ? require("../../../assets/flags/us.png")
                                        : require("../../../assets/flags/fr.png")
                                }
                                style={styles.flagIcon}
                            />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.passwordContainer}>
                        <MaterialCommunityIcons name="chef-hat" size={24} color="#aaaaaa" style={{ paddingLeft: 15, paddingRight: 5, alignSelf: 'center' }} />
                        <TextInput
                            style={styles.passwordInput}
                            placeholder={t("login.emailPlaceholder")}
                            placeholderTextColor="#aaaaaa"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                    </View>
                    <View style={styles.passwordContainer}>
                        <FontAwesome name="lock" size={20} color="#aaaaaa" style={{ paddingLeft: 15 }} />
                        <TextInput
                            style={styles.passwordInput}
                            placeholder={t("login.passwordPlaceholder")}
                            placeholderTextColor="#aaaaaa"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!showPassword}
                        />
                        <TouchableOpacity
                            style={styles.eyeIcon}
                            onPress={() => setShowPassword(!showPassword)}
                        >
                            <FontAwesome
                                name={showPassword ? "eye" : "eye-slash"}
                                size={20}
                                color="#aaaaaa"
                            />
                        </TouchableOpacity>
                    </View>

                    {!loading && (
                        <TouchableOpacity
                            style={styles.primaryButton}
                            onPress={handleLogin}
                        >
                            <Text style={styles.primaryButtonText}>
                                {t("login.loginButton")}
                            </Text>
                        </TouchableOpacity>
                    )}

                    

                    <View style={styles.linkContainer}>
                        <TouchableOpacity
                            onPress={() => navigation.navigate("Signup")}
                        >
                            <Text
                                style={styles.secondaryButtonText}
                                adjustsFontSizeToFit={true}
                                numberOfLines={2}
                            >
                                {t("login.noAccount")}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => navigation.navigate("Join")}
                        >
                            <Text
                                style={styles.secondaryButtonText}
                                adjustsFontSizeToFit={true}
                                numberOfLines={2}
                            >
                                {t("login.joinTeam")}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => {
                                console.log(
                                    "Navigating to ForgotPassword screen."
                                );
                                navigation.navigate("ForgotPassword");
                            }}
                        >
                            <Text
                                style={styles.secondaryButtonText}
                                adjustsFontSizeToFit={true}
                                numberOfLines={2}
                            >
                                {t("login.forgotPassword")}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: "column",
        backgroundColor: "#01091F",
    },
    titleContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 40,
    },
    formSection: {
        flex: 1,
    },
    logoSection: {
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 20,
    },
    logo: {
        width: 250, // Adjust size as needed
        height: 250, // Adjust size as needed
        resizeMode: "contain",
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: "flex-end",
        alignItems: "center",
        paddingHorizontal: 10,
        paddingTop: 20,
        paddingBottom: 0,
    },
    title: {
        fontSize: 30,
        fontWeight: "bold",
        color: "#ffffff",
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        width: "100%",
        height: 50,
        borderColor: "#555555",
        borderWidth: 0,
        borderRadius: 8,
        marginBottom: 15,
        backgroundColor: "#ffffff",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    emailInput: {
        flex: 1,
        paddingHorizontal: 10,
        color: "#000000",
    },
    errorText: {
        color: "#cf6679",
        marginTop: 10,
        marginBottom: 10,
        textAlign: "center",
    },
    primaryButton: {
        backgroundColor: "#ad9407ff",
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 8,
        width: "100%",
        alignItems: "center",
        marginBottom: 10,
    },
    primaryButtonText: {
        color: "#ffffff",
        fontSize: 18,
        fontWeight: "bold",
    },
    secondaryButton: {
        marginTop: 10,
        paddingVertical: 8,
        width: "100%",
        alignItems: "center",
        alignSelf: "center",
    },
    secondaryButtonText: {
        color: "#ffffff",
        fontSize: 14,
        textAlign: "center",
        flexShrink: 1,
    },
    passwordContainer: {
        flexDirection: "row",
        alignItems: "center",
        width: "100%",
        height: 50,
        borderColor: "#555555",
        borderWidth: 0,
        borderRadius: 8,
        marginBottom: 15,
        backgroundColor: "#ffffff",
        color: "#000000",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    passwordInput: {
        flex: 1,
        paddingHorizontal: 10,
        color: "#000000",
    },
    eyeIcon: {
        paddingHorizontal: 15,
    },
    languageSwitcher: {
        flexDirection: "row",
        justifyContent: "flex-end",
        padding: 10,
        width: "100%",
    },
    flagIcon: {
        width: 30,
        height: 20,
        marginHorizontal: 5,
        borderRadius: 3,
        borderWidth: 0.5,
        borderColor: "#ffffff",
    },
    linkContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        width: "100%",
        paddingHorizontal: 10,
        marginTop: 10,
    },
});

export default LoginScreen;
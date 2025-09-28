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
import { resetPassword } from "../../api/auth/authApi";
import { useTranslation } from "react-i18next";
import { FontAwesome, MaterialCommunityIcons } from "@expo/vector-icons";
import i18n from "../../i18n/i18n";
import LoadingOverlay from "../../components/LoadingOverlay";
import ErrorModal from "../../components/ErrorModal";

const EnterOtpForPasswordResetScreen = ({ navigation, route }) => {
    const { email } = route.params; // Email passed from ForgotPasswordScreen
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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

        return () => {
            keyboardDidHideListener.remove();
            keyboardDidShowListener.remove();
        };
    }, []);

    const toggleLanguage = () => {
        const newLanguage = currentLanguage === "fr" ? "en" : "fr";
        i18n.changeLanguage(newLanguage);
        setCurrentLanguage(newLanguage);
    };

    const handleResetPassword = async () => {
        setError("");
        if (!otp) {
            setModalTitle(t("common.error"));
            setModalMessage(t("resetPassword.otpRequired"));
            setModalVisible(true);
            return;
        }
        if (!newPassword || !confirmPassword) {
            setModalTitle(t("common.error"));
            setModalMessage(t("resetPassword.passwordRequired"));
            setModalVisible(true);
            return;
        }
        if (newPassword !== confirmPassword) {
            setModalTitle(t("common.error"));
            setModalMessage(t("resetPassword.passwordMismatch"));
            setModalVisible(true);
            return;
        }

        setLoading(true);

        try {
            const response = await resetPassword(email, otp, newPassword);
            console.log(t("resetPassword.successMessage"), response);
            setModalTitle(t("common.success"));
            setModalMessage(t("resetPassword.successMessage"));
            setModalVisible(true);
        } catch (err) {
            const errorCode = err.message;
            console.error(t("resetPassword.errorMessage"), errorCode);
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
        if (modalTitle === t("common.success")) {
            navigation.navigate("Login");
        }
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
                        <Text style={styles.title}>{t("resetPassword.title")}</Text>
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

                    <Text style={styles.instructionText}>
                        {t("resetPassword.enterOtpInstruction", { email })}
                    </Text>

                    <View style={styles.passwordContainer}>
                        <MaterialCommunityIcons name="dialpad" size={24} color="#aaaaaa" style={{ paddingLeft: 15, paddingRight: 5, alignSelf: 'center' }} />
                        <TextInput
                            style={styles.passwordInput}
                            placeholder={t("verifyOtp.otpPlaceholder")}
                            placeholderTextColor="#aaaaaa"
                            value={otp}
                            onChangeText={setOtp}
                            keyboardType="number-pad"
                            maxLength={6}
                        />
                    </View>

                    <View style={styles.passwordContainer}>
                        <FontAwesome name="lock" size={20} color="#aaaaaa" style={{ paddingLeft: 15, paddingRight: 5, alignSelf: 'center' }} />
                        <TextInput
                            style={styles.passwordInput}
                            placeholder={t("resetPassword.newPasswordPlaceholder")}
                            placeholderTextColor="#aaaaaa"
                            value={newPassword}
                            onChangeText={setNewPassword}
                            secureTextEntry={!showNewPassword}
                        />
                        <TouchableOpacity
                            style={styles.eyeIcon}
                            onPress={() => setShowNewPassword(!showNewPassword)}
                        >
                            <FontAwesome
                                name={showNewPassword ? "eye" : "eye-slash"}
                                size={20}
                                color="#aaaaaa"
                            />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.passwordContainer}>
                        <FontAwesome name="lock" size={20} color="#aaaaaa" style={{ paddingLeft: 15, paddingRight: 5, alignSelf: 'center' }} />
                        <TextInput
                            style={styles.passwordInput}
                            placeholder={t("resetPassword.confirmPasswordPlaceholder")}
                            placeholderTextColor="#aaaaaa"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry={!showConfirmPassword}
                        />
                        <TouchableOpacity
                            style={styles.eyeIcon}
                            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                            <FontAwesome
                                name={showConfirmPassword ? "eye" : "eye-slash"}
                                size={20}
                                color="#aaaaaa"
                            />
                        </TouchableOpacity>
                    </View>

                    {!loading && (
                        <TouchableOpacity
                            style={styles.primaryButton}
                            onPress={handleResetPassword}
                        >
                            <Text style={styles.primaryButtonText}>
                                {t("resetPassword.resetButton")}
                            </Text>
                        </TouchableOpacity>
                    )}

                    

                    <TouchableOpacity
                        style={styles.secondaryButton}
                        onPress={() => navigation.navigate("Login")}
                    >
                        <Text
                            style={styles.secondaryButtonText}
                            adjustsFontSizeToFit={true}
                            numberOfLines={2}
                        >
                            {t("resetPassword.backToLogin")}
                        </Text>
                    </TouchableOpacity>
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
    formSection: {
        flex: 1,
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
        fontSize: 25,
        fontWeight: "bold",
        color: "#ffffff",
    },
    instructionText: {
        color: "#ffffff",
        fontSize: 16,
        textAlign: "center",
        marginBottom: 20,
        paddingHorizontal: 20,
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
    flagIcon: {
        width: 30,
        height: 20,
        marginHorizontal: 5,
        borderRadius: 3,
        borderWidth: 0.5,
        borderColor: "#ffffff",
    },
});

export default EnterOtpForPasswordResetScreen;

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
import { verifyOtp, resendOtp } from "../../api/auth/authApi";
import { useTranslation } from "react-i18next";
import i18n from "../../i18n/i18n";
import LoadingOverlay from "../../components/LoadingOverlay";
import ErrorModal from "../../components/ErrorModal";

const VerifyOtpScreen = ({ navigation, route }) => {
    const { email } = route.params;
    const [otp, setOtp] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [currentLanguage, setCurrentLanguage] = useState(i18n.language);
    const [isKeyboardVisible, setKeyboardVisible] = useState(false);
    const { t } = useTranslation();

    const [modalVisible, setModalVisible] = useState(false);
    const [modalTitle, setModalTitle] = useState('');
    const [modalMessage, setModalMessage] = useState('');
    const [otpVerified, setOtpVerified] = useState(false);

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

    const handleVerifyOtp = async () => {
        setError("");
        setLoading(true);

        try {
            const response = await verifyOtp(email, otp);
            console.log(t("verifyOtp.successMessage"), response);
            setOtpVerified(true);
            setModalTitle(t("common.success"));
            setModalMessage(t("verifyOtp.successMessage"));
            setModalVisible(true);
        } catch (err) {
            const errorCode = err.message;
            console.error(t("verifyOtp.errorMessage"), errorCode);
            setError(t(`error.${errorCode}`) || t("common.somethingWentWrong"));
            setModalTitle(t("common.error"));
            const translatedMessage = t(errorCode);
            setModalMessage(translatedMessage !== errorCode ? translatedMessage : errorCode || t("common.somethingWentWrong"));
            setModalVisible(true);
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        setError("");
        setLoading(true);

        try {
            const response = await resendOtp(email);
            console.log(t("verifyOtp.resendSuccessMessage"), response);
            setModalTitle(t("common.success"));
            setModalMessage(t("verifyOtp.resendSuccessMessage"));
            setModalVisible(true);
        } catch (err) {
            const errorCode = err.message;
            console.error(t("verifyOtp.resendErrorMessage"), errorCode);
            setError(t(`error.${errorCode}`) || t("common.somethingWentWrong"));
            setModalTitle(t("common.error"));
            const translatedMessage = t(errorCode);
            setModalMessage(translatedMessage !== errorCode ? translatedMessage : errorCode || t("common.somethingWentWrong"));
            setModalVisible(true);
        } finally {
            setLoading(false);
        }
    };

    const handleModalClose = () => {
        setModalVisible(false);
        if (otpVerified) {
            navigation.navigate("Login");
        }
    };

    return (
        <View
            style={styles.container}
        >
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
                        <Text style={styles.title}>{t("verifyOtp.title")}</Text>
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
                        {t("verifyOtp.instruction", { email })}
                    </Text>

                    <TextInput
                        style={styles.input}
                        placeholder={t("verifyOtp.otpPlaceholder")}
                        placeholderTextColor="#aaaaaa"
                        value={otp}
                        onChangeText={setOtp}
                        keyboardType="number-pad"
                        maxLength={6}
                    />

                    {!loading && (
                        <TouchableOpacity
                            style={styles.primaryButton}
                            onPress={handleVerifyOtp}
                        >
                            <Text style={styles.primaryButtonText}>
                                {t("verifyOtp.verifyButton")}
                            </Text>
                        </TouchableOpacity>
                    )}

                    {error ? (
                        <Text style={styles.errorText}>{error}</Text>
                    ) : null}

                    <TouchableOpacity
                        style={styles.secondaryButton}
                        onPress={handleResendOtp}
                    >
                        <Text
                            style={styles.secondaryButtonText}
                            adjustsFontSizeToFit={true}
                            numberOfLines={2}
                        >
                            {t("verifyOtp.resendButton")}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.secondaryButton}
                        onPress={() => navigation.navigate("Login")}
                    >
                        <Text
                            style={styles.secondaryButtonText}
                            adjustsFontSizeToFit={true}
                            numberOfLines={2}
                        >
                            {t("verifyOtp.backToLogin")}
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
        fontSize: 30,
        fontWeight: "bold",
        color: "#ffffff",
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
    instructionText: {
        color: "#ffffff",
        fontSize: 16,
        textAlign: "center",
        marginBottom: 20,
        paddingHorizontal: 20,
    },
    input: {
        width: "100%",
        height: 50,
        borderColor: "#555555",
        borderWidth: 0,
        borderRadius: 8,
        paddingHorizontal: 10,
        marginBottom: 15,
        backgroundColor: "#ffffff",
        color: "#000000",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
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
    flagIcon: {
        width: 30,
        height: 20,
        marginHorizontal: 5,
        borderRadius: 3,
        borderWidth: 0.5,
        borderColor: "#ffffff",
    },
});

export default VerifyOtpScreen;
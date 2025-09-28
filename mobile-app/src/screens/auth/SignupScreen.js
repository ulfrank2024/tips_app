import React, { useState, useEffect } from 'react';
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
import { signup } from '../../api/auth/authApi';
import { useTranslation } from 'react-i18next';
import { FontAwesome, MaterialCommunityIcons } from "@expo/vector-icons";
import i18n from '../../i18n/i18n';
import ErrorModal from "../../components/ErrorModal";

const SignupScreen = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [currentLanguage, setCurrentLanguage] = useState(i18n.language);
    const [isKeyboardVisible, setKeyboardVisible] = useState(false);
    const { t } = useTranslation();

    const [modalVisible, setModalVisible] = useState(false);
    const [modalTitle, setModalTitle] = useState('');
    const [modalMessage, setModalMessage] = useState('');

    useEffect(() => {
        const keyboardDidShowListener = Keyboard.addListener(
            'keyboardDidShow',
            () => {
                setKeyboardVisible(true);
            }
        );
        const keyboardDidHideListener = Keyboard.addListener(
            'keyboardDidHide',
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
        const newLanguage = currentLanguage === 'fr' ? 'en' : 'fr';
        i18n.changeLanguage(newLanguage);
        setCurrentLanguage(newLanguage);
    };

    const handleSignup = async () => {
        setError('');
        if (password !== confirmPassword) {
            setError(t('error.PASSWORD_MISMATCH'));
            setModalTitle(t('common.error'));
            setModalMessage(t('error.PASSWORD_MISMATCH'));
            setModalVisible(true);
            return;
        }
        setLoading(true);

        try {
            const response = await signup(email, password, companyName, firstName, lastName);
            console.log(t('signup.successMessage'), response);
            setModalTitle(t('common.success'));
            setModalMessage(response.message || t('signup.successMessage'));
            setModalVisible(true);
        } catch (err) {
            const errorCode = err.message;
            console.error(t("signup.errorMessage"), errorCode);
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
            navigation.navigate('VerifyOtp', { email });
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
            <KeyboardAvoidingView
                style={styles.formSection}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
            >
                <ScrollView
                    contentContainerStyle={[
                        styles.scrollContent,
                        { justifyContent: isKeyboardVisible ? "flex-end" : "center" },
                    ]}
          >
             <View style={styles.logoSection}>
                                    <Image
                                        source={require("../../../assets/logo/logoversion5.png")}
                                        style={styles.logo}
                                    />
                                </View>
                    <View style={styles.titleContainer}>
                        <Text style={styles.title}>{t("signup.title")}</Text>
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
                        <FontAwesome name="user" size={24} color="#aaaaaa" style={{ paddingLeft: 15, paddingRight: 5, alignSelf: 'center' }} />
                        <TextInput
                            style={styles.passwordInput}
                            placeholder={t("signup.firstNamePlaceholder")}
                            placeholderTextColor="#aaaaaa"
                            value={firstName}
                            onChangeText={setFirstName}
                            autoCapitalize="words"
                        />
                    </View>
                    <View style={styles.passwordContainer}>
                        <FontAwesome name="user" size={24} color="#aaaaaa" style={{ paddingLeft: 15, paddingRight: 5, alignSelf: 'center' }} />
                        <TextInput
                            style={styles.passwordInput}
                            placeholder={t("signup.lastNamePlaceholder")}
                            placeholderTextColor="#aaaaaa"
                            value={lastName}
                            onChangeText={setLastName}
                            autoCapitalize="words"
                        />
                    </View>

                    <View style={styles.passwordContainer}>
                        <MaterialCommunityIcons name="email" size={24} color="#aaaaaa" style={{ paddingLeft: 15, paddingRight: 5, alignSelf: 'center' }} />
                        <TextInput
                            style={styles.passwordInput}
                            placeholder={t("signup.emailPlaceholder")}
                            placeholderTextColor="#aaaaaa"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                    </View>
                    <View style={styles.passwordContainer}>
                        <FontAwesome name="lock" size={20} color="#aaaaaa" style={{ paddingLeft: 15, paddingRight: 5, alignSelf: 'center' }} />
                        <TextInput
                            style={styles.passwordInput}
                            placeholder={t("signup.passwordPlaceholder")}
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
                    <View style={styles.passwordContainer}>
                        <FontAwesome name="lock" size={20} color="#aaaaaa" style={{ paddingLeft: 15, paddingRight: 5, alignSelf: 'center' }} />
                        <TextInput
                            style={styles.passwordInput}
                            placeholder={t("signup.confirmPasswordPlaceholder")}
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
                    <View style={styles.passwordContainer}>
                        <FontAwesome name="building" size={20} color="#aaaaaa" style={{ paddingLeft: 15, paddingRight: 5, alignSelf: 'center' }} />
                        <TextInput
                            style={styles.passwordInput}
                            placeholder={t("signup.companyNamePlaceholder")}
                            placeholderTextColor="#aaaaaa"
                            value={companyName}
                            onChangeText={setCompanyName}
                            autoCapitalize="words"
                        />
                    </View>

                    {!loading && (
                        <TouchableOpacity style={styles.primaryButton} onPress={handleSignup}>
                            <Text style={styles.primaryButtonText}>{t("signup.signupButton")}</Text>
                        </TouchableOpacity>
                    )}

                    

                    <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate('Login')}>
                        <Text style={styles.secondaryButtonText} adjustsFontSizeToFit={true} numberOfLines={2}>{t('signup.alreadyAccount')}</Text>
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
        alignItems: "center",
        paddingHorizontal: 10,
        paddingTop: 20,
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
    flagIcon: {
        width: 30,
        height: 20,
        marginHorizontal: 5,
        borderRadius: 3,
        borderWidth: 0.5,
        borderColor: "#ffffff",
    },
});

export default SignupScreen;

import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { FontAwesome } from '@expo/vector-icons';

const ChangePasswordModal = ({ isVisible, onClose, onChangePassword }) => {
    const { t } = useTranslation();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

    const handleSubmit = () => {
        if (!currentPassword || !newPassword || !confirmNewPassword) {
            Alert.alert(t('common.error'), t('changePasswordScreen.passwordRequired'));
            return;
        }
        if (newPassword !== confirmNewPassword) {
            Alert.alert(t('common.error'), t('changePasswordScreen.passwordMismatch'));
            return;
        }
        if (newPassword.length < 6) { // Example: minimum password length
            Alert.alert(t('common.error'), t('changePasswordScreen.passwordTooShort'));
            return;
        }

        onChangePassword(currentPassword, newPassword);
        onClose();
    };

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={isVisible}
            onRequestClose={onClose}
        >
            <View style={styles.centeredView}>
                <View style={styles.modalView}>
                    <Text style={styles.modalTitle}>
                        {t("profileScreen.changePassword")}
                    </Text>

                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder={t(
                                "changePasswordScreen.currentPasswordPlaceholder"
                            )}
                            placeholderTextColor="#aaaaaa"
                            secureTextEntry={!showCurrentPassword}
                            value={currentPassword}
                            onChangeText={setCurrentPassword}
                        />
                        <TouchableOpacity
                            onPress={() =>
                                setShowCurrentPassword(!showCurrentPassword)
                            }
                            style={styles.eyeIcon}
                        >
                            <FontAwesome
                                name={showCurrentPassword ? "eye" : "eye-slash"}
                                size={20}
                                color="#aaaaaa"
                            />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder={t(
                                "changePasswordScreen.newPasswordPlaceholder"
                            )}
                            placeholderTextColor="#aaaaaa"
                            secureTextEntry={!showNewPassword}
                            value={newPassword}
                            onChangeText={setNewPassword}
                        />
                        <TouchableOpacity
                            onPress={() => setShowNewPassword(!showNewPassword)}
                            style={styles.eyeIcon}
                        >
                            <FontAwesome
                                name={showNewPassword ? "eye" : "eye-slash"}
                                size={20}
                                color="#aaaaaa"
                            />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder={t(
                                "changePasswordScreen.confirmNewPasswordPlaceholder"
                            )}
                            placeholderTextColor="#aaaaaa"
                            secureTextEntry={!showConfirmNewPassword}
                            value={confirmNewPassword}
                            onChangeText={setConfirmNewPassword}
                        />
                        <TouchableOpacity
                            onPress={() =>
                                setShowConfirmNewPassword(
                                    !showConfirmNewPassword
                                )
                            }
                            style={styles.eyeIcon}
                        >
                            <FontAwesome
                                name={
                                    showConfirmNewPassword ? "eye" : "eye-slash"
                                }
                                size={20}
                                color="#aaaaaa"
                            />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.contenuerButton}>
                        <TouchableOpacity
                            style={styles.submitButton}
                            onPress={handleSubmit}
                        >
                            <Text style={styles.submitButtonText}>
                                {t("changePasswordScreen.changePasswordButton")}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={onClose}
                        >
                            <Text style={styles.cancelButtonText}>
                                {t("common.cancel")}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    centeredView: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0, 0, 0, 0.6)",
    },
    modalView: {
        margin: 20,
        backgroundColor: "white",
        borderRadius: 20,
        padding: 5,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
        width: "95%",
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: "bold",
        marginBottom: 20,
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        width: "100%",
        height: 50,
        borderColor: "#ddd",
        borderWidth: 1,
        borderRadius: 10,
        marginBottom: 15,
        paddingHorizontal: 10,
        backgroundColor: "#f9f9f9",
    },
    input: {
        flex: 1,
        height: "100%",
        color: "#333",
    },
    eyeIcon: {
        padding: 10,
    },
    submitButton: {
        backgroundColor: "#ad9407ff",
        borderRadius: 10,
        padding: 10,
        elevation: 2,
        marginTop: 10,
        width: "48%",
        alignItems: "center",
    },
    submitButtonText: {
        color: "white",
        fontWeight: "bold",
        textAlign: "center",
    },
    cancelButton: {
        backgroundColor: "#6c757d",
        borderRadius: 10,
        padding: 15,
        elevation: 2,
        marginTop: 10,
        width: "48%",
        alignItems: "center",
    },
    cancelButtonText: {
        color: "white",
        fontWeight: "bold",
        textAlign: "center",
    },
    contenuerButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width:'100%'
       
    }
});

export default ChangePasswordModal;

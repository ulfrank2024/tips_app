import React, { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';

const EditProfileModal = ({ isVisible, onClose, onSave, firstName: initialFirstName, lastName: initialLastName }) => {
    const { t } = useTranslation();
    const [firstName, setFirstName] = useState(initialFirstName);
    const [lastName, setLastName] = useState(initialLastName);

    useEffect(() => {
        setFirstName(initialFirstName);
        setLastName(initialLastName);
    }, [initialFirstName, initialLastName]);

    const handleSubmit = () => {
        if (!firstName || !lastName) {
            Alert.alert(t('common.error'), t('editProfileScreen.nameRequired'));
            return;
        }
        onSave(firstName, lastName);
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
                        {t("profileScreen.editProfile")}
                    </Text>

                    <TextInput
                        style={styles.input}
                        placeholder={t("signup.firstNamePlaceholder")}
                        placeholderTextColor="#aaaaaa"
                        value={firstName}
                        onChangeText={setFirstName}
                        autoCapitalize="words"
                    />

                    <TextInput
                        style={styles.input}
                        placeholder={t("signup.lastNamePlaceholder")}
                        placeholderTextColor="#aaaaaa"
                        value={lastName}
                        onChangeText={setLastName}
                        autoCapitalize="words"
                    />
                    <View style={styles.submitconteneur}>
                        <TouchableOpacity
                            style={styles.submitButton}
                            onPress={handleSubmit}
                        >
                            <Text style={styles.submitButtonText}>
                                {t("common.save")}
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
        padding: 15,
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
    input: {
        width: "100%",
        height: 50,
        borderColor: "#ddd",
        borderWidth: 1,
        borderRadius: 10,
        marginBottom: 15,
        paddingHorizontal: 10,
        backgroundColor: "#f9f9f9",
        color: "#333",
    },
    submitButton: {
        backgroundColor: "#ad9407ff",
        borderRadius: 10,
        padding: 15,
        elevation: 2,
        marginTop: 10,
        width: "45%",
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
        width: "45%",
        alignItems: "center",
    },
    cancelButtonText: {
        color: "white",
        fontWeight: "bold",
        textAlign: "center",
    },
    submitconteneur: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width:'100%'

    }
});

export default EditProfileModal;

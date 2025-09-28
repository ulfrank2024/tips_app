import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useTranslation } from 'react-i18next';

const LanguageModal = ({ isVisible, onClose, onSelectLanguage }) => {
    const { t } = useTranslation();

    const languages = [
        {
            code: 'en',
            name: 'Englishh',
            flag: require('../../assets/flags/us.png'),
        },
        {
            code: 'fr',
            name: 'Françaiss',
            flag: require('../../assets/flags/fr.png'),
        },
    ];

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={isVisible}
            onRequestClose={onClose}
        >
            <View style={styles.centeredView}>
                <View style={styles.modalView}>
                    <Text style={styles.modalTitle}>{t('profileScreen.selectLanguage')}</Text>

                    {languages.map((lang) => (
                        <TouchableOpacity
                            key={lang.code}
                            style={styles.languageButton}
                            onPress={() => {
                                onSelectLanguage(lang.code);
                                onClose();
                            }}
                        >
                            <Image source={lang.flag} style={styles.flag} />
                            <Text style={styles.languageButtonText}>{lang.name}</Text>
                        </TouchableOpacity>
                    ))}

                    <TouchableOpacity
                        style={styles.closeButton}
                        onPress={onClose}
                    >
                        <Text style={styles.closeButtonText}>{t('common.close')}</Text>
                    </TouchableOpacity>
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
        padding: 35,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
        width: "80%",
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: "bold",
        marginBottom: 20,
    },
    languageButton: {
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
    flag: {
        width: 30,
        height: 20,
        marginRight: 15,
    },
    languageButtonText: {
        fontSize: 16,
        color: "#333",
    },
    closeButton: {
        marginTop: 20,
        backgroundColor: "#ad9407ff",
        borderRadius: 10,
        padding: 10,
        elevation: 2,
    },
    closeButtonText: {
        color: "white",
        fontWeight: "bold",
        textAlign: "center",
    },
});

export default LanguageModal;

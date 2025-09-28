import React from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

const CategorySelectionModal = ({
    isVisible,
    onClose,
    categories,
    selectedCategoryId,
    onSelectCategory,
}) => {
    const { t } = useTranslation();

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={isVisible}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                    <Text style={styles.modalTitle}>
                        {t("dashboardScreen.selectCategory")}
                    </Text>
                    <ScrollView style={{ width: "100%", maxHeight: 200 }}>
                        {categories.length === 0 ? (
                            <Text style={styles.noCategoriesText}>
                                {t("dashboardScreen.noCategoriesFound")}
                            </Text>
                        ) : (
                            categories.map((cat) => (
                                <TouchableOpacity
                                    key={cat.id}
                                    style={styles.categorySelectionItem}
                                    onPress={() => {
                                        onSelectCategory(cat.id);
                                        onClose();
                                    }}
                                >
                                    <Text style={styles.categorySelectionItemText}>
                                        {cat.name}
                                    </Text>
                                    {selectedCategoryId === cat.id && (
                                        <Ionicons name="checkmark" size={20} color="#ad9407ff" />
                                    )}
                                </TouchableOpacity>
                            ))
                        )}
                    </ScrollView>
                    <TouchableOpacity
                        style={[styles.secondaryButton, { width: "100%", marginHorizontal: 0 }]}
                        onPress={onClose}
                    >
                        <Text style={styles.secondaryButtonText}>
                            {t("common.cancel")}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0, 0, 0, 0.7)",
    },
    modalContainer: {
        width: 300, // Fixed width for debugging
        height: 400, // Fixed height for debugging
        backgroundColor: "#ffffff", // Distinct background color for debugging
        borderRadius: 10,
        padding: 20,
        alignItems: "center",
       
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: "bold",
        color: "#333",
        marginBottom: 20,
    },
    noCategoriesText: {
        textAlign: "center",
        color: "#666",
        marginTop: 10,
    },
    categorySelectionItem: {
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: "#eee",
        width: "100%",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    categorySelectionItemText: {
        fontSize: 16,
        color: "#333",
    },
    secondaryButton: {
        backgroundColor: "#6c757d",
        padding: 10,
        borderRadius: 5,
        alignItems: "center",
    },
    secondaryButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
    },
});

export default CategorySelectionModal;
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ActivityIndicator, TouchableOpacity, Image, Modal, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import CategorySelectionModal from './CategorySelectionModal';

const EditEmployeeModal = ({
    isVisible,
    onClose,
    employeeDetails,
    onSave,
    categories,
}) => {
    const { t } = useTranslation();
    const [editedEmployeeDetails, setEditedEmployeeDetails] = useState(employeeDetails);
    const [isInternalCategorySelectionModalVisible, setIsInternalCategorySelectionModalVisible] = useState(false);

    useEffect(() => {
        setEditedEmployeeDetails(employeeDetails);
    }, [employeeDetails]);

    const handleSave = () => {
        if (editedEmployeeDetails) {
            onSave(editedEmployeeDetails);
        }
    };

    

    return (
        <>
            <Modal
                animationType="slide"
                transparent={true}
                visible={isVisible}
                onRequestClose={onClose}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <ScrollView style={{ width: "100%", flex: 1 }} pointerEvents="box-none">
                            <Text style={styles.modalTitle}>
                                {t("dashboardScreen.editEmployee")}
                            </Text>

                            {editedEmployeeDetails && (
                                <>
                                    <Text style={styles.employeeDetailText}>
                                        {t("common.email")}:{" "}
                                        {editedEmployeeDetails?.email}
                                    </Text>
                                    <Text style={styles.employeeDetailText}>
                                        {t("common.name")}:{" "}
                                        {editedEmployeeDetails?.first_name}{" "}
                                        {editedEmployeeDetails?.last_name}
                                    </Text>

                                    <Text style={styles.label}>
                                        {t("dashboardScreen.categoryLabel")}
                                    </Text>
                                    <TouchableOpacity
                                    style={[styles.pickerContainer, { zIndex: 9999 }]} // Added zIndex directly
                                    onPress={() => {
                                        console.log("TouchableOpacity pressed in EditEmployeeModal");
                                        setIsInternalCategorySelectionModalVisible(true);
                                    }}
                                >
                                    <Text style={styles.pickerText}>
                                        {editedEmployeeDetails?.category_id
                                            ? categories.find(cat => cat.id === editedEmployeeDetails.category_id)?.name
                                            : t("dashboardScreen.selectCategory")}
                                    </Text>
                                    <Ionicons name="chevron-down" size={20} color="#333" />
                                </TouchableOpacity>
                                </>
                            )}

                            <View style={styles.zonebutton}>
                                <TouchableOpacity
                                    style={styles.primaryButton}
                                    onPress={handleSave}
                                >
                                    <Text style={styles.primaryButtonText}>
                                        {t("common.save")}
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.secondaryButton}
                                    onPress={onClose}
                                >
                                    <Text style={styles.secondaryButtonText}>
                                        {t("common.cancel")}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            <CategorySelectionModal
                isVisible={isInternalCategorySelectionModalVisible}
                onClose={() => setIsInternalCategorySelectionModalVisible(false)}
                categories={categories}
                selectedCategoryId={editedEmployeeDetails?.category_id}
                onSelectCategory={(categoryId) => {
                    setEditedEmployeeDetails(prevDetails => ({
                        ...prevDetails,
                        category_id: categoryId,
                    }));
                }}
            />
        </>
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
        width: '90%',
        height:'40%',
        backgroundColor: "#ffffff",
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
    employeeDetailText: {
        fontSize: 16,
        color: "#333",
        marginBottom: 5,
        alignSelf: "flex-start",
    },
    label: {
        fontSize: 16,
        color: "#333",
        marginTop: 10,
        marginBottom: 5,
        alignSelf: "flex-start",
    },
    pickerContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        borderColor: "gray",
        borderWidth: 1,
        borderRadius: 5,
        marginBottom: 15,
        width: "100%",
        backgroundColor: "#ffffff",
        paddingHorizontal: 10,
        height: 50,
    },
    pickerText: {
        fontSize: 16,
        color: "#333",
    },
    zonebutton: {
        flexDirection: "row",
        justifyContent: "space-around",
        width: "100%",
        marginTop: 20,
    },
    primaryButton: {
        backgroundColor: "#ad9407ff",
        padding: 15,
        borderRadius: 5,
        alignItems: "center",
        marginTop: 10,
        flexDirection: "row",
        justifyContent: "center",
        flex: 1,
        marginHorizontal: 5,
    },
    primaryButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
    },
    secondaryButton: {
        backgroundColor: "#6c757d",
        padding: 15,
        borderRadius: 5,
        alignItems: "center",
        marginTop: 10,
        flexDirection: "row",
        justifyContent: "center",
        flex: 1,
        marginHorizontal: 5,
    },
    secondaryButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
    },
});

export default EditEmployeeModal;
import React, { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

const MultiEmployeeSelectModal = ({ isVisible, onClose, availableEmployees, initialSelectedEmployeeIds, onSave }) => {
    const { t } = useTranslation();
    const [searchText, setSearchText] = useState('');
    const [currentSelection, setCurrentSelection] = useState(new Set(initialSelectedEmployeeIds));

    useEffect(() => {
        setCurrentSelection(new Set(initialSelectedEmployeeIds));
    }, [initialSelectedEmployeeIds]);

    const toggleSelection = (employeeId) => {
        const newSelection = new Set(currentSelection);
        if (newSelection.has(employeeId)) {
            newSelection.delete(employeeId);
        } else {
            newSelection.add(employeeId);
        }
        setCurrentSelection(newSelection);
    };

    const filteredEmployees = availableEmployees.filter(emp =>
        emp.first_name.toLowerCase().includes(searchText.toLowerCase()) ||
        emp.last_name.toLowerCase().includes(searchText.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchText.toLowerCase())
    );

    const handleSave = () => {
        onSave(Array.from(currentSelection));
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
                    <Text style={styles.modalTitle}>{t('createPoolScreen.selectEmployees')}</Text>

                    <TextInput
                        style={styles.searchInput}
                        placeholder={t('createPoolScreen.searchEmployeePlaceholder')}
                        placeholderTextColor="#aaaaaa"
                        value={searchText}
                        onChangeText={setSearchText}
                    />

                    <ScrollView style={styles.employeeList}>
                        {filteredEmployees.length === 0 ? (
                            <Text style={styles.noResultsText}>{t('createPoolScreen.noEmployeesFound')}</Text>
                        ) : (
                            filteredEmployees.map(emp => (
                                <TouchableOpacity
                                    key={emp.id}
                                    style={styles.employeeItem}
                                    onPress={() => toggleSelection(emp.id)}
                                >
                                    <Ionicons
                                        name={currentSelection.has(emp.id) ? "checkbox-outline" : "square-outline"}
                                        size={24}
                                        color={currentSelection.has(emp.id) ? "#ad9407ff" : "#ccc"}
                                        style={styles.checkboxIcon}
                                    />
                                    <Text style={styles.employeeName}>{`${emp.first_name} ${emp.last_name} (${emp.category})`}</Text>
                                </TouchableOpacity>
                            ))
                        )}
                    </ScrollView>

                    <View style={styles.buttonContainer}>
                        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                            <Text style={styles.saveButtonText}>{t('common.save')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                            <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
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
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
    },
    modalView: {
        margin: 20,
        backgroundColor: '#1b2646ff',
        borderRadius: 20,
        padding: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
        width: '90%',
        maxHeight: '80%',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 15,
        color: '#fff',
    },
    searchInput: {
        width: '100%',
        height: 40,
        backgroundColor: '#2a2a3e',
        borderRadius: 8,
        paddingHorizontal: 10,
        marginBottom: 15,
        color: '#fff',
    },
    employeeList: {
        width: '100%',
        maxHeight: '70%',
    },
    employeeItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#2a2a3e',
    },
    checkboxIcon: {
        marginRight: 10,
    },
    employeeName: {
        color: '#fff',
        fontSize: 16,
        flex: 1,
    },
    noResultsText: {
        color: '#ccc',
        textAlign: 'center',
        marginTop: 20,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        marginTop: 20,
    },
    saveButton: {
        backgroundColor: '#ad9407ff',
        borderRadius: 10,
        paddingVertical: 12,
        paddingHorizontal: 20,
        elevation: 2,
    },
    saveButtonText: {
        color: 'white',
        fontWeight: 'bold',
        textAlign: 'center',
    },
    cancelButton: {
        backgroundColor: '#6c757d',
        borderRadius: 10,
        paddingVertical: 12,
        paddingHorizontal: 20,
        elevation: 2,
    },
    cancelButtonText: {
        color: 'white',
        fontWeight: 'bold',
        textAlign: 'center',
    },
});

export default MultiEmployeeSelectModal;

import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ScrollView, ActivityIndicator, Platform, TouchableOpacity, Image, Modal, FlatList } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { createPool } from '../../api/tip/tipApi';
import { getCompanyEmployees } from '../../api/auth/authApi';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import ErrorModal from '../../components/ErrorModal';

const CreatePoolScreen = ({ navigation }) => {
    const { t, i18n } = useTranslation();

    const frenchMonthNames = [
        "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
        "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
    ];
    const englishMonthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const monthNames = useMemo(() => {
        if (i18n.language === 'fr') {
            return frenchMonthNames;
        }
        return englishMonthNames;
    }, [i18n.language]);

    const [name, setName] = useState('');
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());
    const [showStartDatePicker, setShowStartDatePicker] = useState(false);
    const [showEndDatePicker, setShowEndDatePicker] = useState(false);
    const [totalAmount, setTotalAmount] = useState('');
    const [distributionModel, setDistributionModel] = useState('equal');
    const [availableEmployees, setAvailableEmployees] = useState([]);
    const [selectedEmployees, setSelectedEmployees] = useState([]);
    const [loading, setLoading] = useState(true);

    const [errorModalVisible, setErrorModalVisible] = useState(false);
    const [modalTitle, setModalTitle] = useState('');
    const [modalMessage, setModalMessage] = useState('');

    const [isPickerModalVisible, setPickerModalVisible] = useState(false);
    const [pickerType, setPickerType] = useState(null);
    const [pickerData, setPickerData] = useState([]);

    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                const userString = await AsyncStorage.getItem('user');
                const user = JSON.parse(userString);
                if (user && user.company_id) {
                    const employees = await getCompanyEmployees(user.company_id);
                    setAvailableEmployees(employees);
                } else {
                    setModalTitle(t('common.error'));
                    setModalMessage(t('createPoolScreen.companyIdNotFound'));
                    setErrorModalVisible(true);
                }
            } catch (err) {
                console.error("Failed to fetch employees:", err);
                setModalTitle(t('common.error'));
                setModalMessage(t('createPoolScreen.failedToLoadEmployees'));
                setErrorModalVisible(true);
            } finally {
                setLoading(false);
            }
        };
        fetchEmployees();
    }, []);

    const openPicker = (type) => {
        setPickerType(type);
        if (type === 'month') {
            setPickerData(monthNames.map((m, i) => ({label: m, value: i})));
        } else if (type === 'employee') {
            setPickerData(availableEmployees.map(e => ({label: `${e.first_name} ${e.last_name} (${e.category_name})`, value: e.id})));
        }
        setPickerModalVisible(true);
    };

    const onSelectItem = (item) => {
        if (pickerType === 'month') {
            setSelectedMonth(item.value);
        } else if (pickerType === 'employee') {
            handleAddEmployee(item.value);
        }
        setPickerModalVisible(false);
    };

    const onStartDateChange = (event, selectedDate) => {
        const currentDate = selectedDate || startDate;
        setShowStartDatePicker(Platform.OS === 'ios');
        setStartDate(currentDate);
    };

    const onEndDateChange = (event, selectedDate) => {
        const currentDate = selectedDate || endDate;
        setShowEndDatePicker(Platform.OS === 'ios');
        setEndDate(currentDate);
    };

    const handleAddEmployee = (employeeId) => {
        const employeeToAdd = availableEmployees.find(emp => emp.id === employeeId);
        if (employeeToAdd && !selectedEmployees.some(emp => emp.user_id === employeeId)) {
            setSelectedEmployees([...selectedEmployees, { user_id: employeeId, hours_worked: '', percentage_share: '' }]);
        }
    };

    const handleRemoveEmployee = (employeeId) => {
        setSelectedEmployees(selectedEmployees.filter(emp => emp.user_id !== employeeId));
    };

    const handleEmployeeHoursChange = (userId, hours) => {
        setSelectedEmployees(selectedEmployees.map(emp =>
            emp.user_id === userId ? { ...emp, hours_worked: hours } : emp
        ));
    };

    const handleEmployeePercentageChange = (userId, percentage) => {
        setSelectedEmployees(selectedEmployees.map(emp =>
            emp.user_id === userId ? { ...emp, percentage_share: percentage } : emp
        ));
    };

    const handleCreatePool = async () => {
        const poolName = `${monthNames[selectedMonth]} ${startDate.getFullYear()}`;

        if (!totalAmount || selectedEmployees.length === 0) {
            setModalTitle(t('common.error'));
            setModalMessage(t('createPoolScreen.fillAllFieldsAndAddEmployee'));
            setErrorModalVisible(true);
            return;
        }
        if (isNaN(parseFloat(totalAmount)) || parseFloat(totalAmount) <= 0) {
            setModalTitle(t('common.error'));
            setModalMessage(t('createPoolScreen.invalidTotalAmount'));
            setErrorModalVisible(true);
            return;
        }
        if (startDate > endDate) {
            setModalTitle(t('common.error'));
            setModalMessage(t('createPoolScreen.startDateAfterEndDate'));
            setErrorModalVisible(true);
            return;
        }

        if (distributionModel === 'hours') {
            for (const emp of selectedEmployees) {
                if (isNaN(parseFloat(emp.hours_worked)) || parseFloat(emp.hours_worked) <= 0) {
                    setModalTitle(t('common.error'));
                    setModalMessage(t('createPoolScreen.invalidHoursWorked'));
                    setErrorModalVisible(true);
                    return;
                }
            }
        } else if (distributionModel === 'percentage') {
            let totalPercentage = 0;
            for (const emp of selectedEmployees) {
                if (isNaN(parseFloat(emp.percentage_share)) || parseFloat(emp.percentage_share) <= 0) {
                    setModalTitle(t('common.error'));
                    setModalMessage(t('createPoolScreen.invalidPercentageShare'));
                    setErrorModalVisible(true);
                    return;
                }
                totalPercentage += parseFloat(emp.percentage_share);
            }
            if (totalPercentage !== 100) {
                setModalTitle(t('common.error'));
                setModalMessage(t('createPoolScreen.totalPercentageNot100'));
                setErrorModalVisible(true);
                return;
            }
        }

        const poolData = {
            name: poolName,
            start_date: startDate.toISOString().split('T')[0],
            end_date: endDate.toISOString().split('T')[0],
            total_amount: parseFloat(totalAmount),
            distribution_model: distributionModel,
            employees: selectedEmployees.map(emp => {
                const data = { user_id: emp.user_id };
                if (distributionModel === 'hours') data.hours_worked = parseFloat(emp.hours_worked);
                if (distributionModel === 'percentage') data.percentage_share = parseFloat(emp.percentage_share);
                return data;
            })
        };

        try {
            const newPool = await createPool(poolData);
            setModalTitle(t('common.success'));
            setModalMessage(t('createPoolScreen.poolCreatedSuccessfully'));
            setErrorModalVisible(true);
        } catch (err) {
            console.error("Failed to create pool:", err);
            setModalTitle(t('common.error'));
            setModalMessage(`${t('createPoolScreen.failedToCreatePool')}${err.message}`);
            setErrorModalVisible(true);
        }
    };

    const handleModalClose = () => {
        setErrorModalVisible(false);
        if (modalTitle === t('common.success')) {
            navigation.goBack();
        }
    };

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#ad9407ff" />
                <Text style={styles.loadingText}>{t('createPoolScreen.loadingEmployees')}</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Modal
                transparent={true}
                visible={isPickerModalVisible}
                onRequestClose={() => setPickerModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <FlatList
                            data={pickerData}
                            keyExtractor={(item) => item.value.toString()}
                            renderItem={({ item }) => (
                                <TouchableOpacity style={styles.modalItem} onPress={() => onSelectItem(item)}>
                                    <Text style={styles.modalItemText}>{item.label}</Text>
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </View>
            </Modal>
            <ScrollView style={styles.scrollViewContainer} contentContainerStyle={styles.scrollViewContent}>
                <ErrorModal
                    isVisible={errorModalVisible}
                    title={modalTitle}
                    message={modalMessage}
                    onClose={handleModalClose}
                />
                <View style={styles.headerContainer}>
                    <Image
                        source={require("../../../assets/logo/logoversion5.png")}
                        style={styles.logo}
                    />
                    <Text style={styles.title}>{t('createPoolScreen.title')}</Text>
                </View>

                <Text style={styles.label}>{t('createPoolScreen.monthLabel')}</Text>
                <TouchableOpacity style={styles.pickerWrapper} onPress={() => openPicker('month')}>
                    <Text style={styles.pickerText}>{monthNames[selectedMonth]}</Text>
                </TouchableOpacity>

                <Text style={styles.label}>{t('createPoolScreen.startDateLabel')}</Text>
                <TouchableOpacity style={styles.dateButton} onPress={() => setShowStartDatePicker(true)}>
                    <Text style={styles.dateButtonText}>{startDate.toLocaleDateString()}</Text>
                </TouchableOpacity>
                {showStartDatePicker && (
                    <DateTimePicker
                        testID="startDatePicker"
                        value={startDate}
                        mode="date"
                        display="default"
                        onChange={onStartDateChange}
                    />
                )}

                <Text style={styles.label}>{t('createPoolScreen.endDateLabel')}</Text>
                <TouchableOpacity style={styles.dateButton} onPress={() => setShowEndDatePicker(true)}>
                    <Text style={styles.dateButtonText}>{endDate.toLocaleDateString()}</Text>
                </TouchableOpacity>
                {showEndDatePicker && (
                    <DateTimePicker
                        testID="endDatePicker"
                        value={endDate}
                        mode="date"
                        display="default"
                        onChange={onEndDateChange}
                    />
                )}

                <TextInput
                    style={styles.input}
                    placeholder={t('createPoolScreen.totalAmountPlaceholder')}
                    placeholderTextColor="#aaaaaa"
                    keyboardType="numeric"
                    value={totalAmount}
                    onChangeText={setTotalAmount}
                />

                <Text style={styles.label}>{t('createPoolScreen.distributionModelLabel')}</Text>
                <View style={styles.distributionModelContainer}>
                    <TouchableOpacity
                        style={[styles.distributionButton, distributionModel === 'equal' && styles.distributionButtonSelected]}
                        onPress={() => setDistributionModel('equal')}
                    >
                        <Text style={[styles.distributionButtonText, distributionModel === 'equal' && styles.distributionButtonTextSelected]}>{t('createPoolScreen.equalDistribution')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.distributionButton, distributionModel === 'hours' && styles.distributionButtonSelected]}
                        onPress={() => setDistributionModel('hours')}
                    >
                        <Text style={[styles.distributionButtonText, distributionModel === 'hours' && styles.distributionButtonTextSelected]}>{t('createPoolScreen.hoursBasedDistribution')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.distributionButton, distributionModel === 'percentage' && styles.distributionButtonSelected]}
                        onPress={() => setDistributionModel('percentage')}
                    >
                        <Text style={[styles.distributionButtonText, distributionModel === 'percentage' && styles.distributionButtonTextSelected]}>{t('createPoolScreen.percentageBasedDistribution')}</Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.label}>{t('createPoolScreen.addEmployeesLabel')}</Text>
                {availableEmployees.length === 0 ? (
                    <Text style={styles.noEmployeesText}>{t('createPoolScreen.noEmployeesFound')}</Text>
                ) : (
                    <TouchableOpacity style={styles.pickerWrapper} onPress={() => openPicker('employee')}>
                        <Text style={styles.pickerText}>{t('createPoolScreen.selectEmployeePlaceholder')}</Text>
                    </TouchableOpacity>
                )}

                <View style={styles.selectedEmployeesContainer}>
                    {selectedEmployees.map(emp => {
                        const employeeDetails = availableEmployees.find(availEmp => availEmp.id === emp.user_id);
                        return (
                            <View key={emp.user_id} style={styles.employeeItem}>
                                <Text style={styles.employeeItemText}>{employeeDetails ? `${employeeDetails.first_name} ${employeeDetails.last_name} (${employeeDetails.category_name})` : emp.user_id}</Text>
                                {distributionModel === 'hours' && (
                                    <TextInput
                                        style={styles.smallInput}
                                        placeholder={t('createPoolScreen.hoursPlaceholder')}
                                        placeholderTextColor="#aaaaaa"
                                        keyboardType="numeric"
                                        value={emp.hours_worked}
                                        onChangeText={(text) => handleEmployeeHoursChange(emp.user_id, text)}
                                    />
                                )}
                                {distributionModel === 'percentage' && (
                                    <TextInput
                                        style={styles.smallInput}
                                        placeholder={t('createPoolScreen.percentagePlaceholder')}
                                        placeholderTextColor="#aaaaaa"
                                        keyboardType="numeric"
                                        value={emp.percentage_share}
                                        onChangeText={(text) => handleEmployeePercentageChange(emp.user_id, text)}
                                    />
                                )}
                                <TouchableOpacity style={styles.removeButton} onPress={() => handleRemoveEmployee(emp.user_id)}>
                                    <Text style={styles.removeButtonText}>{t('createPoolScreen.removeButton')}</Text>
                                </TouchableOpacity>
                            </View>
                        );
                    })}
                </View>
            </ScrollView>
            <TouchableOpacity style={styles.createPoolButton} onPress={handleCreatePool}>
                <Text style={styles.createPoolButtonText}>{t('createPoolScreen.createPoolButton')}</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#01091F',
        paddingTop: 70,
        paddingHorizontal: 20,
    },
    scrollViewContainer: {
        flex: 1,
    },
    scrollViewContent: {
        flexGrow: 1,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#01091F',
    },
    titleContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 20,
        width: "100%",
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginLeft: 10,
    },
    label: {
        fontSize: 16,
        marginTop: 10,
        marginBottom: 5,
        color: '#fff',
    },
    input: {
        height: 50,
        borderColor: '#1b2646ff',
        borderWidth: 1,
        borderRadius: 8,
        marginBottom: 10,
        paddingHorizontal: 10,
        backgroundColor: '#2a2a3e',
        color: '#fff',
    },
    dateButton: {
        backgroundColor: '#1b2646ff',
        padding: 10,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 10,
    },
    dateButtonText: {
        color: '#fff',
        fontSize: 16,
    },
    pickerWrapper: {
        borderColor: '#1b2646ff',
        borderWidth: 1,
        borderRadius: 8,
        marginBottom: 10,
        backgroundColor: '#2a2a3e',
        height: 50,
        justifyContent: 'center',
        paddingHorizontal: 10,
    },
    pickerText: {
        color: '#fff',
        fontSize: 16,
    },
    distributionModelContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 10,
        backgroundColor: '#2a2a3e',
        borderRadius: 8,
        padding: 5,
    },
    distributionButton: {
        flex: 1,
        padding: 10,
        borderRadius: 5,
        alignItems: 'center',
        marginHorizontal: 5,
        backgroundColor: '#1b2646ff',
    },
    distributionButtonSelected: {
        backgroundColor: '#ad9407ff',
    },
    distributionButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 12,
    },
    distributionButtonTextSelected: {
        color: '#01091F',
    },
    selectedEmployeesContainer: {
        marginTop: 10,
        marginBottom: 40,
    },
    employeeItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 10,
        borderWidth: 1,
        borderColor: '#1b2646ff',
        borderRadius: 8,
        marginBottom: 5,
        backgroundColor: '#2a2a3e',
    },
    employeeItemText: {
        color: '#fff',
        flex: 1,
    },
    smallInput: {
        width: 80,
        height: 40,
        borderColor: '#ad9407ff',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 5,
        marginLeft: 10,
        backgroundColor: '#3a3a5e',
        color: '#fff',
    },
    removeButton: {
        backgroundColor: '#dc3545',
        padding: 8,
        borderRadius: 5,
        marginLeft: 10,
    },
    removeButtonText: {
        color: '#fff',
        fontSize: 12,
    },
    createPoolButton: {
        backgroundColor: '#ad9407ff',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 20,
    },
    createPoolButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    loadingText: {
        color: '#fff',
        marginTop: 10,
    },
    errorText: {
        color: '#dc3545',
        textAlign: 'center',
        marginTop: 20,
    },
    noEmployeesText: {
        color: '#fff',
        textAlign: 'center',
        marginTop: 10,
        marginBottom: 10,
        fontSize: 16,
        paddingVertical: 15,
        paddingHorizontal: 10,
        backgroundColor: '#2a2a3e',
        borderRadius: 8,
        fontWeight: 'bold',
    },
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    logo: {
        width: 50,
        height: 50,
        resizeMode: "contain",
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        backgroundColor: '#2a2a3e',
        borderRadius: 10,
        padding: 20,
        width: '80%',
        maxHeight: '80%',
    },
    modalItem: {
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#ffffff',
    },
    modalItemText: {
        color: '#fff',
        fontSize: 18,
        textAlign: 'center',
    },
});

export default CreatePoolScreen;

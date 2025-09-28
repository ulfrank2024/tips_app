import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ActivityIndicator, TouchableOpacity, Image, Modal, ScrollView, Dimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';

import { inviteEmployee, getCompanyCategories, createCategory, updateCategory, deleteCategory, getCompanyEmployees, updateUserCategory, unlinkEmployee } from '../../api/auth/authApi';
import { getPoolHistory, getEmployeeTipHistory } from '../../api/tip/tipApi';
import i18n from '../../i18n/i18n';

import EditEmployeeModal from '../../components/EditEmployeeModal';
import CategorySelectionModal from '../../components/CategorySelectionModal';

const screenWidth = Dimensions.get("window").width;

const DashboardScreen = ({ navigation }) => {
  const { t } = useTranslation();
  
  const [userRole, setUserRole] = useState(null);
  const [userName, setUserName] = useState('');
  const [loadingRole, setLoadingRole] = useState(true);
  const [errorRole, setErrorRole] = useState('');
  const [isUnlinkedModalVisible, setIsUnlinkedModalVisible] = useState(false);
  
  const [emails, setEmails] = useState([{ id: Date.now(), value: '' }]);
  const [isInviteModalVisible, setIsInviteModalVisible] = useState(false);
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [isCategoryModalVisible, setIsCategoryModalVisible] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [latestPool, setLatestPool] = useState(null);
  const [isEditEmployeeModalVisible, setIsEditEmployeeModalVisible] = useState(false);
  const [editingEmployeeDetails, setEditingEmployeeDetails] = useState(null);
  const [isCategorySelectionModalVisible, setIsCategorySelectionModalVisible] = useState(false);

  const [latestTip, setLatestTip] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [tipDetailsForChart, setTipDetailsForChart] = useState([]);

  const isFocused = useIsFocused();

  const handleLogout = async () => {
    await AsyncStorage.multiRemove(['user', 'userToken']);
    navigation.replace('Login');
  };

  useEffect(() => {
    const loadUserData = async () => {
      setLoadingRole(true);
      try {
        const userString = await AsyncStorage.getItem('user');
        if (userString) {
          const user = JSON.parse(userString);
          if (user.role === 'employee' && !user.company_id) {
            setIsUnlinkedModalVisible(true);
          }
          setUserRole(user.role || null);
          setUserName(user.first_name || '');
        } else {
          setErrorRole(t('dashboardScreen.userRoleNotFound'));
        }
      } catch (e) {
        console.error("Failed to load user data:", e);
        setErrorRole(t('dashboardScreen.failedToLoadUserRole'));
      } finally {
        setLoadingRole(false);
      }
    };
    loadUserData();
  }, []);

  useEffect(() => {
    const fetchRoleSpecificData = async () => {
      if (!isFocused || !userRole || isUnlinkedModalVisible) return;

      const userString = await AsyncStorage.getItem('user');
      const user = JSON.parse(userString);

      if (userRole === 'manager') {
        try {
          const [categoriesData, employeesData, poolHistoryData] = await Promise.all([
            getCompanyCategories(),
            getCompanyEmployees(user.company_id),
            getPoolHistory()
          ]);

          setCategories(categoriesData);
          if (categoriesData.length > 0 && !selectedCategoryId) {
            setSelectedCategoryId(categoriesData[0].id);
          }
          setEmployees(employeesData);
          if (poolHistoryData && poolHistoryData.length > 0) {
            const sortedPools = poolHistoryData.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            setLatestPool(sortedPools[0]);
          }
        } catch (error) {
          console.error("Failed to load manager data:", error);
        }
      } else if (userRole === 'employee') {
        try {
          const tipHistory = await getEmployeeTipHistory(user.id);
          if (tipHistory && tipHistory.length > 0) {
            setLatestTip(tipHistory[0]);
            const recentTips = tipHistory.slice(0, 7).reverse();
            setTipDetailsForChart(recentTips);

            if (recentTips.length > 0) {
              setChartData({
                labels: recentTips.map(tip => new Date(tip.calculated_at).toLocaleDateString(i18n.language, { month: 'numeric', day: 'numeric' })),
                datasets: [{ data: recentTips.map(tip => parseFloat(tip.distributed_amount)) }],
              });
            }
          } else {
            setLatestTip(null);
            setChartData(null);
            setTipDetailsForChart([]);
          }
        } catch (error) {
          console.error("Failed to load employee tip history:", error);
        }
      }
    };

    fetchRoleSpecificData();
  }, [isFocused, userRole, t, isUnlinkedModalVisible]);

  const colorPalette = ['#ad9407ff', '#dc3545', '#1b2646ff', '#6c757d', '#28a745'];
  const poolColorMap = {};
  let colorIndex = 0;
  tipDetailsForChart.forEach(tip => {
      if (!poolColorMap[tip.pool_name]) {
          poolColorMap[tip.pool_name] = colorPalette[colorIndex % colorPalette.length];
          colorIndex++;
      }
  });

  const getDotColor = (dataPoint, dataPointIndex) => {
      if (!tipDetailsForChart[dataPointIndex]) return colorPalette[0];
      const poolName = tipDetailsForChart[dataPointIndex].pool_name;
      return poolColorMap[poolName] || colorPalette[0];
  };

  const handleEmailChange = (id, text) => setEmails(emails.map(email => (email.id === id ? { ...email, value: text } : email)));
  const addEmailField = () => setEmails([...emails, { id: Date.now(), value: '' }]);
  const removeEmailField = (id) => { if (emails.length > 1) setEmails(emails.filter(email => email.id !== id)); };
  const toggleInviteModal = () => setIsInviteModalVisible(!isInviteModalVisible);

  const handleInvite = async () => {
    const validEmails = emails.map(e => e.value.trim()).filter(e => e && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
    if (validEmails.length === 0 || !selectedCategoryId) {
      Alert.alert(t('common.error'), t('dashboardScreen.fillAllFields'));
      return;
    }
    try {
      await Promise.all(validEmails.map(email => inviteEmployee(email, selectedCategoryId)));
      Alert.alert(t('dashboardScreen.success'), `${t('dashboardScreen.invitationsSentTo')}:\n${validEmails.join('\n')}`);
      setIsInviteModalVisible(false);
    } catch (error) {
      const finalMessage = t(`error.${error.message}`, t('common.somethingWentWrong'));
      Alert.alert(t('common.error'), finalMessage);
    }
  };

  const fetchCategories = async () => {
    try {
      const fetchedCategories = await getCompanyCategories();
      setCategories(fetchedCategories);
    } catch (e) {
      Alert.alert(t('common.error'), t('dashboardScreen.failedToLoadCategories'));
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      Alert.alert(t('common.error'), t('dashboardScreen.categoryNameRequired'));
      return;
    }
    try {
      await createCategory(newCategoryName, newCategoryDescription, null);
      Alert.alert(t('common.success'), t('dashboardScreen.categoryCreatedSuccessfully'));
      setNewCategoryName('');
      setNewCategoryDescription('');
      fetchCategories();
    } catch (error) {
      const finalMessage = t(`error.${error.message}`, t('common.somethingWentWrong'));
      Alert.alert(t('common.error'), finalMessage);
    }
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setNewCategoryName(category.name);
    setNewCategoryDescription(category.description || '');
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory || !newCategoryName.trim()) return;
    try {
      await updateCategory(editingCategory.id, newCategoryName, newCategoryDescription, editingCategory.effects_supplements || null);
      Alert.alert(t('common.success'), t('dashboardScreen.categoryUpdatedSuccessfully'));
      setEditingCategory(null);
      setNewCategoryName('');
      setNewCategoryDescription('');
      fetchCategories();
    } catch (error) {
      const finalMessage = t(`error.${error.message}`, t('common.somethingWentWrong'));
      Alert.alert(t('common.error'), finalMessage);
    }
  };

  const handleDeleteCategory = async (categoryId, categoryName) => {
    Alert.alert(t('common.confirm'), t('dashboardScreen.confirmDeleteCategory', { categoryName }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCategory(categoryId);
              Alert.alert(t('common.success'), t('dashboardScreen.categoryDeletedSuccessfully'));
              fetchCategories();
            } catch (error) {
              const finalMessage = t(`error.${error.message}`, t('common.somethingWentWrong'));
              Alert.alert(t('common.error'), finalMessage);
            }
          },
        },
      ], { cancelable: false });
  };

  const handleEditEmployee = (employee) => {
    setEditingEmployeeDetails(employee);
    setIsEditEmployeeModalVisible(true);
  };

  const handleSaveEmployeeCategory = async (employeeDetailsToSave) => {
    if (!employeeDetailsToSave || !employeeDetailsToSave.category_id) {
      Alert.alert(t('common.error'), t('dashboardScreen.categoryRequired'));
      return;
    }
    try {
      await updateUserCategory(employeeDetailsToSave.id, employeeDetailsToSave.category_id);
      Alert.alert(t('common.success'), t('dashboardScreen.employeeCategoryUpdatedSuccessfully'));
      setIsEditEmployeeModalVisible(false);
      setEditingEmployeeDetails(null);
      const userString = await AsyncStorage.getItem('user');
      const user = JSON.parse(userString);
      if (user && user.company_id) {
        const fetchedEmployees = await getCompanyEmployees(user.company_id);
        setEmployees(fetchedEmployees);
      }
      fetchCategories();
    } catch (error) {
      const finalMessage = t(`error.${error.message}`, t('common.somethingWentWrong'));
      Alert.alert(t('common.error'), finalMessage);
    }
  };

  const handleDeleteEmployee = (employee) => {
    Alert.alert(
      t('dashboardScreen.confirmDeleteEmployeeTitle'),
      t('dashboardScreen.confirmDeleteEmployeeMessage', { employeeName: `${employee.first_name} ${employee.last_name}` }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await unlinkEmployee(employee.id);
              Alert.alert(t('common.success'), t('dashboardScreen.employeeDeletedSuccess'));
              setEmployees(employees.filter(e => e.id !== employee.id));
            } catch (error) {
              const finalMessage = t(`error.${error.message}`, t('common.somethingWentWrong'));
              Alert.alert(t('common.error'), finalMessage);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  if (loadingRole) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#ad9407ff" /></View>;
  }

  if (errorRole) {
    return <View style={styles.centered}><Text style={styles.errorText}>{errorRole}</Text><Button title={t('common.retry')} onPress={() => navigation.goBack()} /></View>;
  }

  return (
    <ScrollView style={styles.container}>
      <Modal
        animationType="fade"
        transparent={true}
        visible={isUnlinkedModalVisible}
        onRequestClose={() => {}} // Prevent closing by back button
      >
        <View style={styles.modalOverlay}>
          <View style={styles.unlinkedModalContainer}>
            <Ionicons name="information-circle-outline" size={60} color="#ad9407ff" />
            <Text style={styles.modalTitle}>{t('dashboardScreen.unlinkedTitle')}</Text>
            <Text style={styles.unlinkedModalText}>{t('dashboardScreen.unlinkedMessage')}</Text>
            <View style={styles.modalButtonGroup}>
                <TouchableOpacity style={styles.secondaryModalButton} onPress={() => { setIsUnlinkedModalVisible(false); navigation.navigate('Join'); }}>
                    <Text style={styles.secondaryModalButtonText}>{t('dashboardScreen.joinNewTeam')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.primaryModalButton} onPress={handleLogout}>
                    <Text style={styles.primaryModalButtonText}>{t('profileScreen.logout')}</Text>
                </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.topHeader}>
        <Image source={require("../../../assets/logo/logoversion5.png")} style={styles.headerLogo} />
        {userRole === "employee" && <Text style={styles.greeting}>{t("dashboardScreen.hello")} {userName}!</Text>}
        {userRole === "manager" && (
          <TouchableOpacity style={styles.addEmployeeButton} onPress={toggleInviteModal}>
            <Ionicons name="person-add-outline" size={24} color="#fff" />
            <Text style={styles.addEmployeeButtonText}>{t("dashboardScreen.addEmployee")}</Text>
          </TouchableOpacity>
        )}
      </View>

      {userRole === "employee" && (
        <>
          <View style={styles.card}>
            <Text style={styles.subtitle}>{t("dashboardScreen.myLastTip")}</Text>
            {latestTip ? (
              <View style={styles.tipDetailsContainer}>
                <Text style={styles.tipAmount}>{latestTip.distributed_amount || "N/A"} $</Text>
                <Text style={styles.tipDate}>{t("dashboardScreen.receivedOn")} {new Date(latestTip.calculated_at).toLocaleDateString()}</Text>
                <View style={styles.separator} />
                <Text style={styles.poolInfoText}><Text style={{fontWeight: 'bold'}}>{t("poolHistoryScreen.pool")}</Text> {latestTip.pool_name}</Text>
                <Text style={styles.poolInfoText}><Text style={{fontWeight: 'bold'}}>{t("poolHistoryScreen.period")}</Text> {new Date(latestTip.start_date).toLocaleDateString()} {t("poolHistoryScreen.to")} {new Date(latestTip.end_date).toLocaleDateString()}</Text>
              </View>
            ) : (
              <Text style={styles.noTipText}>{t("dashboardScreen.noTipsYet")}</Text>
            )}
            <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.jumpTo("EmployeeTipHistoryTab")}>
              <Ionicons name="wallet-outline" size={20} color="#fff" style={styles.buttonIcon} />
              <Text style={styles.primaryButtonText}>{t("dashboardScreen.viewMyTipHistoryButton")}</Text>
            </TouchableOpacity>
          </View>

          {chartData && (
            <View style={styles.card}>
              <Text style={styles.subtitle}>{t("dashboardScreen.myTrends")}</Text>
              <LineChart
                data={chartData}
                width={screenWidth - 40}
                height={220}
                fromZero={true}
                formatYLabel={() => ''}
                getDotColor={getDotColor}
                renderDotContent={({x, y, index, indexData}) => (
                  <Text key={index} style={{ position: 'absolute', left: x - 18, top: y - 20, color: '#333', fontWeight: 'bold' }}>
                    {indexData.toFixed(0)}$
                  </Text>
                )}
                chartConfig={{
                  backgroundColor: "#ffffff",
                  backgroundGradientFrom: "#ffffff",
                  backgroundGradientTo: "#ffffff",
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(173, 148, 7, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  style: { borderRadius: 16 },
                  propsForDots: { r: "6", strokeWidth: "2" }
                }}
                bezier
                style={{ marginVertical: 8, borderRadius: 16 }}
              />
              <View style={styles.legendContainer}>
                {Object.keys(poolColorMap).map(poolName => (
                    <View key={poolName} style={styles.legendItem}>
                        <View style={{width: 10, height: 10, backgroundColor: poolColorMap[poolName], marginRight: 5, borderRadius: 5}} />
                        <Text style={styles.legendText}>{poolName}</Text>
                    </View>
                ))}
              </View>
            </View>
          )}
        </>
      )}

      {userRole === "manager" && (
        <>
          {latestPool && (
            <View style={styles.card}>
              <Text style={styles.subtitle}>{t("dashboardScreen.latestPool")}</Text>
              <View style={styles.poolDetailsContainer}>
                <Text style={styles.poolDetailText}><Text style={{ fontWeight: 'bold' }}>{t("poolHistoryScreen.pool")}:</Text> {latestPool.name}</Text>
                <Text style={styles.poolDetailText}><Text style={{ fontWeight: 'bold' }}>{t("poolHistoryScreen.period")}:</Text> {new Date(latestPool.start_date).toLocaleDateString()} {t("poolHistoryScreen.to")} {new Date(latestPool.end_date).toLocaleDateString()}</Text>
                <Text style={styles.poolDetailText}><Text style={{ fontWeight: 'bold' }}>{t("poolHistoryScreen.totalAmount")}:</Text> {latestPool.total_amount} $</Text>
                {latestPool.calculated_at && <Text style={styles.poolDetailText}><Text style={{ fontWeight: 'bold' }}>{t("poolHistoryScreen.calculatedOn")}:</Text> {new Date(latestPool.calculated_at).toLocaleDateString()}</Text>}
                <TouchableOpacity style={styles.viewDetailsButton} onPress={() => navigation.navigate("PoolDetails", { poolId: latestPool.id })}>
                  <Text style={styles.viewDetailsButtonText}>{t("poolHistoryScreen.viewDetails")}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          <View style={styles.card}>
            <Text style={styles.subtitle}>{t("dashboardScreen.tipPoolManagement")}</Text>
            <View style={styles.buttonGroup}>
              <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate("MainTabs", { screen: "CreatePoolTab" })}>
                <Ionicons name="add-circle-outline" size={20} color="#fff" style={styles.buttonIcon} />
                <Text style={styles.secondaryButtonText}>{t("dashboardScreen.createPoolButton")}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate("MainTabs", { screen: "PoolHistoryTab" })}>
                <Ionicons name="time-outline" size={20} color="#fff" style={styles.buttonIcon} />
                <Text style={styles.secondaryButtonText}>{t("dashboardScreen.viewPoolHistoryButton")}</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.card}>
            <Text style={styles.subtitle}>{t("dashboardScreen.employeeList")}</Text>
            {employees.length === 0 ? (
              <Text style={styles.noEmployeesText}>{t("dashboardScreen.noEmployeesFound")}</Text>
            ) : (
              employees.map((emp) => (
                <View key={emp.id} style={styles.employeeListItem}>
                    <View style={styles.employeeInfoContainer}>
                        <Ionicons name="person" size={20} color="#2a2a3e" style={styles.employeeIcon} />
                        <Text style={styles.employeeListItemText}>{emp.first_name} {emp.last_name} ({emp.category_name || "N/A"})</Text>
                    </View>
                    <View style={styles.employeeActionsContainer}>
                        <TouchableOpacity onPress={() => handleEditEmployee(emp)} style={styles.editButton}>
                            <Ionicons name="create-outline" size={20} color="#ad9407ff" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDeleteEmployee(emp)} style={styles.deleteButton}>
                            <Ionicons name="trash-outline" size={20} color="#dc3545" />
                        </TouchableOpacity>
                    </View>
                </View>
              ))
            )}
          </View>
        </>
      )}

      <Modal animationType="slide" transparent={true} visible={isInviteModalVisible} onRequestClose={toggleInviteModal}>
          <View style={styles.modalOverlay}>
              <View style={styles.modalContainer}>
                  <ScrollView style={{ width: "100%" }}>
                      <Text style={styles.modalTitle}>{t("dashboardScreen.employeeManagement")}</Text>
                      {emails.map((email) => (
                          <View key={email.id} style={styles.emailInputContainer}>
                              <TextInput
                                  style={styles.modalInput}
                                  placeholder={t("dashboardScreen.employeeEmailPlaceholder")}
                                  value={email.value}
                                  onChangeText={(text) => handleEmailChange(email.id, text)}
                                  keyboardType="email-address"
                                  autoCapitalize="none"
                              />
                              {emails.length > 1 && (
                                  <TouchableOpacity onPress={() => removeEmailField(email.id)} style={styles.removeButton}>
                                      <Ionicons name="remove-circle" size={24} color="#ff6347" />
                                  </TouchableOpacity>
                              )}
                          </View>
                      ))}
                      <TouchableOpacity onPress={addEmailField} style={styles.addButton}>
                          <Ionicons name="add-circle" size={28} color="#ad9407ff" />
                          <Text style={styles.addButtonText}>{t("dashboardScreen.addAnotherEmail")}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.pickerContainer} onPress={() => setIsCategorySelectionModalVisible(true)}>
                          <Text style={styles.pickerText}>{selectedCategoryId ? categories.find(cat => cat.id === selectedCategoryId)?.name : t("dashboardScreen.selectCategory")}</Text>
                          <Ionicons name="chevron-down" size={20} color="#333" />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.manageCategoriesButton} onPress={() => { toggleInviteModal(); setIsCategoryModalVisible(true); }}>
                          <Ionicons name="settings-outline" size={20} color="#fff" style={styles.buttonIcon} />
                          <Text style={styles.manageCategoriesButtonText}>{t("dashboardScreen.manageCategories")}</Text>
                      </TouchableOpacity>
                      <View style={styles.zonebutton}>
                          <TouchableOpacity style={styles.primaryButton} onPress={handleInvite}>
                              <Text style={styles.primaryButtonText}>{t("dashboardScreen.sendInvitationButton")}</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.secondaryButton} onPress={toggleInviteModal}>
                              <Text style={styles.secondaryButtonText}>{t("common.cancel")}</Text>
                          </TouchableOpacity>
                      </View>
                  </ScrollView>
              </View>
          </View>
      </Modal>

      <CategorySelectionModal isVisible={isCategorySelectionModalVisible} onClose={() => setIsCategorySelectionModalVisible(false)} categories={categories} selectedCategoryId={selectedCategoryId} onSelectCategory={(id) => setSelectedCategoryId(id)} />

      <Modal animationType="slide" transparent={true} visible={isCategoryModalVisible} onRequestClose={() => setIsCategoryModalVisible(false)}>
          <View style={styles.modalOverlay}>
              <View style={styles.modalContainer}>
                  <ScrollView style={{ width: "100%" }}>
                      <Text style={styles.modalTitle}>{editingCategory ? t("dashboardScreen.editCategory") : t("dashboardScreen.createCategory")}</Text>
                      <View style={styles.modalconteneur}>
                          <TextInput style={styles.modalInput} placeholder={t("dashboardScreen.categoryNamePlaceholder")} value={newCategoryName} onChangeText={setNewCategoryName} />
                          <TextInput style={styles.modalInput} placeholder={t("dashboardScreen.categoryDescriptionPlaceholder")} value={newCategoryDescription} onChangeText={setNewCategoryDescription} multiline />
                      </View>
                      <View style={styles.zonebutton}>
                          <TouchableOpacity style={styles.primaryButton} onPress={editingCategory ? handleUpdateCategory : handleCreateCategory}>
                              <Text style={styles.primaryButtonText}>{t("dashboardScreen.saveCategory")}</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.secondaryButton} onPress={() => { setIsCategoryModalVisible(false); setEditingCategory(null); setNewCategoryName(""); setNewCategoryDescription(""); }}>
                              <Text style={styles.secondaryButtonText}>{t("common.cancel")}</Text>
                          </TouchableOpacity>
                      </View>
                      <Text style={styles.modalSubtitle}>{t("dashboardScreen.manageCategories")}</Text>
                      {categories.map((cat) => (
                          <View key={cat.id} style={styles.categoryItem}>
                              <Text style={styles.categoryItemText}>{cat.name}</Text>
                              <View style={styles.categoryItemButtons}>
                                  <TouchableOpacity onPress={() => handleEditCategory(cat)} style={styles.editButton}>
                                      <Ionicons name="create-outline" size={20} color="#ad9407ff" />
                                  </TouchableOpacity>
                                  <TouchableOpacity onPress={() => handleDeleteCategory(cat.id, cat.name)} style={styles.deleteButton}>
                                      <Ionicons name="trash-outline" size={20} color="#dc3545" />
                                  </TouchableOpacity>
                              </View>
                          </View>
                      ))}
                  </ScrollView>
              </View>
          </View>
      </Modal>

      <EditEmployeeModal isVisible={isEditEmployeeModalVisible} onClose={() => setIsEditEmployeeModalVisible(false)} employeeDetails={editingEmployeeDetails} onSave={handleSaveEmployeeCategory} categories={categories} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#01091F",
        padding: 10,
        paddingTop: 50,
    },
    centered: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    errorText: {
        color: "red",
        textAlign: "center",
        marginTop: 20,
    },
    card: {
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 10,
        marginVertical: 8,
        shadowColor: "#d01919ff",
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 8,
    },
    subtitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#333",
        marginBottom: 15,
        textAlign: "center",
    },
    primaryButton: {
        backgroundColor: "#ad9407ff",
        padding: 15,
        borderRadius: 5,
        alignItems: "center",
        marginTop: 10,
        flexDirection: "row",
        justifyContent: "center",
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
    buttonIcon: {
        marginRight: 5,
    },
    topHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 10,
        marginBottom: 10,
    },
    headerLogo: {
        width: 100,
        height: 100,
        resizeMode: "contain",
    },
    greeting: {
        fontSize: 22,
        fontWeight: "bold",
        color: "#fff",
        textAlign: "right",
        flex: 1,
        marginRight: 10,
    },
    tipDetailsContainer: {
        alignItems: "center",
        marginBottom: 15,
    },
    tipAmount: {
        fontSize: 42,
        fontWeight: "bold",
        color: "#ad9407ff",
    },
    tipDate: {
        fontSize: 14,
        color: "#6c757d",
        marginTop: 5,
    },
    noTipText: {
        textAlign: "center",
        fontSize: 16,
        color: "#6c757d",
        marginVertical: 20,
    },
    separator: {
        height: 1,
        backgroundColor: "#e0e0e0",
        width: "80%",
        marginVertical: 15,
    },
    poolInfoText: {
        fontSize: 14,
        color: "#333",
        marginTop: 4,
    },
    legendContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "center",
        marginTop: 10,
    },
    legendItem: {
        flexDirection: "row",
        alignItems: "center",
        marginRight: 15,
        marginBottom: 5,
    },
    legendText: {
        fontSize: 12,
        color: "#333",
    },
    poolDetailsContainer: {
        padding: 5,
        backgroundColor: "#f9f9f9",
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#eee",
    },
    poolDetailText: {
        fontSize: 15,
        marginBottom: 5,
        color: "#333",
    },
    viewDetailsButton: {
        backgroundColor: "#ad9407ff",
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 5,
        marginTop: 10,
        alignItems: "center",
    },
    viewDetailsButtonText: {
        color: "#fff",
        fontSize: 15,
        fontWeight: "bold",
    },
    buttonGroup: {
        flexDirection: "row",
        justifyContent: "space-around",
        marginTop: 10,
        marginBottom: 10,
    },
    employeeListItem: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 10,
        paddingHorizontal: 15,
        backgroundColor: "#f0f0f0",
        borderRadius: 5,
        marginBottom: 10,
    },
    employeeInfoContainer: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
    },
    employeeActionsContainer: {
        flexDirection: "row",
        alignItems: "center",
    },
    employeeListItemText: {
        fontSize: 16,
        color: "#333",
        flex: 1,
    },
    employeeIcon: {
        marginRight: 8,
    },
    editButton: {
        padding: 5,
    },
    deleteButton: {
        padding: 5,
        marginLeft: 8,
    },
    noEmployeesText: {
        textAlign: "center",
        fontSize: 16,
        color: "#6c757d",
        marginVertical: 20,
    },
    modalOverlay: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0, 0, 0, 0.7)",
    },
    unlinkedModalContainer: {
        width: "90%",
        backgroundColor: "white",
        borderRadius: 10,
        padding: 20,
        alignItems: "center",
    },
    unlinkedModalText: {
        fontSize: 16,
        textAlign: "center",
        marginBottom: 20,
        color: "#333",
    },
    modalButtonGroup: {
        flexDirection: "row",
        justifyContent: "space-around",
        width: "100%",
        marginTop: 20,
    },
    primaryModalButton: {
        backgroundColor: "#dc3545",
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 5,
        alignItems: "center",
        flex: 1,
        marginHorizontal: 5,
    },
    primaryModalButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
    },
    secondaryModalButton: {
        backgroundColor: "#6c757d",
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 5,
        alignItems: "center",
        flex: 1,
        marginHorizontal: 5,
    },
    secondaryModalButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: "bold",
        color: "#333",
        marginBottom: 20,
    },
    modalContainer: {
        width: "95%",
        maxHeight: "80%",
        backgroundColor: "#ffffff",
        borderRadius: 10,
        padding: 20,
        alignItems: "center",
    },
    modalInput: {
        height: 45,
        borderColor: "gray",
        borderWidth: 1,
        paddingHorizontal: 10,
        backgroundColor: "#ffffff",
        borderRadius: 5,
        flex: 1,
    },
    emailInputContainer: {
        flexDirection: "row",
        alignItems: "center",
        width: "100%",
        marginBottom: 15,
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
    manageCategoriesButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#6c757d",
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 5,
        marginTop: 10,
        marginBottom: 20,
        width: "100%",
    },
    manageCategoriesButtonText: {
        color: "#fff",
        marginLeft: 10,
        fontWeight: "bold",
        fontSize: 16,
    },
    removeButton: {
        marginLeft: 10,
        padding: 5,
    },
    addButton: {
        flexDirection: "row",
        alignItems: "center",
        alignSelf: "flex-start",
        marginBottom: 20,
        marginTop: 5,
    },
    addButtonText: {
        color: "#ad9407ff",
        marginLeft: 10,
        fontSize: 16,
        fontWeight: "bold",
    },
    modalSubtitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#333",
        marginTop: 20,
        marginBottom: 10,
        alignSelf: "flex-start",
    },
    categoryItem: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        width: "100%",
        paddingVertical: 10,
        paddingHorizontal: 15,
        backgroundColor: "#f0f0f0",
        borderRadius: 5,
        marginBottom: 10,
    },
    categoryItemText: {
        fontSize: 16,
        color: "#333",
        flex: 1,
    },
    categoryItemButtons: {
        flexDirection: "row",
        alignItems: "center",
    },
    zonebutton: {
        flexDirection: "row",
        justifyContent: "space-around",
        width: "100%",
        marginTop: 20,
    },
    modalconteneur: {
        gap: 10,
    },
    addEmployeeButton: {
        backgroundColor: "#ad9407ff",
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 5,
        marginTop: 10,
        alignItems: "center",
        flexDirection: "row",
    },
    addEmployeeButtonText: {
        color: "#ffffff",
        fontWeight:"bold"
    }
});

export default DashboardScreen;
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, Alert, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute } from '@react-navigation/native';
import { getPoolReport, calculateDistribution } from '../../api/tip/tipApi';
import { useTranslation } from 'react-i18next';

const PoolDetailsScreen = ({ navigation }) => {
    const { t, i18n } = useTranslation();
    const route = useRoute();
    const { poolId } = route.params;
    const [poolDetails, setPoolDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchPoolDetails = async () => {
        setLoading(true);
        setError('');
        try {
            const report = await getPoolReport(poolId);
            setPoolDetails(report);
        } catch (err) {
            console.error("Failed to fetch pool details:", err);
            setError(`${t('poolDetailsScreen.failedToLoadDetails')}${err.message}`);
            Alert.alert(t('poolDetailsScreen.error'), `${t('poolDetailsScreen.failedToLoadDetails')}${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPoolDetails();
    }, [poolId]);

    const handleCalculateDistribution = async () => {
        setLoading(true);
        try {
            await calculateDistribution(poolId);
            Alert.alert(i18n.t('poolDetailsScreen.success'), i18n.t('poolDetailsScreen.distributionCalculatedAndEmailsSent'));
            fetchPoolDetails(); // Refresh data after calculation
        } catch (err) {
            console.error("Failed to calculate distribution:", err);
            Alert.alert(i18n.t('poolDetailsScreen.error'), `${i18n.t('poolDetailsScreen.failedToCalculateDistribution')}${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#0000ff" />
                <Text>{t('poolDetailsScreen.loadingPoolDetails')}</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.centered}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.primaryButton} onPress={fetchPoolDetails}>
                    <Text style={styles.primaryButtonText}>{t('poolDetailsScreen.retry')}</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (!poolDetails || !poolDetails.raw_report_data || poolDetails.raw_report_data.length === 0) {
        return (
            <View style={styles.centered}>
                <Text>{t('poolDetailsScreen.noDataFound')}</Text>
                <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.goBack()}>
                    <Text style={styles.primaryButtonText}>{t('poolDetailsScreen.back')}</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const poolInfo = poolDetails.pool_details;
    const isCalculated = poolDetails.raw_report_data.some(item => item.calculated_at);
    const poolCalculatedDate = isCalculated ? poolDetails.raw_report_data.find(item => item.calculated_at).calculated_at : null;

    return (
        <View style={styles.container}>
            <View style={styles.contneurButton1}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Image
                    source={require("../../../assets/logo/logoversion5.png")}
                    style={styles.logo}
                />
            </View>

            <View style={styles.headerContainer}>
                <Text style={styles.title}>
                    {t("poolDetailsScreen.poolDetails")}
                    {poolInfo.pool_name}
                </Text>
            </View>
            <View style={styles.detailConteneur}>
                <Text style={styles.detailText}>
                    {t("poolDetailsScreen.period")}
                    {new Date(poolInfo.start_date).toLocaleDateString()}
                    {t("poolDetailsScreen.to")}
                    {new Date(poolInfo.end_date).toLocaleDateString()}
                </Text>
                <Text style={styles.detailText}>
                    {t("poolDetailsScreen.totalAmount")}
                    {Number(poolInfo.total_amount).toFixed(2)} $
                </Text>
                <Text style={styles.detailText}>
                    {t("poolDetailsScreen.distributionModel")}
                    {poolInfo.distribution_model}
                </Text>

                {poolCalculatedDate && (
                    <Text style={styles.detailText}>
                        {t("poolDetailsScreen.calculatedOn")}
                        {new Date(poolCalculatedDate).toLocaleDateString()}
                    </Text>
                )}
            </View>

            <TouchableOpacity
                style={[
                    styles.primaryButton,
                    isCalculated && styles.disabledButton,
                ]}
                onPress={handleCalculateDistribution}
                disabled={isCalculated}
            >
                <Text style={styles.primaryButtonText}>
                    {t("poolDetailsScreen.calculateAndSendDistribution")}
                </Text>
            </TouchableOpacity>

            <Text style={styles.subtitle}>
                {t("poolDetailsScreen.distributionByEmployee")} ({poolDetails.raw_report_data.length})
            </Text>
            <ScrollView style={styles.employeeListScrollView}>
                {poolDetails.raw_report_data.map((item, index) => (
                    <View key={index} style={styles.employeeItem}>
                        <View>
                            <Text style={styles.employeeText}>
                                {item.first_name} {item.last_name} (
                                {item.category_name || "N/A"})
                            </Text>
                            {item.hours_worked && (
                                <Text style={styles.employeeText}>
                                    {t("poolDetailsScreen.hoursWorked")}
                                    {item.hours_worked}
                                </Text>
                            )}
                        </View>

                        {item.percentage_share && (
                            <Text style={styles.employeeText1}>
                                {item.percentage_share}%
                            </Text>
                        )}
                        {item.distributed_amount ? (
                            <Text style={styles.employeeText1}>
                                {`${item.distributed_amount} $`}
                            </Text>
                        ) : (
                            <Text style={[styles.employeeText1, styles.notAvailableText]}>
                                {t('poolDetailsScreen.notAvailable')}
                            </Text>
                        )}
                    </View>
                ))}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#01091F",
        paddingTop: 60,
        paddingHorizontal: 20,
    },
    contneurButton1: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    centered: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#01091F",
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#fff",
        marginLeft: 10,
        marginTop: 0,
    },
    detailText: {
        fontSize: 16,
        marginBottom: 5,
        color: "#fff",
    },
    subtitle: {
        fontSize: 20,
        fontWeight: "bold",
        marginTop: 20,
        marginBottom: 10,
        color: "#fff",
    },
    employeeItem: {
        flexDirection: "row",
        justifyContent: "space-between",
        backgroundColor: "#2a2a3e",
        padding: 6,
        borderRadius: 8,
        marginBottom: 3,
        borderWidth: 1,
        borderColor: "#1b2646ff",
        width: "100%",
        height: 70,
    },
    employeeText: {
        fontSize: 16,
        marginBottom: 3,
        color: "#fff",
    },
    employeeText1: {
        paddingTop: 15,
        width: "30%",
        fontSize: 14,
        color: "#fff",
        backgroundColor: "#ad9407ff",
        textAlign: "center",
        borderRadius: 10,
    },
    notAvailableText: {
        backgroundColor: '#555',
        color: '#ccc',
    },
    errorText: {
        color: "#dc3545",
        textAlign: "center",
        marginTop: 20,
    },
    headerContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 20,
        marginTop: 0,
    },
    logo: {
        width: 100,
        height: 100,
        resizeMode: "contain",
    },
    primaryButton: {
        backgroundColor: "#ad9407ff",
        padding: 15,
        borderRadius: 8,
        alignItems: "center",
        marginTop: 20,
        marginBottom: 20,
    },
    primaryButtonText: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "bold",
    },
    disabledButton: {
        backgroundColor: "#555",
    },
    statusCalculated: {
        color: "green",
        fontSize: 16,
        fontWeight: "bold",
        marginTop: 5,
    },
    statusNotCalculated: {
        color: "red",
        fontSize: 16,
        fontWeight: "bold",
        marginTop: 5,
    },
    backButton: {
        padding: 12,
        backgroundColor: "rgba(27, 38, 70, 0.7)",
        borderRadius: 50,
        height: 50,
        width: 80,
    },
    employeeListScrollView: {
        flex: 1,
    },
    detailConteneur: {
        backgroundColor: "rgba(27, 38, 70, 0.7)",
        padding: 10,
        borderRadius:10,
    },
});

export default PoolDetailsScreen;
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, Button, Image } from 'react-native';
import { getEmployeeTipHistory } from '../../api/tip/tipApi';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

const EmployeeTipHistoryScreen = ({ navigation }) => {
    const { t } = useTranslation();
    const [tips, setTips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const isFocused = useIsFocused();

    const fetchTipHistory = async () => {
        setLoading(true);
        setError('');
        try {
            const userString = await AsyncStorage.getItem('user');
            const user = JSON.parse(userString);
            if (user && user.id) {
                const history = await getEmployeeTipHistory(user.id);
                setTips(history);
            } else {
                setError(t('employeeTipHistory.userIdNotFound'));
            }
        } catch (err) {
            console.error(t('employeeTipHistory.failedToLoadHistory'), err);
            setError(`${t('employeeTipHistory.failedToLoadHistory')}${err.message}`);
            Alert.alert(t('employeeTipHistory.error'), `${t('employeeTipHistory.failedToLoadHistory')}${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isFocused) {
            fetchTipHistory();
        }
    }, [isFocused]);

    const renderTipItem = ({ item }) => (
        <View style={styles.tipItemContainer}>
            <View style={styles.amountContainer}>
                <Ionicons name="cash-outline" size={24} color='#ad9407ff' />
                <Text style={styles.tipAmount}>{item.distributed_amount} $</Text>
            </View>
            <View style={styles.detailsContainer}>
                <View style={styles.detailRow}>
                    <Ionicons name="briefcase-outline" size={16} color='#6c757d' style={styles.icon} />
                    <Text style={styles.detailText}>{item.pool_name}</Text>
                </View>
                <View style={styles.detailRow}>
                    <Ionicons name="calendar-outline" size={16} color='#6c757d' style={styles.icon} />
                    <Text style={styles.detailText}>{new Date(item.start_date).toLocaleDateString()} {t('employeeTipHistory.to')} {new Date(item.end_date).toLocaleDateString()}</Text>
                </View>
                <View style={styles.detailRow}>
                    <Ionicons name="checkmark-circle-outline" size={16} color='#6c757d' style={styles.icon} />
                    <Text style={styles.detailText}>{t('employeeTipHistory.calculatedOn')} {new Date(item.calculated_at).toLocaleDateString()}</Text>
                </View>
            </View>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#ad9407ff" />
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.centered}>
                <Text style={styles.errorText}>{error}</Text>
                <Button title={t('employeeTipHistory.retry')} onPress={fetchTipHistory} color="#ad9407ff" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.titleContainer}>
                <Image source={require('../../../assets/logo/logoversion5.png')} style={styles.logo} />
                <Text style={styles.title}>{t('employeeTipHistory.myTipHistory')} ({tips.length})</Text>
            </View>
            {tips.length === 0 ? (
                <View style={styles.centeredContent}>
                    <Text style={styles.noTipsText}>{t('employeeTipHistory.noTipsRecorded')}</Text>
                </View>
            ) : (
                <FlatList
                    data={tips}
                    keyExtractor={(item, index) => item.id ? item.id.toString() : index.toString()}
                    renderItem={renderTipItem}
                    contentContainerStyle={styles.listContent}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 60,
        paddingHorizontal: 15,
        backgroundColor: '#01091F',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#01091F',
    },
    centeredContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start', // Aligned to the left
        marginBottom: 25,
    },
    logo: {
        width: 60,
        height: 60,
        marginRight: 10,
        resizeMode: 'contain', // Ensures logo scales nicely
    },
    title: {
        fontSize: 21,
        fontWeight: 'bold',
        color: '#fff',
    },
    tipItemContainer: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 15,
        marginBottom: 15,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    amountContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingRight: 15,
        borderRightWidth: 1,
        borderRightColor: '#eee',
    },
    tipAmount: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#ad9407ff',
        marginTop: 5,
    },
    detailsContainer: {
        flex: 1,
        paddingLeft: 15,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    icon: {
        marginRight: 8,
    },
    detailText: {
        fontSize: 14,
        color: '#333',
        flexShrink: 1,
    },
    listContent: {
        paddingBottom: 20,
    },
    noTipsText: {
        textAlign: 'center',
        fontSize: 16,
        color: '#ccc',
    },
    errorText: {
        color: '#dc3545',
        textAlign: 'center',
        marginBottom: 20,
        fontSize: 16,
    },
});

export default EmployeeTipHistoryScreen;
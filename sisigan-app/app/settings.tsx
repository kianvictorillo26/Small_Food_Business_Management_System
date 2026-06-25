import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    ScrollView,
    StatusBar,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type SettingRowProps = {
    icon: string;
    label: string;
    value?: string;
    onPress?: () => void;
    rightElement?: React.ReactNode;
    isLast?: boolean;
};

const SettingRow = ({ icon, label, value, onPress, rightElement, isLast }: SettingRowProps) => (
    <TouchableOpacity
        style={[styles.settingRow, !isLast && styles.settingRowBorder]}
        onPress={onPress}
        activeOpacity={onPress ? 0.6 : 1}
    >
        <View style={styles.settingLeft}>
            <View style={styles.settingIconBox}>
                <MaterialCommunityIcons name={icon as any} size={20} color="#800000" />
            </View>
            <Text style={styles.settingLabel}>{label}</Text>
        </View>
        <View style={styles.settingRight}>
            {rightElement ?? (
                <>
                    {value ? <Text style={styles.settingValue}>{value}</Text> : null}
                    {onPress && <MaterialCommunityIcons name="chevron-right" size={20} color="#ccc" />}
                </>
            )}
        </View>
    </TouchableOpacity>
);

const SectionHeader = ({ title }: { title: string }) => (
    <Text style={styles.sectionHeader}>{title}</Text>
);

const Settings = () => {
    const router = useRouter();

    const [businessName, setBusinessName] = useState('The Sisig Spot By Kian');
    const [contactNumber, setContactNumber] = useState('');
    const [address, setAddress] = useState('');
    const [taxRate, setTaxRate] = useState('12');
    const [lowStockThreshold, setLowStockThreshold] = useState('5');
    const [printReceipt, setPrintReceipt] = useState(false);
    const [lowStockAlert, setLowStockAlert] = useState(true);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [editingField, setEditingField] = useState<string | null>(null);

    const openEditDialog = (field: string, current: string, setter: (v: string) => void, label: string) => {
        Alert.prompt(
            `Edit ${label}`,
            '',
            (text) => {
                if (text !== null) setter(text.trim() || current);
            },
            'plain-text',
            current
        );
    };

    const handleClearData = () => {
        Alert.alert(
            'Clear All Data',
            'This will permanently delete all orders and sales history. This cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => Alert.alert('Data cleared.') },
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#800000" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Settings</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>

                {/* Business Info */}
                <SectionHeader title="Business Information" />
                <View style={styles.card}>
                    <SettingRow
                        icon="store"
                        label="Business Name"
                        value={businessName}
                        onPress={() =>
                            openEditDialog('businessName', businessName, setBusinessName, 'Business Name')
                        }
                    />
                    <SettingRow
                        icon="phone"
                        label="Contact Number"
                        value={contactNumber || 'Not set'}
                        onPress={() =>
                            openEditDialog('contactNumber', contactNumber, setContactNumber, 'Contact Number')
                        }
                    />
                    <SettingRow
                        icon="map-marker"
                        label="Address"
                        value={address || 'Not set'}
                        onPress={() =>
                            openEditDialog('address', address, setAddress, 'Address')
                        }
                        isLast
                    />
                </View>

                {/* Order & Sales */}
                <SectionHeader title="Order & Sales" />
                <View style={styles.card}>
                    <SettingRow
                        icon="percent"
                        label="Tax Rate (%)"
                        value={`${taxRate}%`}
                        onPress={() =>
                            openEditDialog('taxRate', taxRate, setTaxRate, 'Tax Rate (%)')
                        }
                    />
                    <SettingRow
                        icon="receipt"
                        label="Auto-Print Receipt"
                        rightElement={
                            <Switch
                                value={printReceipt}
                                onValueChange={setPrintReceipt}
                                trackColor={{ false: '#e0e0e0', true: '#800000' }}
                                thumbColor="#fff"
                            />
                        }
                        isLast
                    />
                </View>

                {/* Inventory */}
                <SectionHeader title="Inventory" />
                <View style={styles.card}>
                    <SettingRow
                        icon="package-variant-closed"
                        label="Low Stock Alert"
                        rightElement={
                            <Switch
                                value={lowStockAlert}
                                onValueChange={setLowStockAlert}
                                trackColor={{ false: '#e0e0e0', true: '#800000' }}
                                thumbColor="#fff"
                            />
                        }
                    />
                    <SettingRow
                        icon="alert-circle-outline"
                        label="Low Stock Threshold"
                        value={`${lowStockThreshold} units`}
                        onPress={() =>
                            openEditDialog(
                                'lowStockThreshold',
                                lowStockThreshold,
                                setLowStockThreshold,
                                'Low Stock Threshold'
                            )
                        }
                        isLast
                    />
                </View>

                {/* Notifications */}
                <SectionHeader title="Notifications" />
                <View style={styles.card}>
                    <SettingRow
                        icon="volume-high"
                        label="Sound Effects"
                        rightElement={
                            <Switch
                                value={soundEnabled}
                                onValueChange={setSoundEnabled}
                                trackColor={{ false: '#e0e0e0', true: '#800000' }}
                                thumbColor="#fff"
                            />
                        }
                        isLast
                    />
                </View>

                {/* Data Management */}
                <SectionHeader title="Data Management" />
                <View style={styles.card}>
                    <SettingRow
                        icon="delete-forever"
                        label="Clear All Orders & Sales"
                        onPress={handleClearData}
                        isLast
                    />
                </View>

                {/* About */}
                <SectionHeader title="About" />
                <View style={styles.card}>
                    <SettingRow icon="information-outline" label="App Version" value="1.0.0" />
                    <SettingRow icon="account-circle-outline" label="Developer" value="Kian Victorillo" isLast />
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        backgroundColor: '#800000',
        paddingHorizontal: 16,
        paddingVertical: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '700',
    },
    scroll: {
        flex: 1,
    },
    sectionHeader: {
        fontSize: 13,
        fontWeight: '600',
        color: '#800000',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginTop: 24,
        marginBottom: 8,
        marginHorizontal: 20,
    },
    card: {
        backgroundColor: '#fff',
        marginHorizontal: 16,
        borderRadius: 14,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 2,
    },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        paddingHorizontal: 16,
    },
    settingRowBorder: {
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    settingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    settingIconBox: {
        width: 36,
        height: 36,
        backgroundColor: '#FFE4B5',
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    settingLabel: {
        fontSize: 15,
        color: '#222',
        fontWeight: '500',
    },
    settingRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        maxWidth: '45%',
    },
    settingValue: {
        fontSize: 14,
        color: '#888',
        textAlign: 'right',
    },
});

export default Settings;

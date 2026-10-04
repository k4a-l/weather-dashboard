import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Alert,
} from "react-native";
import { CityConfig } from "../types";
import { CITIES } from "../constants/cities";

interface Props {
    visible: boolean;
    currentCity: CityConfig;
    onClose: () => void;
    onSave: (city: CityConfig) => void;
}

export const LocationSettingsModal: React.FC<Props> = ({
    visible,
    currentCity,
    onClose,
    onSave,
}) => {
    const [name, setName] = useState(currentCity.name);
    const [latitude, setLatitude] = useState(currentCity.latitude.toString());
    const [longitude, setLongitude] = useState(currentCity.longitude.toString());
    const [jmaOfficeCode, setJmaOfficeCode] = useState(currentCity.jmaOfficeCode);
    const [jmaAreaCode, setJmaAreaCode] = useState(currentCity.jmaAreaCode);

    const handleSelectPreset = (preset: CityConfig) => {
        setName(preset.name);
        setLatitude(preset.latitude.toString());
        setLongitude(preset.longitude.toString());
        setJmaOfficeCode(preset.jmaOfficeCode);
        setJmaAreaCode(preset.jmaAreaCode);
    };

    const handleSave = () => {
        const lat = parseFloat(latitude);
        const lon = parseFloat(longitude);

        if (!name.trim()) {
            Alert.alert("エラー", "地域名を入力してください。");
            return;
        }
        if (isNaN(lat) || lat < -90 || lat > 90) {
            Alert.alert("エラー", "正しい緯度（-90〜90）を入力してください。");
            return;
        }
        if (isNaN(lon) || lon < -180 || lon > 180) {
            Alert.alert("エラー", "正しい経度（-180〜180）を入力してください。");
            return;
        }

        const customCity: CityConfig = {
            id: `custom_${Date.now()}`,
            name: name.trim(),
            latitude: lat,
            longitude: lon,
            jmaOfficeCode: jmaOfficeCode.trim() || "130000",
            jmaAreaCode: jmaAreaCode.trim() || "130010",
        };

        onSave(customCity);
        onClose();
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.overlay}>
                <View style={styles.modalContainer}>
                    <View style={styles.header}>
                        <Text style={styles.title}>地域の設定</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                            <Text style={styles.closeBtnText}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.scroll}>
                        <Text style={styles.sectionTitle}>プリセットから選択</Text>
                        <View style={styles.presetContainer}>
                            {CITIES.map((c) => (
                                <TouchableOpacity
                                    key={c.id}
                                    style={styles.presetChip}
                                    onPress={() => handleSelectPreset(c)}
                                >
                                    <Text style={styles.presetText}>{c.name}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={styles.sectionTitle}>任意の地域・座標を設定</Text>

                        <Text style={styles.label}>地域名 / 表示ラベル</Text>
                        <TextInput
                            style={styles.input}
                            value={name}
                            onChangeText={setName}
                            placeholder="例: 世田谷区、軽井沢、自宅 など"
                        />

                        <View style={styles.row}>
                            <View style={styles.col}>
                                <Text style={styles.label}>緯度 (Latitude)</Text>
                                <TextInput
                                    style={styles.input}
                                    value={latitude}
                                    onChangeText={setLatitude}
                                    placeholder="例: 35.6895"
                                    keyboardType="numeric"
                                />
                            </View>
                            <View style={styles.col}>
                                <Text style={styles.label}>経度 (Longitude)</Text>
                                <TextInput
                                    style={styles.input}
                                    value={longitude}
                                    onChangeText={setLongitude}
                                    placeholder="例: 139.6917"
                                    keyboardType="numeric"
                                />
                            </View>
                        </View>

                        <View style={styles.row}>
                            <View style={styles.col}>
                                <Text style={styles.label}>気象庁オフィスコード</Text>
                                <TextInput
                                    style={styles.input}
                                    value={jmaOfficeCode}
                                    onChangeText={setJmaOfficeCode}
                                    placeholder="東京: 130000"
                                    keyboardType="numeric"
                                />
                            </View>
                            <View style={styles.col}>
                                <Text style={styles.label}>気象庁エリアコード</Text>
                                <TextInput
                                    style={styles.input}
                                    value={jmaAreaCode}
                                    onChangeText={setJmaAreaCode}
                                    placeholder="東京地方: 130010"
                                    keyboardType="numeric"
                                />
                            </View>
                        </View>

                        <Text style={styles.helpText}>
                            ※緯度・経度を設定すると、Open-MeteoのJMAモデルおよびECMWFモデルはピンポイントの座標で計算されます。
                        </Text>
                    </ScrollView>

                    <View style={styles.footer}>
                        <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                            <Text style={styles.cancelButtonText}>キャンセル</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                            <Text style={styles.saveButtonText}>この地域で適用</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "flex-end",
    },
    modalContainer: {
        backgroundColor: "#FFFFFF",
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 20,
        maxHeight: "85%",
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#111827",
    },
    closeBtn: {
        padding: 6,
    },
    closeBtnText: {
        fontSize: 18,
        color: "#6B7280",
    },
    scroll: {
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: "bold",
        color: "#374151",
        marginTop: 8,
        marginBottom: 8,
    },
    presetContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 6,
        marginBottom: 12,
    },
    presetChip: {
        backgroundColor: "#F3F4F6",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#E5E7EB",
    },
    presetText: {
        fontSize: 13,
        color: "#374151",
        fontWeight: "500",
    },
    label: {
        fontSize: 12,
        color: "#4B5563",
        fontWeight: "600",
        marginBottom: 4,
        marginTop: 6,
    },
    input: {
        backgroundColor: "#F9FAFB",
        borderWidth: 1,
        borderColor: "#D1D5DB",
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 8,
        fontSize: 14,
        color: "#111827",
    },
    row: {
        flexDirection: "row",
        gap: 10,
    },
    col: {
        flex: 1,
    },
    helpText: {
        fontSize: 11,
        color: "#6B7280",
        marginTop: 10,
        lineHeight: 16,
    },
    footer: {
        flexDirection: "row",
        gap: 12,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: "#E5E7EB",
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: "#F3F4F6",
        alignItems: "center",
    },
    cancelButtonText: {
        color: "#4B5563",
        fontWeight: "bold",
    },
    saveButton: {
        flex: 2,
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: "#2563EB",
        alignItems: "center",
    },
    saveButtonText: {
        color: "#FFFFFF",
        fontWeight: "bold",
    },
});

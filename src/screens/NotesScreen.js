import { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { initNotesTable, fetchNotes, insertNote, removeNote, resetNotes } from '../utils/db';


const BG = "#DD3A43";
const ACCENT = "#B3E5FC";

export default function NotesScreen() {
    const [note, setNote] = useState("");
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                //initialize notes
                //get notes
            } catch (e) {
                console.warn("DB init/load error", e);
                Alert.alert("Database error", String(e));
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const loadNotes = async () => {
        const rows = await fetchNotes();
        setNotes(rows || []);
    };

    const onAdd = async () => {
        const trimmed = note.trim();

        if (!trimmed) {
            Alert.alert("Empty note", "Type something first :), please.");
            return;
        }
        try {
            await insertNote(trimmed);
            setNote("");
            await loadNotes();
        } catch (e) {
            console.warn("Error inserting or loading", e);
        }
    };

    const onDelete = async (id) => {
        try {
            await removeNote(id);
            await loadNotes();
        } catch (e) {
            console.warn("Error deleting", e);
        }
    }

    const onReset = async () => {
        try {
            await resetNotes();
            await loadNotes();
        } catch (e) {
            console.warn("reset error:", e);
        }
    };

    return (
        <KeyboardAvoidingView style={{ flex: 1, backgroundColor: BG }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
            <View style={styles.container}>
                <Text style={styles.title}>Notes (SQLite)</Text>

                <View style={styles.row}>
                    <TextInput
                        style={styles.input}
                        placeholder="Write a note..."
                        placeholderTextColor="#9CCFEA"
                        value={note}
                        onChangeText={setNote}
                    />
                    <TouchableOpacity style={styles.addBtn} onPress={onAdd}>
                        <Text style={styles.addText}>Add</Text>
                    </TouchableOpacity>
                </View>

                <FlatList
                    data={notes}
                    keyExtractor={(item) => String(item.id)}
                    refreshing={loading}
                    onRefresh={loadNotes}
                    contentContainerStyle={{ paddingTop: 8 }}
                    renderItem={({ item }) => (
                        <View style={styles.card}>
                            <Text style={styles.cardText}>{item.note}</Text>
                            <TouchableOpacity style={styles.deleteBtn} onPress={() => onDelete(item.id)}>
                                <Text style={styles.deleteText}>Delete</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                    ListEmptyComponent={!loading && <Text style={styles.empty}>No notes yet.</Text>}
                />

                <TouchableOpacity style={styles.resetBtn} onPress={onReset}>
                    <Text style={styles.resetText}>Reset all</Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20
    },
    title: {
        color: "#fff",
        fontSize: 28,
        fontFamily: "SourGummy_600SemiBold",
        marginBottom: 10
    },
    row: {
        flexDirection: "row",
        gap: 10,
        alignItems: "center"
    },
    input: {
        flex: 1,
        backgroundColor: "#fff",
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderWidth: 2,
        borderColor: "transparent",
        fontSize: 16,
    },
    addBtn: {
        backgroundColor: ACCENT,
        paddingVertical: 12,
        paddingHorizontal: 18,
        borderRadius: 16,
        shadowColor: "#000",
        shadowOpacity: 0.15,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 8,
        elevation: 3,
    },
    addText: {
        color: BG,
        fontWeight: "800"
    },
    card: {
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 14,
        marginTop: 10,
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 8,
        elevation: 3,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    cardText: {
        flex: 1,
        marginRight: 10,
        fontSize: 16,
        color: "#222"
    },
    deleteBtn: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 999,
        backgroundColor: "#FFE4E7"
    },
    deleteText: {
        color: "#B00020",
        fontWeight: "700"
    },
    empty: {
        color: "#fff",
        opacity: 0.9, marginTop: 20,
        fontFamily: "SourGummy_400Regular"
    },
    resetBtn: {
        alignSelf: "center",
        marginTop: 14,
        padding: 10
    },
    resetText: {
        color: "#fff",
        textDecorationLine: "underline"
    },
});



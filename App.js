// --- LÍNEA CLAVE PARA QUE FUNCIONE EN MÓVIL ---
import 'react-native-gesture-handler';

import React, { useState, useEffect } from 'react';
import {
    StyleSheet, Text, View, TextInput, TouchableOpacity, KeyboardAvoidingView,
    Platform, Alert, FlatList, Modal, Button
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';

// --- CONFIGURACIÓN DE CONEXIÓN ---
const IP_SERVIDOR = Platform.OS === 'web' ? 'localhost' : '192.168.1.121';
const API_URL = `http://${IP_SERVIDOR}:3000`;


// --- PANTALLA DE LOGIN ---
function LoginScreen({ navigation }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async () => {
        if (!username || !password) {
            Alert.alert('Error', 'Por favor, ingresa tu usuario y contraseña.');
            return;
        }
        try {
            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });
            const data = await response.json();
            if (data.success) {
                navigation.replace('Home', { user: data.user });
            } else {
                Alert.alert('Error de inicio de sesión', data.message);
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error de conexión', 'No se pudo conectar con el servidor.');
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.container}
        >
            <View style={styles.inner}>
                <Text style={styles.title}>Iniciar Sesión</Text>
                <TextInput
                    placeholder="Usuario"
                    style={styles.input}
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                />
                <TextInput
                    placeholder="Contraseña"
                    style={styles.input}
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                />
                <TouchableOpacity style={styles.button} onPress={handleLogin}>
                    <Text style={styles.buttonText}>Entrar</Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

// --- PANTALLA DASHBOARD ALUMNO ---
function AlumnoDashboard({ user }) {
    const [calificaciones, setCalificaciones] = useState([]);
    useEffect(() => {
        const fetchCalificaciones = async () => {
            try {
                const response = await fetch(`${API_URL}/mis-calificaciones/${user.id_user}`);
                const data = await response.json();
                if (data.success) {
                    setCalificaciones(data.calificaciones);
                } else {
                    Alert.alert('Error', 'No se pudieron cargar tus calificaciones.');
                }
            } catch (error) {
                Alert.alert('Error', 'Error de conexión al buscar calificaciones.');
            }
        };
        fetchCalificaciones();
    }, [user]);

    return (
        <View style={styles.inner}>
            <Text style={styles.title}>Mis Calificaciones</Text>
            <FlatList
                data={calificaciones}
                keyExtractor={(item) => item.materia}
                renderItem={({ item }) => (
                    <View style={styles.calificacionRow}>
                        <Text style={styles.materiaText}>{item.materia}</Text>
                        <Text style={styles.calificacionText}>{item.calificacion}</Text>
                    </View>
                )}
            />
        </View>
    );
}

// --- PANTALLA DASHBOARD PROFESOR (CRUD COMPLETO) ---
function ProfesorDashboard() {
    // Estados principales
    const [alumnos, setAlumnos] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Estados para Modales
    const [califModalVisible, setCalifModalVisible] = useState(false);
    const [addAlumnoModalVisible, setAddAlumnoModalVisible] = useState(false);
    const [editAlumnoModalVisible, setEditAlumnoModalVisible] = useState(false);
    
    // Estados para datos temporales
    const [selectedAlumno, setSelectedAlumno] = useState(null);
    const [calificaciones, setCalificaciones] = useState([]);
    const [newAlumnoData, setNewAlumnoData] = useState({ nombre: '', apellido: '', username: '', password: '' });
    const [editingAlumnoData, setEditingAlumnoData] = useState(null);

    // Estados para formulario de calificaciones
    const [materia, setMateria] = useState('');
    const [calificacion, setCalificacion] = useState('');
    const [isEditingCalif, setIsEditingCalif] = useState(false);
    const [materiaOriginal, setMateriaOriginal] = useState('');

    // --- Lógica de Datos ---
    const fetchAlumnos = async () => {
        try {
            const response = await fetch(`${API_URL}/alumnos`);
            const data = await response.json();
            if (data.success) setAlumnos(data.alumnos);
            else Alert.alert('Error', 'No se pudo cargar la lista de alumnos.');
        } catch (error) {
            Alert.alert('Error', 'Error de conexión al buscar alumnos.');
        }
    };

    useEffect(() => { fetchAlumnos(); }, []);

    const refrescarCalificaciones = async (id_alumno) => {
        try {
            const response = await fetch(`${API_URL}/calificaciones/${id_alumno}`);
            const data = await response.json();
            if (data.success) setCalificaciones(data.calificaciones);
        } catch (error) {
            Alert.alert('Error', 'No se pudieron refrescar las calificaciones.');
        }
    };
    
    // --- Manejadores de Eventos (Alumnos) ---
    const handleAgregarAlumno = async () => {
        const { nombre, apellido, username, password } = newAlumnoData;
        if (!nombre || !apellido || !username || !password) {
            Alert.alert('Error', 'Todos los campos son requeridos.');
            return;
        }
        try {
            const response = await fetch(`${API_URL}/alumnos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newAlumnoData),
            });
            const data = await response.json();
            if (data.success) {
                Alert.alert('Éxito', 'Alumno agregado correctamente.');
                setAddAlumnoModalVisible(false);
                setNewAlumnoData({ nombre: '', apellido: '', username: '', password: '' });
                await fetchAlumnos();
            } else {
                Alert.alert('Error', data.message);
            }
        } catch (error) { Alert.alert('Error', 'No se pudo agregar el alumno.'); }
    };

    const handleUpdateAlumno = async () => {
        const { nombre, apellido, username } = editingAlumnoData;
        if (!nombre || !apellido || !username) {
            Alert.alert('Error', 'Nombre, apellido y username son requeridos.');
            return;
        }
        try {
            const response = await fetch(`${API_URL}/alumnos/${editingAlumnoData.id_user}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre, apellido, username }),
            });
            const data = await response.json();
            if (data.success) {
                Alert.alert('Éxito', 'Alumno actualizado correctamente.');
                setEditAlumnoModalVisible(false);
                await fetchAlumnos();
            } else {
                Alert.alert('Error', data.message);
            }
        } catch (error) { Alert.alert('Error', 'No se pudo actualizar el alumno.'); }
    };
    
    const handleDeleteAlumno = async (alumno) => {
        // Se elimina el Alert.alert de confirmación para que la acción sea directa
        try {
            const response = await fetch(`${API_URL}/alumnos/${alumno.id_user}`, { method: 'DELETE' });
            const data = await response.json();
            if (data.success) {
                Alert.alert('Éxito', 'Alumno eliminado.');
                await fetchAlumnos();
            } else {
                Alert.alert('Error', data.message);
            }
        } catch (error) { Alert.alert('Error', 'No se pudo eliminar al alumno.'); }
    };

    // --- Manejadores de Eventos (Calificaciones) ---
    const handleOpenCalifModal = async (alumno) => {
        setSelectedAlumno(alumno);
        await refrescarCalificaciones(alumno.id_user);
        setCalifModalVisible(true);
    };
    const handleAgregarCalificacion = async () => {
        if (!materia || !calificacion) return;
        try {
            const response = await fetch(`${API_URL}/calificaciones`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id_alumno: selectedAlumno.id_user, materia, calificacion: parseInt(calificacion) }),
            });
            const data = await response.json();
            if (data.success) {
                await refrescarCalificaciones(selectedAlumno.id_user);
                setMateria('');
                setCalificacion('');
            } else { Alert.alert('Error', data.message); }
        } catch (error) { Alert.alert('Error', 'No se pudo agregar la calificación.'); }
    };
    const handleActualizarCalificacion = async () => {
        try {
            const response = await fetch(`${API_URL}/calificaciones`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id_alumno: selectedAlumno.id_user, materia: materiaOriginal, calificacion: parseInt(calificacion) }),
            });
            const data = await response.json();
            if (data.success) {
                await refrescarCalificaciones(selectedAlumno.id_user);
                setMateria('');
                setCalificacion('');
                setIsEditingCalif(false);
            } else { Alert.alert('Error', data.message); }
        } catch (error) { Alert.alert('Error', 'No se pudo actualizar la calificación.'); }
    };
    const handleEliminarCalificacion = async (materia) => {
        try {
            const url = `${API_URL}/calificaciones?id_alumno=${selectedAlumno.id_user}&materia=${encodeURIComponent(materia)}`;
            const response = await fetch(url, { method: 'DELETE' });
            const data = await response.json();
            if (data.success) await refrescarCalificaciones(selectedAlumno.id_user);
            else Alert.alert('Error al eliminar', data.message);
        } catch (error) { Alert.alert('Error de Red', `No se pudo eliminar la calificación.`); }
    };

    const filteredAlumnos = alumnos.filter(a =>
        `${a.nombre} ${a.apellido}`.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <View style={styles.inner}>
            <Text style={styles.title}>Panel del Profesor</Text>
            <TouchableOpacity style={[styles.button, { marginBottom: 20, backgroundColor: '#28a745' }]} onPress={() => setAddAlumnoModalVisible(true)}>
                <Text style={styles.buttonText}>Agregar Alumno</Text>
            </TouchableOpacity>
            <TextInput
                placeholder="Buscar alumno..."
                style={styles.input}
                value={searchTerm}
                onChangeText={setSearchTerm}
            />
            <FlatList
                data={filteredAlumnos}
                keyExtractor={(item) => item.id_user.toString()}
                renderItem={({ item }) => (
                    <View style={styles.alumnoRow}>
                        <Text style={styles.alumnoNameText}>{item.nombre} {item.apellido}</Text>
                        <View style={styles.alumnoActionsContainer}>
                           <TouchableOpacity style={styles.actionButtonSmall} onPress={() => handleOpenCalifModal(item)}>
                               <Text style={styles.actionButtonTextSmall}>Notas</Text>
                           </TouchableOpacity>
                           <TouchableOpacity style={[styles.actionButtonSmall, styles.editButton]} onPress={() => { setEditingAlumnoData(item); setEditAlumnoModalVisible(true); }}>
                               <Text style={styles.actionButtonTextSmall}>Editar</Text>
                           </TouchableOpacity>
                           <TouchableOpacity style={[styles.actionButtonSmall, styles.deleteButton]} onPress={() => handleDeleteAlumno(item)}>
                               <Text style={styles.actionButtonTextSmall}>Eliminar</Text>
                           </TouchableOpacity>
                        </View>
                    </View>
                )}
            />

            {/* Modal para Agregar Alumno */}
            <Modal visible={addAlumnoModalVisible} animationType="slide" onRequestClose={() => setAddAlumnoModalVisible(false)}>
                <View style={styles.modalContent}>
                    <Text style={styles.title}>Agregar Nuevo Alumno</Text>
                    <TextInput placeholder="Nombre" style={styles.input} value={newAlumnoData.nombre} onChangeText={(text) => setNewAlumnoData({...newAlumnoData, nombre: text})} />
                    <TextInput placeholder="Apellido" style={styles.input} value={newAlumnoData.apellido} onChangeText={(text) => setNewAlumnoData({...newAlumnoData, apellido: text})} />
                    <TextInput placeholder="Nombre de Usuario" style={styles.input} value={newAlumnoData.username} onChangeText={(text) => setNewAlumnoData({...newAlumnoData, username: text})} autoCapitalize="none" />
                    <TextInput placeholder="Contraseña" style={styles.input} value={newAlumnoData.password} onChangeText={(text) => setNewAlumnoData({...newAlumnoData, password: text})} secureTextEntry />
                    <TouchableOpacity style={styles.button} onPress={handleAgregarAlumno}>
                        <Text style={styles.buttonText}>Guardar Alumno</Text>
                    </TouchableOpacity>
                    <View style={{marginTop: 20}}><Button title="Cancelar" onPress={() => setAddAlumnoModalVisible(false)} color="#6c757d"/></View>
                </View>
            </Modal>
            
            {/* Modal para Editar Alumno */}
            {editingAlumnoData && (
                <Modal visible={editAlumnoModalVisible} animationType="slide" onRequestClose={() => setEditAlumnoModalVisible(false)}>
                    <View style={styles.modalContent}>
                        <Text style={styles.title}>Editar Alumno</Text>
                        <TextInput placeholder="Nombre" style={styles.input} value={editingAlumnoData.nombre} onChangeText={(text) => setEditingAlumnoData({...editingAlumnoData, nombre: text})} />
                        <TextInput placeholder="Apellido" style={styles.input} value={editingAlumnoData.apellido} onChangeText={(text) => setEditingAlumnoData({...editingAlumnoData, apellido: text})} />
                        <TextInput placeholder="Nombre de Usuario" style={styles.input} value={editingAlumnoData.username} onChangeText={(text) => setEditingAlumnoData({...editingAlumnoData, username: text})} autoCapitalize="none" />
                        <TouchableOpacity style={styles.button} onPress={handleUpdateAlumno}>
                            <Text style={styles.buttonText}>Guardar Cambios</Text>
                        </TouchableOpacity>
                        <View style={{marginTop: 20}}><Button title="Cancelar" onPress={() => setEditAlumnoModalVisible(false)} color="#6c757d"/></View>
                    </View>
                </Modal>
            )}

            {/* Modal para Calificaciones */}
            {selectedAlumno && (
                <Modal visible={califModalVisible} animationType="slide" onRequestClose={() => setCalifModalVisible(false)}>
                    <View style={styles.modalContent}>
                        <Text style={styles.title}>{selectedAlumno.nombre} {selectedAlumno.apellido}</Text>
                        <View style={styles.formContainer}>
                            <TextInput placeholder="Materia" style={styles.input} value={materia} onChangeText={setMateria} editable={!isEditingCalif}/>
                            <TextInput placeholder="Calificación" style={styles.input} value={calificacion} onChangeText={setCalificacion} keyboardType="numeric"/>
                            <TouchableOpacity style={[styles.button, {backgroundColor: isEditingCalif ? '#28a745' : '#007bff'}]} onPress={isEditingCalif ? handleActualizarCalificacion : handleAgregarCalificacion}>
                                <Text style={styles.buttonText}>{isEditingCalif ? 'Actualizar Calificación' : 'Agregar Calificación'}</Text>
                            </TouchableOpacity>
                            {isEditingCalif && (
                                <TouchableOpacity style={[styles.button, {backgroundColor: '#6c757d', marginTop: 10}]} onPress={() => { setIsEditingCalif(false); setMateria(''); setCalificacion(''); }}>
                                    <Text style={styles.buttonText}>Cancelar Edición</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                        <FlatList
                            data={calificaciones}
                            keyExtractor={(item) => item.materia}
                            renderItem={({ item }) => (
                                <View style={styles.calificacionRow}>
                                    <Text style={styles.materiaText}>{item.materia}</Text>
                                    <Text style={styles.calificacionText}>{item.calificacion}</Text>
                                    <View style={styles.actionsContainer}>
                                        <TouchableOpacity style={styles.actionButton} onPress={() => { setIsEditingCalif(true); setMateria(item.materia); setMateriaOriginal(item.materia); setCalificacion(item.calificacion.toString()); }}>
                                            <Text style={styles.actionButtonText}>Editar</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={() => handleEliminarCalificacion(item.materia)}>
                                            <Text style={styles.actionButtonText}>Eliminar</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            )}
                        />
                        <Button title="Cerrar" onPress={() => setCalifModalVisible(false)} />
                    </View>
                </Modal>
            )}
        </View>
    );
}

// --- PANTALLA PRINCIPAL Y NAVEGACIÓN ---
function HomeScreen({ route }) {
    const { user } = route.params;
    if (user.tipo_user === 'alumno') return <AlumnoDashboard user={user} />;
    if (user.tipo_user === 'profesor') return <ProfesorDashboard />;
    return <View style={styles.inner}><Text>Rol no reconocido.</Text></View>;
}

const Stack = createNativeStackNavigator();

export default function App() {
    return (
        <NavigationContainer>
            <StatusBar style="auto" />
            <Stack.Navigator initialRouteName="Login">
                <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
                <Stack.Screen name="Home" component={HomeScreen} options={({ route }) => ({ title: `Bienvenido, ${route.params.user.nombre}` })} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}


// --- ESTILOS ---
const styles = StyleSheet.create({
    container: { flex: 1 },
    inner: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#f5f5f5' },
    title: { fontSize: 32, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: '#333' },
    input: { width: '100%', backgroundColor: '#fff', padding: 15, marginBottom: 15, borderRadius: 10, borderWidth: 1, borderColor: '#ddd', fontSize: 16 },
    button: { width: '100%', backgroundColor: '#007bff', padding: 15, borderRadius: 10, alignItems: 'center' },
    buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    modalContent: { flex: 1, justifyContent: 'center', padding: 20 },
    formContainer: { marginBottom: 20, padding: 15, backgroundColor: '#f9f9f9', borderRadius: 10, borderWidth: 1, borderColor: '#ddd' },
    calificacionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#eee' },
    materiaText: { fontSize: 16, flex: 1 },
    calificacionText: { fontSize: 16, fontWeight: 'bold' },
    actionsContainer: { flexDirection: 'row' },
    actionButton: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 5, backgroundColor: '#6c757d', marginLeft: 10, justifyContent: 'center', alignItems: 'center' },
    deleteButton: { backgroundColor: '#dc3545' },
    actionButtonText: { color: 'white', fontSize: 14, fontWeight: '500' },
    alumnoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#eee' },
    alumnoNameText: { fontSize: 16, flex: 1 },
    alumnoActionsContainer: { flexDirection: 'row' },
    actionButtonSmall: { paddingVertical: 5, paddingHorizontal: 10, borderRadius: 5, backgroundColor: '#007bff', marginLeft: 8 },
    editButton: { backgroundColor: '#ffc107' },
    actionButtonTextSmall: { color: 'white', fontSize: 12, fontWeight: 'bold' }
});


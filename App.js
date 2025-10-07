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
// ¡Asegúrate de que esta IP sea la correcta!
const IP_SERVIDOR = Platform.OS === 'web' ? 'localhost' : '192.168.1.121';
const API_URL = `http://${IP_SERVIDOR}:3000`;

// --- PANTALLA DE CARGA INICIAL ---
function SplashScreen() {
    return (
        <View style={styles.inner}>
            <Text style={styles.title}>Cargando...</Text>
        </View>
    );
}


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
    const [alumnos, setAlumnos] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedAlumno, setSelectedAlumno] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [calificaciones, setCalificaciones] = useState([]);

    // Estados para el formulario de agregar/editar
    const [materia, setMateria] = useState('');
    const [calificacion, setCalificacion] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [materiaOriginal, setMateriaOriginal] = useState('');


    useEffect(() => {
        const fetchAlumnos = async () => {
            try {
                const response = await fetch(`${API_URL}/alumnos`);
                const data = await response.json();
                if (data.success) {
                    setAlumnos(data.alumnos);
                } else {
                    Alert.alert('Error', 'No se pudo cargar la lista de alumnos.');
                }
            } catch (error) {
                Alert.alert('Error', 'Error de conexión al buscar alumnos.');
            }
        };
        fetchAlumnos();
    }, []);

    const refrescarCalificaciones = async (id_alumno) => {
        try {
            const response = await fetch(`${API_URL}/calificaciones/${id_alumno}`);
            const data = await response.json();
            if (data.success) {
                setCalificaciones(data.calificaciones);
            }
        } catch (error) {
            Alert.alert('Error', 'No se pudieron refrescar las calificaciones.');
        }
    };


    const handleSelectAlumno = async (alumno) => {
        setSelectedAlumno(alumno);
        await refrescarCalificaciones(alumno.id_user);
        setModalVisible(true);
    };

    const handleAgregar = async () => {
        if (!materia || !calificacion) {
            Alert.alert('Error', 'Debes ingresar materia y calificación.');
            return;
        }
        try {
            const response = await fetch(`${API_URL}/calificaciones`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id_alumno: selectedAlumno.id_user,
                    materia,
                    calificacion: parseInt(calificacion)
                }),
            });
            const data = await response.json();
            if (data.success) {
                await refrescarCalificaciones(selectedAlumno.id_user);
                setMateria('');
                setCalificacion('');
            } else {
                Alert.alert('Error', data.message);
            }
        } catch (error) {
            Alert.alert('Error', 'No se pudo agregar la calificación.');
        }
    };

    const handleActualizar = async () => {
        try {
            const response = await fetch(`${API_URL}/calificaciones`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id_alumno: selectedAlumno.id_user,
                    materia: materiaOriginal,
                    calificacion: parseInt(calificacion)
                }),
            });
            const data = await response.json();
            if (data.success) {
                await refrescarCalificaciones(selectedAlumno.id_user);
                setMateria('');
                setCalificacion('');
                setIsEditing(false);
            } else {
                Alert.alert('Error', data.message);
            }
        } catch (error) {
            Alert.alert('Error', 'No se pudo actualizar la calificación.');
        }
    };
    
    // --- FUNCIÓN DE ELIMINAR MODIFICADA ---
    // Se ha quitado el Alert.alert para llamar a la lógica directamente
    const handleEliminar = async (materia) => {
        try {
            const url = `${API_URL}/calificaciones?id_alumno=${selectedAlumno.id_user}&materia=${encodeURIComponent(materia)}`;
            console.log(`<< [DEBUG] Enviando DELETE directamente a: ${url}`);

            const response = await fetch(url, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
            });
            const data = await response.json();
            if (data.success) {
                await refrescarCalificaciones(selectedAlumno.id_user);
            } else {
                Alert.alert('Error al eliminar', data.message);
            }
        } catch (error) {
            console.error("Error al intentar eliminar la calificación:", error);
            Alert.alert('Error de Red', `No se pudo eliminar la calificación. Error: ${error.message}`);
        }
    };

    const filteredAlumnos = alumnos.filter(a =>
        `${a.nombre} ${a.apellido}`.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <View style={styles.inner}>
            <Text style={styles.title}>Panel del Profesor</Text>
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
                    <TouchableOpacity style={styles.alumnoRow} onPress={() => handleSelectAlumno(item)}>
                        <Text>{item.nombre} {item.apellido}</Text>
                    </TouchableOpacity>
                )}
            />

            {selectedAlumno && (
                <Modal visible={modalVisible} animationType="slide" onRequestClose={() => {
                    setModalVisible(false);
                    setIsEditing(false);
                    setMateria('');
                    setCalificacion('');
                }}>
                    <View style={styles.modalContent}>
                        <Text style={styles.title}>{selectedAlumno.nombre} {selectedAlumno.apellido}</Text>
                        
                        <View style={styles.formContainer}>
                            <TextInput
                                placeholder="Materia"
                                style={styles.input}
                                value={materia}
                                onChangeText={setMateria}
                                editable={!isEditing}
                            />
                            <TextInput
                                placeholder="Calificación"
                                style={styles.input}
                                value={calificacion}
                                onChangeText={setCalificacion}
                                keyboardType="numeric"
                            />
                            <TouchableOpacity 
                                style={[styles.button, {backgroundColor: isEditing ? '#28a745' : '#007bff'}]} 
                                onPress={isEditing ? handleActualizar : handleAgregar}
                            >
                                <Text style={styles.buttonText}>{isEditing ? 'Actualizar Calificación' : 'Agregar Calificación'}</Text>
                            </TouchableOpacity>
                            {isEditing && (
                                <TouchableOpacity 
                                    style={[styles.button, {backgroundColor: '#6c757d', marginTop: 10}]} 
                                    onPress={() => {
                                        setIsEditing(false);
                                        setMateria('');
                                        setCalificacion('');
                                    }}
                                >
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
                                        <TouchableOpacity style={styles.actionButton} onPress={() => {
                                            setIsEditing(true);
                                            setMateria(item.materia);
                                            setMateriaOriginal(item.materia);
                                            setCalificacion(item.calificacion.toString());
                                        }}>
                                            <Text style={styles.actionButtonText}>Editar</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity 
                                            style={[styles.actionButton, styles.deleteButton]} 
                                            onPress={() => handleEliminar(item.materia)}
                                        >
                                            <Text style={styles.actionButtonText}>Eliminar</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            )}
                        />
                        <Button title="Cerrar" onPress={() => setModalVisible(false)} />
                    </View>
                </Modal>
            )}
        </View>
    );
}

// --- PANTALLA PRINCIPAL (DISTRIBUIDOR DE ROLES) ---
function HomeScreen({ route }) {
    const { user } = route.params;

    if (user.tipo_user === 'alumno') {
        return <AlumnoDashboard user={user} />;
    } else if (user.tipo_user === 'profesor') {
        return <ProfesorDashboard />;
    } else {
        return (
            <View style={styles.inner}>
                <Text>Rol no reconocido.</Text>
            </View>
        );
    }
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
    container: {
        flex: 1,
    },
    inner: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
        backgroundColor: '#f5f5f5',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
        color: '#333',
    },
    input: {
        width: '100%',
        backgroundColor: '#fff',
        padding: 15,
        marginBottom: 15,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#ddd',
        fontSize: 16,
    },
    button: {
        width: '100%',
        backgroundColor: '#007bff',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    alumnoRow: {
        padding: 15,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    modalContent: {
        flex: 1,
        padding: 20,
        paddingTop: 50,
    },
    calificacionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    materiaText: {
        fontSize: 16,
        flex: 1,
    },
    calificacionText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    actionsContainer: {
        flexDirection: 'row',
    },
    actionButton: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 5,
        backgroundColor: '#6c757d',
        marginLeft: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    deleteButton: {
        backgroundColor: '#dc3545',
    },
    actionButtonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '500',
    },
    formContainer: {
        marginBottom: 20,
        padding: 15,
        backgroundColor: '#f9f9f9',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#ddd'
    }
});


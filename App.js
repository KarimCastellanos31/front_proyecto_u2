// Paso 1: ¡Esta línea DEBE ser la primera! Inicializa el manejador de gestos.
import 'react-native-gesture-handler';

// Paso 2: El resto de las importaciones
import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// --- Pantalla de Bienvenida (HomeScreen) ---
function HomeScreen({ route }) {
    const { user } = route.params;
    return (
        <View style={styles.inner}>
            <Text style={styles.title}>¡Bienvenido!</Text>
            <Text style={styles.welcomeText}>{user.nombre} {user.apellido}</Text>
            <Text style={styles.welcomeText}>Rol: {user.tipo_user}</Text>
        </View>
    );
}

// --- Pantalla de Login (LoginScreen) ---
function LoginScreen({ navigation }) {
    console.log("Hola!");
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async () => {
        if (!username || !password) {
            Alert.alert('Error', 'Por favor, ingresa tu usuario y contraseña.');
            return;
        }

        try {
            // --- Lógica CLAVE para MÓVIL y WEB ---
            // En web, usamos 'localhost'. En móvil, DEBES usar la IP de tu computadora.
            const ipServidor = Platform.OS === 'web' ? 'localhost' : '172.20.10.5'; // ¡Asegúrate de que esta IP sea la correcta!
            
            const response = await fetch(`http://${ipServidor}:3000/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
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
            Alert.alert('Error de conexión', 'No se pudo conectar con el servidor. Verifica que la IP sea correcta y que ambos dispositivos estén en la misma red WiFi.');
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

const Stack = createNativeStackNavigator();

export default function App() {
    return (
        <NavigationContainer>
            <Stack.Navigator>
                <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
                <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Inicio' }} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}

// --- Estilos ---
const styles = StyleSheet.create({//dany-- cambio en el front
    container: {
        flex: 1,
    },
    inner: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#DDDAD0',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 40,
        color: '#333',
    },
    input: {
        width: '100%',
        backgroundColor: '#DDDAD0',
        padding: 15,
        marginBottom: 20,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#3A432D',
        fontSize: 16,
    },
    button: {
        width: '100%',
        backgroundColor: '#3A432D',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
    },
    buttonText: {
        color: '#DDDAD0',
        fontSize: 18,
        fontWeight: 'bold',
    },
    welcomeText: {
      fontSize: 20,
      color: '#333',
      textAlign: 'center'
    }
});



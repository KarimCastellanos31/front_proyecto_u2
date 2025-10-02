import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// --- Pantalla de Bienvenida (la "otra pestaña") ---
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

// --- Pantalla de Login ---
function LoginScreen({ navigation }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async () => {
        if (!username || !password) {
            Alert.alert('Error', 'Por favor, ingresa tu usuario y contraseña.');
            return;
        }

        try {
            // IMPORTANTE: Reemplaza 'TU_IP_LOCAL' con la IP de tu computadora.
            // No uses 'localhost' porque el teléfono no lo entenderá.
            const response = await fetch('http://192.168.100.12:3000/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (data.success) {
                // Si el login es exitoso, navegamos a la pantalla HomeScreen
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

const Stack = createStackNavigator();

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

// --- Estilos (son los mismos que tenías) ---
const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    inner: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#f5f5f5',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 40,
        color: '#333',
    },
    input: {
        width: '100%',
        backgroundColor: '#fff',
        padding: 15,
        marginBottom: 20,
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
    welcomeText: {
      fontSize: 20,
      color: '#333',
    }
});
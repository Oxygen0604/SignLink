

import { StatusBar, StyleSheet, useColorScheme, View } from 'react-native';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './src/screens/HomeScreen/HomeScreen';
import SignHomeScreen from './src/screens/SignScreen/SignHomeScreen';
import SignTransScreen from './src/screens/SignScreen/SignTransScreen';
import SpeechToTextScreen from './src/screens/SignScreen/SpeechToTextScreen';

const Stack = createNativeStackNavigator();

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <NavigationContainer>
        <Stack.Navigator initialRouteName='Home'>
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="SignHome"
            component={SignHomeScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="SignTrans"
            component={SignTransScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="SpeechToText"
            component={SpeechToTextScreen}
            options={{ headerShown: false }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default App;

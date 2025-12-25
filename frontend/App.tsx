

import { StatusBar, useColorScheme } from 'react-native';
import {
  SafeAreaProvider,
} from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './src/screens/HomeScreen/HomeScreen';
import SignHomeScreen from './src/screens/SignTransScreen/SignTranslationScreen.ios';
import AIAssistantScreen from './src/screens/SignAIScreen/SignAIScreen.ios';
import SignAnswerHomeScreen from './src/screens/SignAnswerScreen/SignAnswerHomeScreen.ios';
import AnswerQuiz from './src/screens/SignAnswerScreen/AnswerQuiz.ios';
import AnswerRecordsScreen from './src/screens/SignAnswerScreen/AnswerRecordsScreen.ios';
import LeaderboardScreen from './src/screens/SignAnswerScreen/LeaderboardScreen.ios';
import LoginScreen from './src/screens/AuthScreen/LoginScreen.ios';
import RegisterScreen from './src/screens/AuthScreen/RegisterScreen.ios';
import ForgotPasswordScreen from './src/screens/AuthScreen/ForgotPasswordScreen.ios';

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
            name="AIAssistant"
            component={AIAssistantScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="AnswerGame"
            component={SignAnswerHomeScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="AnswerQuiz"
            component={AnswerQuiz}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="AnswerRecords"
            component={AnswerRecordsScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Leaderboard"
            component={LeaderboardScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Register"
            component={RegisterScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ForgotPassword"
            component={ForgotPasswordScreen}
            options={{ headerShown: false }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default App;

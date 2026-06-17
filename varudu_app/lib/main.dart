import 'package:flutter/material.dart';
import 'theme/app_theme.dart';
import 'screens/login_screen.dart';
import 'screens/onboarding_screen.dart';
import 'screens/home_screen.dart';
import 'screens/profile_screen.dart';
import 'screens/interests_screen.dart';
import 'screens/chat_screen.dart';
import 'screens/boutique_screen.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Check if user is logged in
  final prefs = await SharedPreferences.getInstance();
  final userStr = prefs.getString('user');
  
  String initialRoute = '/login';
  if (userStr != null) {
    initialRoute = '/home'; 
  }

  runApp(VaruduApp(initialRoute: initialRoute));
}

class VaruduApp extends StatelessWidget {
  final String initialRoute;

  const VaruduApp({super.key, required this.initialRoute});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Varudu Matrimony',
      theme: AppTheme.lightTheme,
      debugShowCheckedModeBanner: false,
      initialRoute: initialRoute,
      routes: {
        '/login': (context) => const LoginScreen(),
        '/onboarding': (context) => const OnboardingScreen(),
        '/home': (context) => const HomeScreen(),
        '/profile': (context) => const ProfileScreen(),
        '/interests': (context) => const InterestsScreen(),
        '/chat': (context) => const ChatScreen(),
        '/boutique': (context) => const BoutiqueScreen(),
      },
    );
  }
}

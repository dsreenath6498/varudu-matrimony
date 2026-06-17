import 'package:flutter/material.dart';
import '../widgets/navbar.dart';
import '../theme/app_theme.dart';

class ChatScreen extends StatelessWidget {
  const ChatScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Chats')),
      body: const Center(child: Text('Chat Screen - Coming Soon')),
      bottomNavigationBar: const NavBar(currentIndex: 2),
    );
  }
}

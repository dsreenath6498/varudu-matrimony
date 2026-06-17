import 'package:flutter/material.dart';
import '../widgets/navbar.dart';
import '../theme/app_theme.dart';

class InterestsScreen extends StatelessWidget {
  const InterestsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Requests')),
      body: const Center(child: Text('Interests / Requests Screen - Coming Soon')),
      bottomNavigationBar: const NavBar(currentIndex: 1),
    );
  }
}

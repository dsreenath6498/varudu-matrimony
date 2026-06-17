import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class BoutiqueScreen extends StatelessWidget {
  const BoutiqueScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Rose Boutique')),
      body: const Center(child: Text('Rose Boutique - Coming Soon')),
    );
  }
}

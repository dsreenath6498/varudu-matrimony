import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:io';
import '../services/api_service.dart';
import '../theme/app_theme.dart';
import 'package:google_fonts/google_fonts.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _ageController = TextEditingController();
  final TextEditingController _placeController = TextEditingController();
  
  String _gender = 'Male';
  String _interestedIn = 'Female';
  bool _isLoading = false;
  
  List<File> _selectedPhotos = [];
  final ImagePicker _picker = ImagePicker();

  Future<void> _pickImages() async {
    final List<XFile>? images = await _picker.pickMultiImage();
    if (images != null) {
      setState(() {
        _selectedPhotos = images.map((x) => File(x.path)).take(5).toList();
      });
    }
  }

  Future<void> _completeOnboarding() async {
    if (_nameController.text.isEmpty || _ageController.text.isEmpty || _placeController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please fill all fields')));
      return;
    }

    setState(() => _isLoading = true);
    try {
      final prefs = await SharedPreferences.getInstance();
      final userStr = prefs.getString('user');
      if (userStr == null) throw Exception("No user found");
      final user = jsonDecode(userStr);

      final fields = {
        'userId': user['id'].toString(),
        'name': _nameController.text,
        'age': _ageController.text,
        'dob': '2000-01-01', // Mocking DOB for simplicity
        'place': _placeController.text,
        'gender': _gender,
        'interested_in': _interestedIn,
      };

      final filePaths = _selectedPhotos.map((f) => f.path).toList();

      var response;
      if (filePaths.isNotEmpty) {
        response = await ApiService.multipartPost('/profile/create', fields, filePaths, 'photos');
      } else {
        response = await ApiService.post('/profile/create', fields);
      }

      await prefs.setString('user', jsonEncode(response['user']));
      
      if (!mounted) return;
      Navigator.pushReplacementNamed(context, '/home');
    } catch (e) {
      print('Onboarding Error: $e');
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Error saving profile.')));
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Profile Setup')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Let\'s set up your profile ✨', style: Theme.of(context).textTheme.displayMedium),
            const SizedBox(height: 32),
            
            Text('NAME', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.gold)),
            const SizedBox(height: 8),
            TextField(controller: _nameController, decoration: const InputDecoration(hintText: 'John Doe')),
            const SizedBox(height: 24),
            
            Text('AGE', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.gold)),
            const SizedBox(height: 8),
            TextField(controller: _ageController, keyboardType: TextInputType.number, decoration: const InputDecoration(hintText: '25')),
            const SizedBox(height: 24),

            Text('LOCATION', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.gold)),
            const SizedBox(height: 8),
            TextField(controller: _placeController, decoration: const InputDecoration(hintText: 'City, Country')),
            const SizedBox(height: 24),

            Text('I AM A', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.gold)),
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                  child: RadioListTile<String>(
                    title: const Text('Male'),
                    value: 'Male',
                    groupValue: _gender,
                    onChanged: (val) => setState(() => _gender = val!),
                    activeColor: AppTheme.crimson,
                  ),
                ),
                Expanded(
                  child: RadioListTile<String>(
                    title: const Text('Female'),
                    value: 'Female',
                    groupValue: _gender,
                    onChanged: (val) => setState(() => _gender = val!),
                    activeColor: AppTheme.crimson,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),

            Text('INTERESTED IN', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.gold)),
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                  child: RadioListTile<String>(
                    title: const Text('Male'),
                    value: 'Male',
                    groupValue: _interestedIn,
                    onChanged: (val) => setState(() => _interestedIn = val!),
                    activeColor: AppTheme.crimson,
                  ),
                ),
                Expanded(
                  child: RadioListTile<String>(
                    title: const Text('Female'),
                    value: 'Female',
                    groupValue: _interestedIn,
                    onChanged: (val) => setState(() => _interestedIn = val!),
                    activeColor: AppTheme.crimson,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),

            Text('PROFILE PHOTOS', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.gold)),
            const SizedBox(height: 8),
            GestureDetector(
              onTap: _pickImages,
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: AppTheme.bgSurface,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppTheme.gold.withOpacity(0.5), style: BorderStyle.solid),
                ),
                child: Column(
                  children: [
                    const Icon(Icons.camera_alt, color: AppTheme.gold, size: 48),
                    const SizedBox(height: 8),
                    Text(
                      _selectedPhotos.isEmpty ? 'Tap to select photos (up to 5)' : '\${_selectedPhotos.length} photo(s) selected',
                      style: TextStyle(color: AppTheme.textPrimary),
                    ),
                  ],
                ),
              ),
            ),
            if (_selectedPhotos.isNotEmpty) ...[
              const SizedBox(height: 16),
              SizedBox(
                height: 80,
                child: ListView.builder(
                  scrollDirection: Axis.horizontal,
                  itemCount: _selectedPhotos.length,
                  itemBuilder: (context, index) {
                    return Padding(
                      padding: const EdgeInsets.only(right: 8.0),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(8),
                        child: Image.file(_selectedPhotos[index], width: 80, height: 80, fit: BoxFit.cover),
                      ),
                    );
                  },
                ),
              )
            ],
            const SizedBox(height: 48),

            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _isLoading ? null : _completeOnboarding,
                child: _isLoading 
                    ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                    : const Text('Complete Setup ✨'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

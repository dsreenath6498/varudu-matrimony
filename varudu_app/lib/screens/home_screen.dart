import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:appinio_swiper/appinio_swiper.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../services/api_service.dart';
import '../theme/app_theme.dart';
import '../widgets/navbar.dart';
import 'package:google_fonts/google_fonts.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  List<dynamic> _profiles = [];
  bool _isLoading = true;
  final AppinioSwiperController _swiperController = AppinioSwiperController();

  @override
  void initState() {
    super.initState();
    _fetchProfiles();
  }

  Future<void> _fetchProfiles() async {
    setState(() => _isLoading = true);
    try {
      final prefs = await SharedPreferences.getInstance();
      final userStr = prefs.getString('user');
      if (userStr == null) return;
      final user = jsonDecode(userStr);

      final response = await ApiService.get('/profiles', query: {
        'gender': user['interested_in'],
        'userId': user['id'],
      });

      if (mounted) {
        setState(() {
          // In case the API returns { "profiles": [...] } or just [...]
          if (response is List) {
            _profiles = response;
          } else if (response is Map && response.containsKey('profiles')) {
            _profiles = response['profiles'];
          } else {
            _profiles = [];
          }
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to load profiles')));
      }
    }
  }

  Future<void> _handleSwipe(int index, dynamic direction) async {
    final prefs = await SharedPreferences.getInstance();
    final userStr = prefs.getString('user');
    if (userStr == null) return;
    final user = jsonDecode(userStr);

    final profile = _profiles[index];
    final status = direction.toString().contains('right') ? 'accepted' : 'rejected';

    try {
      await ApiService.post('/interests/swipe', {
        'senderId': user['id'],
        'receiverId': profile['id'],
        'status': status,
      });
    } catch (e) {
      print('Swipe error: \$e');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Varudu'),
        centerTitle: true,
        automaticallyImplyLeading: false,
        actions: [
          IconButton(
            icon: const Icon(Icons.favorite_border, color: AppTheme.crimson),
            onPressed: () {},
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppTheme.gold))
          : _profiles.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.search_off, size: 64, color: AppTheme.gold),
                      const SizedBox(height: 16),
                      Text('No profiles found', style: Theme.of(context).textTheme.bodyLarge),
                      TextButton(
                        onPressed: _fetchProfiles,
                        child: const Text('Refresh', style: TextStyle(color: AppTheme.crimson)),
                      )
                    ],
                  ),
                )
              : SafeArea(
                  child: Padding(
                    padding: const EdgeInsets.only(top: 20, left: 20, right: 20, bottom: 40),
                    child: AppinioSwiper(
                      controller: _swiperController,
                      cardCount: _profiles.length,
                      onSwipeEnd: (previousIndex, targetIndex, activity) {
                        _handleSwipe(previousIndex, activity.direction);
                      },
                      cardBuilder: (BuildContext context, int index) {
                        final profile = _profiles[index];
                        final photoUrl = (profile['photos'] != null && profile['photos'].isNotEmpty)
                            ? profile['photos'][0]
                            : 'https://via.placeholder.com/400x600?text=No+Photo';

                        return Container(
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(24),
                            boxShadow: [
                              BoxShadow(
                                color: AppTheme.textPrimary.withOpacity(0.15),
                                blurRadius: 20,
                                offset: const Offset(0, 10),
                              )
                            ],
                          ),
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(24),
                            child: Stack(
                              fit: StackFit.expand,
                              children: [
                                CachedNetworkImage(
                                  imageUrl: photoUrl,
                                  fit: BoxFit.cover,
                                  placeholder: (context, url) => const Center(child: CircularProgressIndicator(color: AppTheme.gold)),
                                  errorWidget: (context, url, error) => Container(color: AppTheme.bgRaised, child: const Icon(Icons.error, color: AppTheme.crimson)),
                                ),
                                Container(
                                  decoration: BoxDecoration(
                                    gradient: LinearGradient(
                                      colors: [Colors.transparent, AppTheme.textPrimary.withOpacity(0.9)],
                                      begin: Alignment.topCenter,
                                      end: Alignment.bottomCenter,
                                      stops: const [0.6, 1.0],
                                    ),
                                  ),
                                ),
                                Positioned(
                                  bottom: 24,
                                  left: 24,
                                  right: 24,
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Row(
                                        children: [
                                          Text(
                                            "\${profile['name']}, \${profile['age']}",
                                            style: GoogleFonts.cormorantGaramond(
                                              color: Colors.white,
                                              fontSize: 32,
                                              fontWeight: FontWeight.bold,
                                            ),
                                          ),
                                          const SizedBox(width: 8),
                                          if (profile['is_verified'] == true)
                                            const Icon(Icons.verified, color: Colors.blue, size: 24),
                                        ],
                                      ),
                                      const SizedBox(height: 8),
                                      Row(
                                        children: [
                                          const Icon(Icons.location_on, color: AppTheme.gold, size: 16),
                                          const SizedBox(width: 4),
                                          Text(
                                            profile['place'] ?? 'Unknown location',
                                            style: GoogleFonts.inter(color: Colors.white70, fontSize: 14),
                                          ),
                                        ],
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                ),
      bottomNavigationBar: const NavBar(currentIndex: 0),
    );
  }
}

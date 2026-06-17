import 'dart:convert';
import 'package:http/http.dart' as http;

class ApiService {
  static const String baseUrl = 'http://192.168.1.6:3000/api';

  static Future<dynamic> post(String endpoint, Map<String, dynamic> body) async {
    final response = await http.post(
      Uri.parse('$baseUrl$endpoint'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode(body),
    );
    
    if (response.statusCode >= 200 && response.statusCode < 300) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed request: ${response.statusCode}');
    }
  }

  static Future<dynamic> multipartPost(String endpoint, Map<String, String> fields, List<String> filePaths, String fileField) async {
    var request = http.MultipartRequest('POST', Uri.parse('$baseUrl$endpoint'));
    request.fields.addAll(fields);
    
    for (var path in filePaths) {
      request.files.add(await http.MultipartFile.fromPath(fileField, path));
    }
    
    var streamedResponse = await request.send();
    var response = await http.Response.fromStream(streamedResponse);
    
    if (response.statusCode >= 200 && response.statusCode < 300) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed request: ${response.statusCode}');
    }
  }

  static Future<dynamic> get(String endpoint, {Map<String, String>? query}) async {
    String queryString = Uri(queryParameters: query).query;
    final url = query != null ? '$baseUrl$endpoint?$queryString' : '$baseUrl$endpoint';
    final response = await http.get(Uri.parse(url));

    if (response.statusCode >= 200 && response.statusCode < 300) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed request: \${response.statusCode}');
    }
  }
}

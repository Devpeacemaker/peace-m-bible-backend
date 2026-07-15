import 'package:hive_flutter/hive_flutter.dart';

class NotesService {
  static const String boxName = "bible_notes";

  static Future<void> init() async {
    if (!Hive.isBoxOpen(boxName)) {
      await Hive.openBox(boxName);
    }
  }

  static Box get _box => Hive.box(boxName);

  static List<Map<String, dynamic>> getNotes() {
    return _box.values
        .map((e) => Map<String, dynamic>.from(e))
        .toList();
  }

  static Future<void> addNote({
    required String title,
    required String content,
  }) async {
    await _box.add({
      "title": title,
      "content": content,
      "createdAt": DateTime.now().toIso8601String(),
      "updatedAt": DateTime.now().toIso8601String(),
    });
  }

  static Future<void> updateNote({
    required int index,
    required String title,
    required String content,
  }) async {
    await _box.putAt(index, {
      "title": title,
      "content": content,
      "createdAt":
          (_box.getAt(index) as Map)["createdAt"],
      "updatedAt":
          DateTime.now().toIso8601String(),
    });
  }

  static Future<void> deleteNote(
      int index) async {
    await _box.deleteAt(index);
  }

  static Map<String, dynamic> getNote(
      int index) {
    return Map<String, dynamic>.from(
      _box.getAt(index),
    );
  }
}

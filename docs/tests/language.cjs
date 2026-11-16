/* Localisation rules tested without loading a browser or media file. */
"use strict";
const assert = require("node:assert/strict");
const {translate, translations} = require("../i18n.js");
assert.ok(Object.keys(translations).length > 120, "Full interface dictionary expected");
const expectations = [
  ["Player", "Плеер"],
  ["Library", "Медиатека"],
  ["Help", "Справка"],
  ["https://example.com/movie.mp4", "https://пример.рф/фильм.mp4"],
  ["Main navigation", "Основная навигация"],
  ["Size", "Размер"],
  ["Format", "Формат"],
  ["Direct stream URL", "Прямая ссылка на поток"],
  ["Remote media", "Удалённый медиафайл"],
  ["Remove from queue", "Удалить из очереди"],
  ["Chapter", "Глава"],
  ["＋ Open media", "＋ Открыть медиа"],
  ["Subtitles", "Субтитры"],
  ["Subtitles off", "Субтитры выключены"],
  ["Speed", "Скорость"],
  ["Audio tracks", "Аудиодорожки"],
  ["Playback", "Воспроизведение"],
  ["Volume 40%", "Громкость 40%"],
  ["1 item", "1 файл"],
  ["2 items", "2 файла"],
  ["5 items", "5 файлов"],
  ["21 items", "21 файл"],
  ["Added 2 files to the queue.", "Добавлено 2 файла в очередь."],
  ["Audio track 3", "Аудиодорожка 3"],
  ["Subtitles off · 2 embedded MKV tracks found",
    "Субтитры выключены · Найдено 2 дорожки MKV"],
  ["My Movie.mkv", "My Movie.mkv"],
  ["South Park S29E05.mkv", "South Park S29E05.mkv"]
];
for (const [english, russian] of expectations)
  assert.equal(translate(english), russian, "Incorrect Russian text for " + english);
console.log("PASS: Russian interface translations and untouched filenames");

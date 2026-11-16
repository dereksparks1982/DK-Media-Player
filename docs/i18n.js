/* DK Media Player interface language. Only UI strings are translated.
   File names, media content, URLs, and user-provided titles remain untouched. */
(() => {
  "use strict";
  const key = "dkmedia.web.language.v1";
  const translations = {
    "DK MEDIA PLAYER":"ДК МЕДИАПЛЕЕР",
    "DK Media Player home":"Главная страница ДК Медиаплеера",
    "Player":"Плеер", "Library":"Медиатека", "Help":"Справка",
    "＋ Open media":"＋ Открыть медиа", "Open media":"Открыть медиа",
    "Interface language":"Язык интерфейса",
    "Media player and file drop area":"Проигрыватель и область перетаскивания файлов",
    "Selected video":"Выбранное видео", "Video options":"Настройки видео",
    "Media information":"Информация о файле", "Close media information":"Закрыть информацию",
    "Ready when you are":"Готово к просмотру",
    "Choose a video or music file from this device, or open a direct stream below.":"Выберите видео или музыку на устройстве либо откройте прямую ссылку на поток ниже.",
    "Open files":"Открыть файлы", "Restore last file":"Восстановить последний файл",
    "You can also drag media files onto this window.":"Файлы также можно перетащить в окно.",
    "Playback controls":"Управление воспроизведением", "Playback position":"Позиция воспроизведения",
    "Previous media":"Предыдущий файл", "Previous":"Предыдущий", "Next media":"Следующий файл", "Next":"Следующий",
    "Play":"Воспроизвести", "Pause":"Пауза", "Stop":"Стоп", "Play or pause":"Воспроизвести или приостановить",
    "Mute":"Выключить звук", "Unmute":"Включить звук", "Volume":"Громкость",
    "Playback speed":"Скорость воспроизведения", "Picture in picture":"Картинка в картинке",
    "Fullscreen":"На весь экран", "Exit fullscreen":"Выйти из полноэкранного режима",
    "Nothing playing":"Ничего не воспроизводится", "Select media to get started":"Выберите медиафайл",
    "Ready":"Готово", "LOCAL":"ЛОКАЛЬНЫЙ", "STREAM":"ПОТОК",
    "＋ Subtitles":"＋ Субтитры", "Subtitles off":"Субтитры выключены",
    "No external subtitles":"Нет внешних субтитров",
    "Open a direct media URL":"Открыть прямую ссылку на медиа",
    "Use a direct HTTPS/HTTP video or audio link, such as MP4, MP3, WebM, or an HLS stream on supported browsers. Video website pages are not media files.":"Укажите прямую ссылку HTTPS/HTTP на видео или аудио, например MP4, MP3, WebM либо поток HLS в совместимом браузере. Ссылка на страницу видеосайта не является медиафайлом.",
    "Media address":"Адрес медиафайла", "Optional title":"Название (необязательно)",
    "Title (optional)":"Название (необязательно)", "Play URL":"Воспроизвести ссылку",
    "Playlist":"Плейлист", "Up Next":"Далее", "0 items":"0 файлов",
    "Your playlist is empty. Add a file or stream to begin.":"Список воспроизведения пуст. Добавьте файл или поток.",
    "＋ Add files":"＋ Добавить файлы", "Clear queue":"Очистить очередь",
    "Your collection":"Ваша коллекция",
    "Saved direct media links live in this browser.":"Сохранённые прямые ссылки хранятся в этом браузере.",
    "Saved streams and media links":"Сохранённые потоки и ссылки",
    "Play or remove your saved URLs. Local device files are never uploaded to GitHub.":"Воспроизводите или удаляйте сохранённые ссылки. Локальные файлы не загружаются на GitHub.",
    "Clear saved links":"Очистить ссылки", "No saved media links yet.":"Пока нет сохранённых ссылок.",
    "Using the web player":"Как пользоваться веб-плеером",
    "Play files on this device":"Воспроизведение файлов на устройстве",
    "Choose one or several media files. They play in your browser and are not uploaded. In browsers supporting persistent file handles, the last opened file can reopen after permission is granted. In Firefox and other browsers using the ordinary file picker, Restore last file asks you to choose the same file again and restores its saved position.":"Выберите один или несколько медиафайлов. Они воспроизводятся в браузере и никуда не загружаются. Браузеры с постоянным доступом к файлам могут повторно открыть последний файл после разрешения. В Firefox и других браузерах с обычным выбором файлов функция восстановления предлагает выбрать тот же файл и продолжить просмотр.",
    "Play remote video":"Воспроизведение удалённого видео",
    "Paste a direct, publicly reachable media URL. The server must permit streaming, and the file must use a codec your browser understands. GitHub Pages does not host or expose videos on your Linux computer.":"Вставьте прямую общедоступную ссылку на медиафайл. Сервер должен разрешать потоковую передачу, а браузер должен поддерживать кодек. GitHub Pages не публикует видео с вашего компьютера Linux.",
    "Library and resume":"Медиатека и продолжение просмотра",
    "Save direct URLs to the Library to reopen later. Watched positions and saved links are stored only in this browser. They do not automatically sync to your other devices.":"Сохраняйте прямые ссылки в Медиатеке для повторного просмотра. Позиции воспроизведения и ссылки хранятся только в этом браузере и не синхронизируются с другими устройствами.",
    "Subtitles":"Субтитры",
    "Subtitles are off by default. Select a browser-supported subtitle track in the right-click menu or load SRT/VTT manually. Subtitle language preferences are remembered. For local MKV files, the player detects embedded subtitle track metadata, but the browser must still be able to decode the tracks. Full MKV subtitle playback is planned for DK Browser.":"По умолчанию субтитры выключены. Выберите поддерживаемую браузером дорожку в контекстном меню либо загрузите файл SRT/VTT. Выбор языка запоминается. У локальных MKV-файлов проигрыватель определяет дорожки, но браузер должен уметь их декодировать. Полная поддержка встроенных субтитров MKV планируется для ДК Браузера.",
    "On-screen controls":"Управление воспроизведением",
    "Stop displays the golden emblem again and Play restarts the same movie from the beginning. Move the pointer over the movie to reveal the seek bar and playback controls, YouTube-style. They fade while playing and stay visible when paused. Double-click the picture for fullscreen; Esc exits. Right-click the video to open playback speed, subtitles, available audio tracks and chapters, aspect ratio, fullscreen, and media information. Unavailable browser track options are labeled rather than simulated. Space/K: play/pause; arrows: seek or volume; F: fullscreen; M: mute.":"Кнопка «Стоп» возвращает золотую эмблему, а «Воспроизвести» запускает тот же фильм с начала. Наведите указатель на видео, чтобы показать полосу перемотки и кнопки управления. Во время просмотра они скрываются, а при паузе остаются видимыми. Двойной щелчок переключает полный экран, Esc выходит из него. Правый щелчок открывает скорость, субтитры, аудиодорожки, главы, формат изображения и сведения о файле. Недоступные в браузере возможности отмечены как недоступные. Пробел/K: воспроизведение и пауза; стрелки: перемотка и громкость; F: полный экран; M: без звука.",
    "iPhone and iPad":"iPhone и iPad",
    "Use Safari or another browser to select a local file or open a direct media URL. You can add this site to your Home Screen. iOS supports HLS streams natively; other codecs vary by device.":"Используйте Safari или другой браузер для выбора локального файла либо прямой ссылки. Сайт можно добавить на главный экран. iOS поддерживает потоки HLS, другие кодеки зависят от устройства.",
    "DK Media Player is free software. This web player runs independently in your browser, using video formats supported by that browser.":"ДК Медиаплеер распространяется бесплатно. Веб-плеер работает непосредственно в браузере и поддерживает доступные ему видеоформаты.",
    "DK Media Player · DK Softworks":"ДК Медиаплеер · ДК Софтворкс",
    "Private local playback · No media uploads":"Локальное воспроизведение · Без загрузки файлов",
    "Choose media files":"Выберите медиафайлы", "Choose subtitle file":"Выберите файл субтитров",
    "Playback":"Воспроизведение", "Speed":"Скорость", "Audio tracks":"Аудиодорожки",
    "Picture":"Изображение", "Chapters":"Главы",
    "▶  Play":"▶  Воспроизвести", "⏸  Pause":"⏸  Пауза",
    "⏹  Stop":"⏹  Стоп", "⏮  Previous":"⏮  Предыдущий",
    "⏭  Next":"⏭  Следующий", "↶  Back 10 seconds":"↶  Назад на 10 секунд",
    "↷  Forward 10 seconds":"↷  Вперёд на 10 секунд",
    "MKV embedded tracks (file header)":"Встроенные дорожки MKV (заголовок файла)",
    "Checking MKV subtitle tracks…":"Поиск субтитров MKV…",
    "＋ Load SRT / VTT…":"＋ Загрузить SRT / VTT…",
    "Track selection not exposed by this browser":"Браузер не предоставляет выбор дорожки",
    "Fit full picture":"Показать всё изображение",
    "Fill frame (crop edges)":"Заполнить экран (обрезать края)",
    "Media information":"Сведения о файле",
    "Title":"Название", "Source":"Источник", "Resolution":"Разрешение",
    "Duration":"Продолжительность", "Browser subtitle tracks":"Дорожки субтитров браузера",
    "Detected MKV subtitle tracks":"Обнаруженные субтитры MKV",
    "Live / unknown":"Прямой эфир / неизвестно",
    "Local file":"Локальный файл", "Remote URL":"Удалённая ссылка",
    "Local device · Not uploaded":"Локальное устройство · Без загрузки",
    "None in inspected header":"Не найдены в заголовке",
    "Scanning…":"Поиск…", "On":"Включены",
    "Stopped":"Остановлено", "Press the red Play button to restart this movie.":"Нажмите красную кнопку воспроизведения, чтобы начать фильм сначала.",
    "No supported media file selected. Choose a video or audio file.":"Поддерживаемый файл не выбран. Выберите видео или аудио.",
    "Open a media file or paste a direct video link first.":"Сначала откройте медиафайл или вставьте прямую ссылку.",
    "Tap Play to start playback on this device.":"Нажмите «Воспроизвести» для запуска на этом устройстве.",
    "Couldn't start this media. Check its format or source.":"Не удалось запустить файл. Проверьте формат или источник.",
    "No readable video or audio file was selected.":"Не выбран доступный для чтения видео- или аудиофайл.",
    "The file picker could not open. Try another browser or a file drop.":"Не удалось открыть выбор файлов. Попробуйте другой браузер или перетащите файл.",
    "Last stream restored. Press Play to resume.":"Последний поток восстановлен. Нажмите «Воспроизвести», чтобы продолжить.",
    "Last local file restored. Press Play to resume.":"Последний локальный файл восстановлен. Нажмите «Воспроизвести», чтобы продолжить.",
    "File restored. Press Play to resume.":"Файл восстановлен. Нажмите «Воспроизвести», чтобы продолжить.",
    "Choose the same file again to resume where you stopped.":"Выберите тот же файл, чтобы продолжить просмотр.",
    "Allow access or select the same file again to resume.":"Разрешите доступ или повторно выберите тот же файл.",
    "The saved file could not be reopened. Select it again.":"Не удалось повторно открыть сохранённый файл. Выберите его ещё раз.",
    "Choose your previously opened file to restore its saved position.":"Выберите ранее открытый файл для восстановления позиции.",
    "Enter a direct HTTP or HTTPS link to a media file.":"Введите прямую ссылку HTTP или HTTPS на медиафайл.",
    "Direct media URL added. If playback fails, check the source and format.":"Прямая ссылка добавлена. Если воспроизведение не начнётся, проверьте источник и формат.",
    "No saved links yet. Play a media URL, then choose 'Save URL to Library'.":"Пока нет сохранённых ссылок. Добавьте ссылку на медиафайл.",
    "Remove":"Удалить",
    "Remove all saved links from this browser?":"Удалить все сохранённые ссылки из этого браузера?",
    "Up Next cleared.":"Очередь воспроизведения очищена.",
    "This file or stream isn't supported by your browser, or the URL isn't direct media.":"Этот файл или поток не поддерживается браузером либо ссылка не ведёт непосредственно к медиафайлу.",
    "Network error: the remote media couldn't be reached.":"Ошибка сети: удалённый файл недоступен.",
    "The browser couldn't decode this media format.":"Браузер не может декодировать этот формат.",
    "Unable to play this media source.":"Не удалось воспроизвести источник.",
    "Picture in picture isn't available for this video or browser.":"Режим «Картинка в картинке» недоступен для этого видео или браузера.",
    "Fullscreen isn't available in this browser.":"Полноэкранный режим недоступен в этом браузере.",
    "Fullscreen isn't available for this video.":"Полноэкранный режим недоступен для этого видео.",
    "Not available for this media":"Недоступно для данного файла",
    "MKV subtitle track is detected but not exposed for playback by this browser.":"Дорожка MKV обнаружена, но браузер не позволяет её воспроизвести.",
    "Requires a browser audio track API or future DK Browser support":"Для выбора требуется поддержка аудиодорожек браузером или будущим ДК Браузером.",
    "Choose a .vtt or .srt subtitle file.":"Выберите файл субтитров .vtt или .srt.",
    "Subtitle track loaded.":"Дорожка субтитров загружена.",
    "Couldn't read that subtitle file.":"Не удалось прочитать файл субтитров.",
    "LIVE":"ЭФИР",
    "Save URL to Library":"Сохранить ссылку в медиатеку"
  };
  const exact = text => Object.prototype.hasOwnProperty.call(translations, text) ?
    translations[text] : null;
  const russianPlural = (number, one, few, many) => {
    const n = Math.abs(Number(number));
    if (n % 10 === 1 && n % 100 !== 11) return one;
    if (n % 10 >= 2 && n % 10 <= 4 && !(n % 100 >= 12 && n % 100 <= 14)) return few;
    return many;
  };
  function translate(input) {
    const text = String(input);
    const plain = text.trim();
    let translated = exact(plain);
    let m;
    if (translated === null && (m = /^(\d+) items?$/.exec(plain)))
      translated = m[1] + " " + russianPlural(m[1], "файл", "файла", "файлов");
    if (translated === null && (m = /^Added (\d+) files? to the queue\.$/.exec(plain)))
      translated = "Добавлено " + m[1] + " " + russianPlural(m[1], "файл", "файла", "файлов") + " в очередь.";
    if (translated === null && (m = /^Subtitles: (.+)$/.exec(plain)))
      translated = "Субтитры: " + m[1];
    if (translated === null && (m = /^Subtitles off · (\d+) embedded MKV tracks? found$/.exec(plain)))
      translated = "Субтитры выключены · Найдено " + m[1] + " " + russianPlural(m[1], "дорожка", "дорожки", "дорожек") + " MKV";
    if (translated === null && (m = /^Volume (\d+)%$/.exec(plain)))
      translated = "Громкость " + m[1] + "%";
    if (translated === null && (m = /^Restore (.+)$/.exec(plain)))
      translated = "Восстановить " + m[1];
    if (translated === null && (m = /^Play (.+)$/.exec(plain)))
      translated = "Воспроизвести " + m[1];
    if (translated === null && (m = /^Remove (.+)$/.exec(plain)))
      translated = "Удалить " + m[1];
    if (translated === null && (m = /^Subtitle track (\d+)$/.exec(plain)))
      translated = "Дорожка субтитров " + m[1];
    if (translated === null && (m = /^Audio track (\d+)$/.exec(plain)))
      translated = "Аудиодорожка " + m[1];
    if (translated === null && (m = /^(.+) · Needs DK Browser$/.exec(plain)))
      translated = m[1] + " · Нужен ДК Браузер";
    return translated === null ? text : text.replace(plain, translated);
  }
  function readLanguage() {
    try { return localStorage.getItem(key) === "ru" ? "ru" : "en"; }
    catch (_) { return "en"; }
  }
  let language = typeof document === "undefined" ? "en" : readLanguage();
  const texts = new WeakMap();
  const attrs = new WeakMap();
  const attrNames = ["aria-label", "title", "placeholder", "alt"];
  function renderText(node) {
    if (!node || node.nodeType !== 3 || !node.parentElement ||
        ["SCRIPT", "STYLE", "OPTION"].includes(node.parentElement.tagName)) return;
    const before = node.nodeValue;
    const previous = texts.get(node);
    const original = previous && previous.rendered === before ? previous.original : before;
    const after = language === "ru" ? translate(original) : original;
    texts.set(node, {original, rendered: after});
    if (before !== after) node.nodeValue = after;
  }
  function renderAttributes(element) {
    if (!element || element.nodeType !== 1) return;
    let saved = attrs.get(element);
    if (!saved) { saved = {}; attrs.set(element, saved); }
    for (const attr of attrNames) {
      const before = element.getAttribute(attr);
      if (before === null) continue;
      const previous = saved[attr];
      const original = previous && previous.rendered === before ? previous.original : before;
      const after = language === "ru" ? translate(original) : original;
      saved[attr] = {original, rendered:after};
      if (before !== after) element.setAttribute(attr, after);
    }
  }
  function walk(root) {
    if (!root) return;
    if (root.nodeType === 3) { renderText(root); return; }
    if (root.nodeType !== 1) return;
    renderAttributes(root);
    const nodes = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
    while (nodes.nextNode()) {
      const node = nodes.currentNode;
      if (node.nodeType === 3) renderText(node);
      else renderAttributes(node);
    }
  }
  function apply() {
    document.documentElement.lang = language;
    document.title = language === "ru" ? "ДК Медиаплеер | Веб" : "DK Media Player | Web";
    const selector = document.getElementById("languageSelect");
    if (selector) selector.value = language;
    walk(document.body);
  }
  function setLanguage(next) {
    language = next === "ru" ? "ru" : "en";
    try { localStorage.setItem(key, language); } catch (_) {}
    apply();
  }
  if (typeof document === "undefined") {
    if (typeof module !== "undefined") module.exports = {translate, translations, russianPlural};
    return;
  }
  window.DKLocale = {t: value => language === "ru" ? translate(value) : String(value),
    get: () => language, set: setLanguage, apply};
  apply();
  const select = document.getElementById("languageSelect");
  if (select) select.addEventListener("change", event => setLanguage(event.target.value));
  const observer = new MutationObserver(records => {
    for (const record of records) {
      if (record.type === "characterData") renderText(record.target);
      else if (record.type === "attributes") renderAttributes(record.target);
      else for (const node of record.addedNodes) walk(node);
    }
  });
  observer.observe(document.body, {subtree:true, childList:true, characterData:true,
    attributes:true, attributeFilter:attrNames});
})();
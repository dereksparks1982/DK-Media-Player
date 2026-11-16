(() => {
  "use strict";
  const byId = id => document.getElementById(id);
  const media = byId("media");
  const screen = byId("screen");
  const queueView = byId("queue");
  const libraryView = byId("libraryList");
  const store = {
    links: "dkmedia.web.links.v1",
    resume: "dkmedia.web.resume.v1",
    volume: "dkmedia.web.volume.v2",
    lastMedia: "dkmedia.web.last-media.v1"
  };
  const read = (key, fallback) => {
    try {
      const value = JSON.parse(localStorage.getItem(key));
      return value === null ? fallback : value;
    } catch (_) { return fallback; }
  };
  const write = (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); }
    catch (_) { /* Playback still works if storage is unavailable. */ }
  };
  const validURL = text => {
    try {
      const url = new URL(text);
      return ["https:", "http:"].includes(url.protocol) ? url.href : null;
    } catch (_) { return null; }
  };
  const savedLinks = read(store.links, []);
  const resumeData = read(store.resume, {});
  const state = {
    queue: [], current: -1, links: Array.isArray(savedLinks) ? savedLinks.filter(x => x && validURL(x.url) && typeof x.name === "string") : [],
    resume: resumeData && typeof resumeData === "object" && !Array.isArray(resumeData) ? resumeData : {},
    subtitleObject: null, subtitleNode: null, lastResumeSave: 0,
    restoreHandle: null, restorePickerPending: false
  };
  const current = () => state.queue[state.current] || null;

  // FileSystemFileHandle objects can be structured-cloned into IndexedDB.
  // Only a reference to the user's chosen file is stored, never its contents.
  // Local playback remains possible even if IndexedDB is unavailable.
  const handleDb = "dkmedia.web.local-files.v1";
  const handleStore = "handles";
  const lastHandleKey = "lastPlayingFile";
  const openHandleDatabase = () => new Promise((resolve, reject) => {
    if (!window.indexedDB) { reject(new Error("IndexedDB unavailable")); return; }
    const request = window.indexedDB.open(handleDb, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(handleStore)) {
        request.result.createObjectStore(handleStore);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Unable to open file storage"));
  });
  const storedHandle = async (operation, handle = null) => {
    const database = await openHandleDatabase();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(handleStore, operation === "read" ? "readonly" : "readwrite");
      const store = transaction.objectStore(handleStore);
      let result = null;
      const request = operation === "read" ? store.get(lastHandleKey) :
        operation === "save" ? store.put(handle, lastHandleKey) : store.delete(lastHandleKey);
      request.onsuccess = () => { result = request.result || null; };
      transaction.oncomplete = () => { database.close(); resolve(result); };
      transaction.onabort = () => {
        database.close();
        reject(transaction.error || new Error("Unable to update file storage"));
      };
    });
  };
  let handleWrites = Promise.resolve();
  const updateStoredHandle = handle => {
    // Serialize writes so the last media selection always wins.
    handleWrites = handleWrites.catch(() => {}).then(
      () => storedHandle(handle ? "save" : "delete", handle)
    );
    handleWrites.catch(() => { /* Browser storage can be disabled. */ });
  };
  const clearRememberedMedia = () => {
    try { localStorage.removeItem(store.lastMedia); } catch (_) {}
    updateStoredHandle(null);
    byId("restoreMedia").hidden = true;
    byId("restoreHint").hidden = true;
  };
  const rememberSelectedMedia = item => {
    if (item.kind === "url") {
      write(store.lastMedia, {kind: "url", name: item.name, url: item.src});
      updateStoredHandle(null);
    } else if (item.handle) {
      write(store.lastMedia, {kind: "file", name: item.name});
      updateStoredHandle(item.handle);
    } else {
      // Files selected via the legacy input or drag-and-drop are session-only.
      write(store.lastMedia, {kind: "temporary-file", name: item.name});
      updateStoredHandle(null);
    }
    byId("restoreMedia").hidden = true;
    byId("restoreHint").hidden = true;
  };
  const status = (message, good = false) => {
    const node = byId("status");
    node.textContent = message;
    node.classList.toggle("good", good);
  };
  const time = seconds => {
    if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
    const s = Math.floor(seconds);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return (h ? h + ":" + String(m).padStart(2, "0") : String(m)) + ":" + String(s % 60).padStart(2, "0");
  };
  const fileIsMedia = file => !!file && (
    (typeof file.type === "string" && /^(video|audio)\//.test(file.type)) ||
    /\.(mp4|m4v|mov|mkv|avi|webm|ogg|ogv|mp3|m4a|aac|wav|flac|opus|ts)$/i.test(file.name)
  );
  const fileIsAudio = file => !!file && (
    file.type.startsWith("audio/") || /\.(mp3|m4a|aac|wav|flac|opus)$/i.test(file.name)
  );
  const rememberPosition = () => {
    const item = current();
    if (!item || !Number.isFinite(media.duration) || media.duration <= 0) return;
    if (media.currentTime >= media.duration - 4) delete state.resume[item.key];
    else if (media.currentTime > 2) state.resume[item.key] = media.currentTime;
    const keys = Object.keys(state.resume);
    if (keys.length > 160) keys.slice(0, keys.length - 160).forEach(key => delete state.resume[key]);
    write(store.resume, state.resume);
  };
  const clearSubtitles = () => {
    if (state.subtitleNode) { state.subtitleNode.remove(); state.subtitleNode = null; }
    if (state.subtitleObject) { URL.revokeObjectURL(state.subtitleObject); state.subtitleObject = null; }
    byId("subtitleLabel").textContent = "No external subtitles";
  };
  const updateButtons = () => {
    const item = current();
    const isPlaying = !!item && !media.paused && !media.ended;
    byId("playPause").textContent = isPlaying ? "⏸" : "▶";
    byId("playPause").setAttribute("aria-label", isPlaying ? "Pause" : "Play");
    byId("playPause").title = isPlaying ? "Pause" : "Play";
    ["playPause", "stop"].forEach(id => { byId(id).disabled = !item; });
    byId("previous").disabled = state.current <= 0;
    byId("next").disabled = state.current < 0 || state.current >= state.queue.length - 1;
    byId("clearQueue").disabled = state.current >= 0 ? state.current >= state.queue.length - 1 : state.queue.length === 0;
    byId("addSubtitles").disabled = !item;
    const muted = media.muted || volumePercent === 0;
    byId("mute").classList.toggle("is-muted", muted);
    byId("mute").setAttribute("aria-label", muted ? "Unmute" : "Mute");
    byId("mute").title = muted ? "Unmute" : "Mute";
  };
  const updateTime = () => {
    const length = media.duration;
    const seekable = Number.isFinite(length) && length > 0;
    byId("currentTime").textContent = time(media.currentTime);
    byId("duration").textContent = seekable ? time(length) : current() ? "LIVE" : "0:00";
    byId("seek").disabled = !current() || !seekable;
    byId("seek").value = seekable ? String(Math.max(0, Math.min(1000, Math.round(1000 * media.currentTime / length)))) : "0";
  };
  const renderQueue = () => {
    queueView.replaceChildren();
    // The current video is not an upcoming video; keep it out of Up Next.
    const nextIndex = state.current + 1;
    const pending = state.queue.slice(nextIndex);
    byId("queueCount").textContent = pending.length ? pending.length + (pending.length === 1 ? " item" : " items") : "";
    pending.forEach((item, offset) => {
      const index = nextIndex + offset;
      const li = document.createElement("li");
      const play = document.createElement("button");
      play.type = "button";
      play.className = "item-play";
      play.title = "Play " + item.name;
      const icon = document.createElement("span");
      icon.textContent = item.audio ? "♫" : "▶";
      icon.setAttribute("aria-hidden", "true");
      const labels = document.createElement("span");
      labels.style.minWidth = "0";
      const title = document.createElement("span");
      title.className = "item-title";
      title.textContent = item.name;
      const source = document.createElement("span");
      source.className = "item-meta";
      source.textContent = item.kind === "file" ? "Local file" : "Remote URL";
      labels.append(title, source);
      play.append(icon, labels);
      play.addEventListener("click", () => load(index));
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "icon-btn remove";
      remove.textContent = "×";
      remove.title = "Remove from queue";
      remove.setAttribute("aria-label", "Remove " + item.name);
      remove.addEventListener("click", () => removeItem(index));
      li.append(play, remove);
      queueView.append(li);
    });
    updateButtons();
  };
  const idle = () => {
    clearSubtitles();
    state.current = -1;
    media.pause();
    media.removeAttribute("src");
    media.load();
    screen.classList.add("empty");
    screen.classList.remove("audio");
    byId("nowTitle").textContent = "Nothing playing";
    byId("nowSource").textContent = "Select media to get started";
    byId("kindBadge").textContent = "Ready";
    renderQueue();
    updateTime();
  };
  const playCurrent = () => {
    if (!current()) { status("Open a media file or paste a direct video link first."); return; }
    const result = media.play();
    if (result && typeof result.catch === "function") result.catch(err => {
      if (err && err.name === "NotAllowedError") status("Tap Play to start playback on this device.");
      else if (err && err.name !== "AbortError") status("Couldn't start this media. Check its format or source.");
    });
  };
  const load = (index, autoplay = true) => {
    if (index < 0 || index >= state.queue.length) return;
    rememberPosition();
    clearSubtitles();
    media.pause();
    state.current = index;
    const item = current();
    rememberSelectedMedia(item);
    media.src = item.src;
    media.load();
    screen.classList.remove("empty");
    screen.classList.toggle("audio", item.audio);
    screen.classList.remove("ui-hidden", "cursor-hidden");
    byId("nowTitle").textContent = item.name;
    byId("nowSource").textContent = item.kind === "file" ? "Local device · Not uploaded" : item.src;
    byId("kindBadge").textContent = item.kind === "file" ? "LOCAL" : "STREAM";
    renderQueue();
    updateTime();
    status("");
    if (autoplay) playCurrent();
  };
  const removeItem = index => {
    if (index < 0 || index >= state.queue.length) return;
    const wasCurrent = state.current === index;
    if (wasCurrent) rememberPosition();
    const old = state.queue.splice(index, 1)[0];
    if (wasCurrent) {
      if (state.queue.length) { state.current = -1; load(Math.min(index, state.queue.length - 1), false); }
      else { idle(); clearRememberedMedia(); }
    } else {
      if (index < state.current) state.current--;
      renderQueue();
    }
    if (old.kind === "file") URL.revokeObjectURL(old.src);
  };
  const addFiles = (files, handles = [], autoplay = true) => {
    const accepted = Array.from(files || []).map((file, index) => ({
      file, handle: handles[index] || null
    })).filter(entry => fileIsMedia(entry.file));
    if (!accepted.length) { status("No supported media file selected. Choose a video or audio file."); return; }
    const first = state.queue.length;
    for (const {file, handle} of accepted) state.queue.push({
      kind: "file", name: file.name, audio: fileIsAudio(file),
      src: URL.createObjectURL(file), handle,
      size: file.size, mime: file.type || "",
      key: "file:" + file.name + ":" + file.size + ":" + file.lastModified
    });
    renderQueue();
    if (state.current === -1) load(first, autoplay);
    status("Added " + accepted.length + (accepted.length === 1 ? " file" : " files") + " to the queue.", true);
  };

  // The Chromium picker returns persistent file handles. Firefox and other
  // browsers retain the standard file-input fallback, which is session-only.
  const openLocalFiles = async (autoplay = true) => {
    // DOM click events are passed to this handler by the ordinary Open buttons.
    if (typeof autoplay !== "boolean") autoplay = true;
    state.restorePickerPending = !autoplay;
    if (typeof window.showOpenFilePicker !== "function") {
      byId("filePicker").click();
      return;
    }
    try {
      const handles = await window.showOpenFilePicker({id: "dk-media-player", multiple: true});
      const selected = [];
      for (const handle of handles) {
        try {
          const file = await handle.getFile();
          if (fileIsMedia(file)) selected.push({file, handle});
        } catch (_) { /* Continue opening remaining files. */ }
      }
      if (selected.length) addFiles(selected.map(item => item.file),
                                    selected.map(item => item.handle), autoplay);
      else status("No readable video or audio file was selected.");
    } catch (error) {
      if (error && error.name === "AbortError") return;
      status("The file picker could not open. Try another browser or a file drop.");
    }
  };

  const showRestoreChoice = (saved, hint) => {
    const button = byId("restoreMedia");
    button.textContent = "Restore " + (saved.name || "last file");
    button.hidden = false;
    byId("restoreHint").textContent = hint;
    byId("restoreHint").hidden = false;
  };
  const restoreLastMedia = async () => {
    const saved = read(store.lastMedia, null);
    if (!saved || state.queue.length) return;
    if (saved.kind === "url" && validURL(saved.url)) {
      state.queue.push({
        kind: "url", name: saved.name || titleFromUrl(saved.url),
        src: saved.url, key: "url:" + saved.url,
        audio: /\.(mp3|m4a|aac|wav|flac|opus)(?:[?#]|$)/i.test(saved.url)
      });
      load(0, false);
      status("Last stream restored. Press Play to resume.", true);
      return;
    }
    if (saved.kind !== "file" && saved.kind !== "temporary-file") return;
    // Firefox and other file-input browsers cannot silently reopen a file.
    // Keep a useful one-click path to select it again and recover its position.
    showRestoreChoice(saved, "Choose the same file again to resume where you stopped.");
    if (saved.kind === "temporary-file") return;
    try {
      await handleWrites;
      const handle = await storedHandle("read");
      if (!handle || typeof handle.getFile !== "function" || state.queue.length) return;
      state.restoreHandle = handle;
      const permission = typeof handle.queryPermission === "function" ?
        await handle.queryPermission({mode: "read"}) : "prompt";
      if (state.queue.length) return;
      if (permission === "granted") {
        const file = await handle.getFile();
        if (state.queue.length) return;
        addFiles([file], [handle], false);
        status("Last local file restored. Press Play to resume.", true);
      } else {
        showRestoreChoice(saved, "Allow access or select the same file again to resume.");
      }
    } catch (_) {
      showRestoreChoice(saved, "The saved file could not be reopened. Select it again.");
    }
  };
  byId("restoreMedia").addEventListener("click", async () => {
    if (state.queue.length) return;
    const handle = state.restoreHandle;
    if (handle) {
      try {
        const permission = typeof handle.requestPermission === "function" ?
          await handle.requestPermission({mode: "read"}) : "prompt";
        if (permission === "granted") {
          const file = await handle.getFile();
          if (state.queue.length) return;
          addFiles([file], [handle], false);
          status("File restored. Press Play to resume.", true);
          return;
        }
      } catch (_) { /* Fall back to the normal file picker below. */ }
    }
    status("Choose your previously opened file to restore its saved position.");
    await openLocalFiles(false);
  });
  const titleFromUrl = url => {
    try {
      const part = decodeURIComponent(new URL(url).pathname.split("/").filter(Boolean).pop() || "");
      return part || "Remote media";
    } catch (_) { return "Remote media"; }
  };
  const addUrl = (raw, name) => {
    const url = validURL(raw.trim());
    if (!url) { status("Enter a direct HTTP or HTTPS link to a media file."); return; }
    const item = {kind: "url", name: name.trim() || titleFromUrl(url), src: url, key: "url:" + url, audio: /\.(mp3|m4a|aac|wav|flac|opus)(?:[?#]|$)/i.test(url)};
    state.queue.push(item);
    load(state.queue.length - 1);
    status("Direct media URL added. If playback fails, check the source and format.", true);
    byId("urlName").value = "";
  };
  const renderLibrary = () => {
    libraryView.replaceChildren();
    byId("clearLibrary").disabled = state.links.length === 0;
    if (!state.links.length) {
      const empty = document.createElement("li");
      empty.className = "empty-copy";
      empty.textContent = "No saved links yet. Play a media URL, then choose 'Save URL to Library'.";
      libraryView.append(empty);
      return;
    }
    for (const item of state.links) {
      const li = document.createElement("li");
      const details = document.createElement("div");
      details.className = "saved-meta";
      const title = document.createElement("strong");
      title.textContent = item.name;
      const location = document.createElement("small");
      location.textContent = item.url;
      details.append(title, location);
      const actions = document.createElement("div");
      actions.className = "saved-actions";
      const play = document.createElement("button");
      play.className = "btn primary small";
      play.textContent = "Play";
      play.type = "button";
      play.addEventListener("click", () => {
        addUrl(item.url, item.name);
        showPage("player");
      });
      const remove = document.createElement("button");
      remove.className = "btn ghost small";
      remove.textContent = "Remove";
      remove.type = "button";
      remove.addEventListener("click", () => {
        state.links = state.links.filter(link => link.url !== item.url);
        write(store.links, state.links);
        renderLibrary();
      });
      actions.append(play, remove);
      li.append(details, actions);
      libraryView.append(li);
    }
  };
  const showPage = name => {
    if (!["player", "library", "help"].includes(name)) name = "player";
    for (const page of ["player", "library", "help"]) byId("page-" + page).hidden = page !== name;
    document.querySelectorAll("[data-nav]").forEach(button => {
      if (button.dataset.nav === name) button.setAttribute("aria-current", "page");
      else button.removeAttribute("aria-current");
    });
  };
  document.querySelectorAll("[data-nav]").forEach(button => button.addEventListener("click", () => {
    const name = button.dataset.nav;
    showPage(name);
    if (location.hash !== "#" + name) location.hash = name;
  }));
  addEventListener("hashchange", () => showPage(location.hash.slice(1)));
  showPage(location.hash.slice(1));
  for (const id of ["openHeader", "openEmpty", "addQueueFiles"]) {
    byId(id).addEventListener("click", openLocalFiles);
  }
  byId("filePicker").addEventListener("change", event => {
    const autoplay = !state.restorePickerPending;
    state.restorePickerPending = false;
    if (event.target.files && event.target.files.length)
      addFiles(event.target.files, [], autoplay);
    event.target.value = "";
  });
  for (const eventName of ["dragenter", "dragover"]) screen.addEventListener(eventName, event => {
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = "copy";
    screen.classList.add("dragging");
  });
  for (const eventName of ["dragleave", "drop"]) screen.addEventListener(eventName, event => {
    event.preventDefault();
    screen.classList.remove("dragging");
  });
  screen.addEventListener("drop", event => addFiles(event.dataTransfer && event.dataTransfer.files));
  byId("urlForm").addEventListener("submit", event => {
    event.preventDefault();
    addUrl(byId("urlInput").value, byId("urlName").value);
  });
  byId("clearLibrary").addEventListener("click", () => {
    if (!state.links.length || !confirm("Remove all saved links from this browser?")) return;
    state.links = [];
    write(store.links, state.links);
    renderLibrary();
  });
  byId("clearQueue").addEventListener("click", () => {
    // Clearing Up Next should not interrupt the episode currently on screen.
    const old = state.queue.splice(state.current + 1);
    old.forEach(item => { if (item.kind === "file") URL.revokeObjectURL(item.src); });
    renderQueue();
    status("Up Next cleared.", true);
  });
  const togglePlayback = () => {
    if (!current()) return;
    if (media.paused || media.ended) playCurrent();
    else media.pause();
  };
  // On-picture controls are visible while paused, when focused, or while the
  // user interacts; they fade during uninterrupted playback.
  const controls = byId("screenControls");
  const contextMenu = byId("playerContextMenu");
  const infoPanel = byId("mediaInfo");
  let hideControlsTimer = null;
  let menuOpen = false;
  const revealControls = () => {
    screen.classList.remove("ui-hidden");
    clearTimeout(hideControlsTimer);
    if (!media.paused && current() && !menuOpen) {
      hideControlsTimer = setTimeout(() => {
        if (controls.matches(":hover") || controls.contains(document.activeElement) ||
            !infoPanel.hidden || menuOpen || media.paused) {
          revealControls();
          return;
        }
        screen.classList.add("ui-hidden");
      }, 2700);
    }
  };
  const keepControlsVisible = () => {
    clearTimeout(hideControlsTimer);
    screen.classList.remove("ui-hidden");
  };
  screen.addEventListener("pointermove", revealControls);
  screen.addEventListener("pointerleave", () => {
    if (!media.paused && current() && !menuOpen) revealControls();
  });
  // Cursor auto-hide works with fullscreen and normal player dimensions.
  let cursorIdleTimer = null;
  const showCursor = () => {
    screen.classList.remove("cursor-hidden");
    clearTimeout(cursorIdleTimer);
    if (!current() || menuOpen || !infoPanel.hidden) return;
    cursorIdleTimer = setTimeout(() => {
      if (!current() || menuOpen || !infoPanel.hidden ||
          !screen.matches(":hover") || controls.matches(":hover") ||
          controls.contains(document.activeElement)) return;
      screen.classList.add("cursor-hidden");
    }, 3000);
  };
  screen.addEventListener("pointermove", showCursor);
  screen.addEventListener("pointerenter", showCursor);
  screen.addEventListener("pointerdown", showCursor);
  screen.addEventListener("pointerleave", () => {
    clearTimeout(cursorIdleTimer);
    screen.classList.remove("cursor-hidden");
  });
  document.addEventListener("fullscreenchange", showCursor);
  controls.addEventListener("focusin", keepControlsVisible);
  controls.addEventListener("focusout", revealControls);
  for (const eventName of ["play", "pause", "ended", "emptied"]) {
    media.addEventListener(eventName, () => {
      if (media.paused || media.ended || !current()) keepControlsVisible();
      else revealControls();
    });
  }
  byId("playPause").addEventListener("click", togglePlayback);
  // Wait briefly before treating a video click as play/pause. Otherwise the
  // first click of a double-click pauses the film just before fullscreen.
  let pendingVideoClick = null;
  const cancelVideoClick = () => {
    if (pendingVideoClick !== null) {
      clearTimeout(pendingVideoClick);
      pendingVideoClick = null;
    }
  };
  media.addEventListener("click", event => {
    if (!current()) return;
    revealControls();
    if (event.detail > 1) { cancelVideoClick(); return; }
    cancelVideoClick();
    pendingVideoClick = setTimeout(() => {
      pendingVideoClick = null;
      togglePlayback();
    }, 330);
  });
  byId("stop").addEventListener("click", () => {
    media.pause();
    try { media.currentTime = 0; } catch (_) {}
    updateButtons();
    updateTime();
  });
  byId("previous").addEventListener("click", () => load(state.current - 1));
  byId("next").addEventListener("click", () => load(state.current + 1));
  byId("seek").addEventListener("input", event => {
    if (Number.isFinite(media.duration) && media.duration > 0) media.currentTime = media.duration * Number(event.target.value) / 1000;
  });
  media.addEventListener("loadedmetadata", () => {
    const item = current();
    if (!item) return;
    const position = Number(state.resume[item.key] || 0);
    if (position > 2 && Number.isFinite(media.duration) && position < media.duration - 4) {
      try { media.currentTime = position; } catch (_) {}
    }
    updateTime();
  });
  media.addEventListener("timeupdate", () => {
    updateTime();
    const now = Date.now();
    if (now - state.lastResumeSave > 5000) {
      state.lastResumeSave = now;
      rememberPosition();
    }
  });
  for (const eventName of ["play", "pause", "ended", "emptied"]) media.addEventListener(eventName, updateButtons);
  media.addEventListener("durationchange", updateTime);
  media.addEventListener("ended", () => {
    rememberPosition();
    if (state.current < state.queue.length - 1) load(state.current + 1);
  });
  media.addEventListener("error", () => {
    if (!current() || !media.error) return;
    const code = media.error.code;
    const message = code === 4 ? "This file or stream isn't supported by your browser, or the URL isn't direct media." :
      code === 2 ? "Network error: the remote media couldn't be reached." :
      code === 3 ? "The browser couldn't decode this media format." :
      "Unable to play this media source.";
    status(message);
    updateButtons();
  });
  let volumeOverlayTimer = null;
  const savedVolumeV2 = read(store.volume, null);
  const legacyVolume = Number(read("dkmedia.web.volume.v1", 1));
  // Older releases stored native media.volume as a decimal from 0 to 1.
  let volumePercent = savedVolumeV2 === null ? Math.round(legacyVolume * 100) :
    Number(savedVolumeV2);
  if (!Number.isFinite(volumePercent)) volumePercent = 100;
  // Normalize older saved volumes, including settings above 100%, without
  // connecting video to Web Audio (which caused playback glitches).
  volumePercent = Math.max(0, Math.min(100, Math.round(volumePercent)));
  const applyVolume = () => {
    media.volume = volumePercent / 100;
    byId("volume").value = String(volumePercent);
    byId("volumeValue").textContent = (media.muted ? 0 : volumePercent) + "%";
    updateButtons();
  };
  const showVolumeOverlay = () => {
    const overlay = byId("volumeOverlay");
    overlay.textContent = "Volume " + (media.muted ? 0 : volumePercent) + "%";
    overlay.classList.add("visible");
    clearTimeout(volumeOverlayTimer);
    volumeOverlayTimer = setTimeout(() => overlay.classList.remove("visible"), 950);
  };
  const setVolume = percent => {
    const next = Math.max(0, Math.min(100, Math.round(Number(percent))));
    if (!Number.isFinite(next)) return;
    volumePercent = next;
    media.muted = false;
    applyVolume();
    write(store.volume, volumePercent);
    showVolumeOverlay();
  };
  screen.addEventListener("wheel", event => {
    if (!current() || !event.deltaY) return;
    event.preventDefault();
    setVolume(volumePercent + (event.deltaY < 0 ? 5 : -5));
  }, {passive: false});

  applyVolume();
  byId("volume").addEventListener("input", event => setVolume(event.target.value));
  byId("mute").addEventListener("click", () => {
    media.muted = !media.muted;
    applyVolume();
    showVolumeOverlay();
  });
  byId("rate").addEventListener("change", event => { media.playbackRate = Number(event.target.value); });
  if (!document.pictureInPictureEnabled || typeof media.requestPictureInPicture !== "function") byId("pip").hidden = true;
  byId("pip").addEventListener("click", async () => {
    try {
      if (document.pictureInPictureElement) await document.exitPictureInPicture();
      else if (current()) await media.requestPictureInPicture();
    } catch (_) { status("Picture in picture isn't available for this video or browser."); }
  });
  const updateFullscreenButton = () => {
    const fullscreen = document.fullscreenElement === screen ||
      Boolean(media.webkitDisplayingFullscreen);
    const button = byId("fullscreen");
    button.setAttribute("aria-label", fullscreen ? "Exit fullscreen" : "Fullscreen");
    button.title = fullscreen ? "Exit fullscreen" : "Fullscreen";
    button.setAttribute("aria-pressed", String(fullscreen));
  };
  const toggleFullscreen = async () => {
    if (!current()) return;
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else if (media.webkitDisplayingFullscreen &&
                 typeof media.webkitExitFullscreen === "function") {
        media.webkitExitFullscreen();
      } else if (typeof screen.requestFullscreen === "function") {
        await screen.requestFullscreen();
      } else if (typeof media.webkitEnterFullscreen === "function") {
        // iOS may use native video fullscreen instead of fullscreen elements.
        media.webkitEnterFullscreen();
      } else {
        status("Fullscreen isn't available in this browser.");
      }
    } catch (_) {
      status("Fullscreen isn't available for this video.");
    }
    updateFullscreenButton();
  };
  byId("fullscreen").addEventListener("click", () => { void toggleFullscreen(); });
  // Double-click anywhere in the picture, including its black sidebars, to
  // enter/leave fullscreen without interrupting video playback.
  screen.addEventListener("dblclick", event => {
    if (!current() || current().audio ||
        (event.target.closest && event.target.closest("button,input,select,.player-context-menu,.media-info"))) return;
    event.preventDefault();
    cancelVideoClick();
    void toggleFullscreen();
  });
  // Video context menu works in normal and fullscreen mode because it lives
  // inside the fullscreen player surface, not the document body.
  const closeContextMenu = () => {
    contextMenu.hidden = true;
    contextMenu.replaceChildren();
    menuOpen = false;
    revealControls();
  };
  const addMenuHeading = label => {
    const heading = document.createElement("div");
    heading.className = "context-heading";
    heading.textContent = label;
    heading.setAttribute("role", "presentation");
    contextMenu.append(heading);
  };
  const addMenuItem = (label, action, options = {}) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "context-item";
    button.textContent = label;
    button.setAttribute("role", options.checked === undefined ? "menuitem" : "menuitemradio");
    if (options.checked !== undefined)
      button.setAttribute("aria-checked", String(Boolean(options.checked)));
    button.disabled = Boolean(options.disabled);
    if (options.disabled) button.title = options.reason || "Not available for this media";
    button.addEventListener("click", event => {
      event.stopPropagation();
      closeContextMenu();
      if (!button.disabled) action();
    });
    contextMenu.append(button);
    return button;
  };
  const availableTracks = () => {
    try { return Array.from(media.textTracks || []); }
    catch (_) { return []; }
  };
  const audioTracks = () => {
    try { return Array.from(media.audioTracks || []); }
    catch (_) { return []; }
  };
  const switchSubtitles = selected => {
    availableTracks().forEach((track, index) => {
      track.mode = index === selected ? "showing" : "disabled";
    });
  };
  const buildContextMenu = () => {
    contextMenu.replaceChildren();
    addMenuHeading("Playback");
    addMenuItem(media.paused ? "▶  Play" : "⏸  Pause", togglePlayback);
    addMenuItem("⏹  Stop", () => byId("stop").click());
    addMenuItem("⏮  Previous", () => byId("previous").click(), {disabled: state.current <= 0});
    addMenuItem("⏭  Next", () => byId("next").click(), {disabled: state.current >= state.queue.length - 1});
    addMenuItem("↶  Back 10 seconds", () => {
      if (Number.isFinite(media.duration)) media.currentTime = Math.max(0, media.currentTime - 10);
    }, {disabled: !Number.isFinite(media.duration)});
    addMenuItem("↷  Forward 10 seconds", () => {
      if (Number.isFinite(media.duration)) media.currentTime = Math.min(media.duration, media.currentTime + 10);
    }, {disabled: !Number.isFinite(media.duration)});
    addMenuHeading("Speed");
    for (const speed of [0.5, 0.75, 1, 1.25, 1.5, 2]) {
      addMenuItem(speed + "×", () => {
        media.playbackRate = speed;
        byId("rate").value = String(speed);
      }, {checked: Math.abs(media.playbackRate - speed) < 0.01});
    }
    addMenuHeading("Subtitles");
    const tracks = availableTracks().filter(track => track.kind === "subtitles" || track.kind === "captions");
    addMenuItem("Subtitles off", () => switchSubtitles(-1),
      {checked: tracks.every(track => track.mode !== "showing")});
    tracks.forEach(track => {
      addMenuItem(track.label || track.language || "Subtitle track",
        () => { availableTracks().forEach(t => { t.mode = t === track ? "showing" : "disabled"; }); },
        {checked: track.mode === "showing"});
    });
    addMenuItem("＋ Load SRT / VTT…", () => byId("subtitlePicker").click());
    addMenuHeading("Audio tracks");
    const audios = audioTracks();
    if (audios.length) {
      audios.forEach((track, index) => addMenuItem(
        track.label || track.language || "Audio track " + (index + 1),
        () => { audios.forEach(t => { t.enabled = t === track; }); },
        {checked: track.enabled}));
    } else {
      addMenuItem("Track selection not exposed by this browser", () => {},
        {disabled: true, reason: "Requires a browser audio track API or future DK Browser support"});
    }
    const chapters = availableTracks().filter(track => track.kind === "chapters");
    const cues = chapters.flatMap(track => {
      try { return Array.from(track.cues || []); }
      catch (_) { return []; }
    });
    if (cues.length) {
      addMenuHeading("Chapters");
      for (const cue of cues) addMenuItem(
        time(cue.startTime) + "  " + (cue.text || "Chapter"),
        () => { media.currentTime = cue.startTime; });
    }
    addMenuHeading("Picture");
    addMenuItem("Fit full picture", () => {
      screen.classList.remove("fit-cover");
    }, {checked: !screen.classList.contains("fit-cover")});
    addMenuItem("Fill frame (crop edges)", () => {
      screen.classList.add("fit-cover");
    }, {checked: screen.classList.contains("fit-cover")});
    addMenuItem(document.fullscreenElement ? "Exit fullscreen" : "Fullscreen",
      () => { void toggleFullscreen(); });
    addMenuItem("Picture in picture", () => byId("pip").click(),
      {disabled: byId("pip").hidden});
    addMenuItem("Media information", openMediaInfo);
  };
  const openMediaInfo = () => {
    const item = current();
    if (!item) return;
    const info = byId("mediaInfoDetails");
    info.replaceChildren();
    const addDetail = (label, value) => {
      const key = document.createElement("dt");
      key.textContent = label;
      const data = document.createElement("dd");
      data.textContent = String(value);
      info.append(key, data);
    };
    addDetail("Title", item.name);
    addDetail("Source", item.kind === "file" ? "Local file" : "Direct stream URL");
    if (item.size !== undefined) addDetail("Size", (item.size / 1048576).toFixed(1) + " MiB");
    if (item.mime) addDetail("Format", item.mime);
    if (media.videoWidth && media.videoHeight)
      addDetail("Resolution", media.videoWidth + " × " + media.videoHeight);
    addDetail("Duration", Number.isFinite(media.duration) ? time(media.duration) : "Live / unknown");
    addDetail("Speed", media.playbackRate + "×");
    addDetail("Subtitles", availableTracks().filter(t => t.kind === "subtitles" || t.kind === "captions").length);
    infoPanel.hidden = false;
    keepControlsVisible();
    byId("closeMediaInfo").focus();
  };
  byId("closeMediaInfo").addEventListener("click", () => {
    infoPanel.hidden = true;
    revealControls();
  });
  screen.addEventListener("contextmenu", event => {
    if (!current() || (event.target.closest && event.target.closest(".player-context-menu,.media-info"))) return;
    event.preventDefault();
    cancelVideoClick();
    buildContextMenu();
    contextMenu.hidden = false;
    menuOpen = true;
    keepControlsVisible();
    const bounds = screen.getBoundingClientRect();
    const rect = contextMenu.getBoundingClientRect();
    const x = Math.max(8, Math.min(bounds.width - rect.width - 8, event.clientX - bounds.left));
    const y = Math.max(8, Math.min(bounds.height - rect.height - 8, event.clientY - bounds.top));
    contextMenu.style.left = x + "px";
    contextMenu.style.top = y + "px";
    const first = contextMenu.querySelector("button:not(:disabled)");
    if (first) first.focus();
  });
  document.addEventListener("pointerdown", event => {
    if (menuOpen && !contextMenu.contains(event.target)) closeContextMenu();
  });
  contextMenu.addEventListener("keydown", event => {
    if (event.key === "Escape") { event.preventDefault(); closeContextMenu(); return; }
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    const options = Array.from(contextMenu.querySelectorAll("button:not(:disabled)"));
    const index = options.indexOf(document.activeElement);
    const next = (index + (event.key === "ArrowDown" ? 1 : -1) + options.length) % options.length;
    if (options[next]) { event.preventDefault(); options[next].focus(); }
  });
  document.addEventListener("fullscreenchange", updateFullscreenButton);
  media.addEventListener("webkitbeginfullscreen", updateFullscreenButton);
  media.addEventListener("webkitendfullscreen", updateFullscreenButton);
  updateFullscreenButton();
  byId("addSubtitles").addEventListener("click", () => byId("subtitlePicker").click());
  byId("subtitlePicker").addEventListener("change", async event => {
    const file = event.target.files && event.target.files[0];
    event.target.value = "";
    if (!file || !current()) return;
    if (!/\.(srt|vtt)$/i.test(file.name)) { status("Choose a .vtt or .srt subtitle file."); return; }
    try {
      let body = (await file.text()).replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
      if (/\.srt$/i.test(file.name)) {
        body = "WEBVTT\n\n" + body.replace(/(\d\d:\d\d:\d\d),(\d{3})/g, "$1.$2");
      } else if (!body.startsWith("WEBVTT")) body = "WEBVTT\n\n" + body;
      clearSubtitles();
      state.subtitleObject = URL.createObjectURL(new Blob([body], {type: "text/vtt"}));
      const track = document.createElement("track");
      track.kind = "subtitles";
      track.label = file.name;
      track.srclang = "en";
      track.src = state.subtitleObject;
      track.default = true;
      media.append(track);
      state.subtitleNode = track;
      track.addEventListener("load", () => { if (track.track) track.track.mode = "showing"; }, {once: true});
      if (track.track) track.track.mode = "showing";
      byId("subtitleLabel").textContent = file.name;
      status("Subtitle track loaded.", true);
    } catch (_) { status("Couldn't read that subtitle file."); }
  });
  document.addEventListener("keydown", event => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === "Escape") {
      if (menuOpen) { event.preventDefault(); closeContextMenu(); }
      else if (!infoPanel.hidden) { infoPanel.hidden = true; revealControls(); }
      return;
    }
    const tag = event.target && event.target.tagName;
    if (["INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(tag) ||
        byId("page-player").hidden || !current()) return;
    const key = event.key.toLowerCase();
    if ([" ", "k", "arrowleft", "arrowright", "arrowup", "arrowdown", "f", "m"].includes(key)) event.preventDefault();
    if (key === " " || key === "k") byId("playPause").click();
    if (key === "f") byId("fullscreen").click();
    if (key === "m") byId("mute").click();
    if (key === "arrowup") setVolume(volumePercent + 5);
    if (key === "arrowdown") setVolume(volumePercent - 5);
    if (key === "arrowleft" && Number.isFinite(media.duration)) media.currentTime = Math.max(0, media.currentTime - 5);
    if (key === "arrowright" && Number.isFinite(media.duration)) media.currentTime = Math.min(media.duration, media.currentTime + 5);
  });
  window.addEventListener("pagehide", () => {
    cancelVideoClick();
    clearTimeout(hideControlsTimer);
    clearTimeout(cursorIdleTimer);
    rememberPosition();
    clearSubtitles();
    state.queue.forEach(item => { if (item.kind === "file") URL.revokeObjectURL(item.src); });
  });
  renderLibrary();
  idle();
  // A restored file stays paused until the user presses Play.
  restoreLastMedia();
})();
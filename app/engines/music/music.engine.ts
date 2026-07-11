/**
 * Music Engine — onboarding data.
 *
 * Goal: a complete beginner makes and exports a first beat or short song.
 * StepInTheRing guides setup and creation; the music tool makes the file.
 *
 * Link policy: official first-party sources only, verified with HTTP checks.
 * lastVerifiedAt reflects the most recent check. LMMS (lmms.io) was a
 * candidate but its site returned errors on 2026-07-10 — excluded until it
 * verifies.
 */

import type { EngineOnboarding } from "../shared/onboarding.types";

const VERIFIED = "2026-07-10";

export const MUSIC_ENGINE: EngineOnboarding = {
  engineId: "music",
  title: "Music Engine",
  promise: "Make your first beat and export it as a real audio file. Free tools, guided steps, no experience needed.",
  status: "beta",

  resources: [
    {
      id: "bandlab",
      name: "BandLab",
      purpose: "Free music studio that runs in the browser (apps available for phone and tablet). Make beats, record, and export MP3s.",
      platforms: ["browser", "windows", "macos", "linux", "chromeos", "ios", "android"],
      officialUrl: "https://www.bandlab.com/",
      cost: "free",
      accountRequired: true,
      installRequired: false,
      source: "BandLab Technologies",
      lastVerifiedAt: VERIFIED,
      notes: "Free account. On phone or tablet, use the official BandLab app from your app store.",
    },
    {
      id: "garageband",
      name: "GarageBand",
      purpose: "Apple's free music studio for Mac. Loops, software instruments, recording, and export.",
      platforms: ["macos", "ios"],
      officialUrl: "https://www.apple.com/mac/garageband/",
      cost: "free",
      accountRequired: false,
      installRequired: true,
      source: "Apple",
      lastVerifiedAt: VERIFIED,
      notes: "Already installed on most Macs. If missing, get it from the Mac App Store.",
    },
    {
      id: "mpc-beats",
      name: "MPC Beats",
      purpose: "Akai's free beat-making software. Works with the MPK Mini's pads and keys out of the box.",
      platforms: ["windows", "macos"],
      officialUrl: "https://www.akaipro.com/mpc-beats",
      cost: "free",
      accountRequired: true,
      installRequired: true,
      source: "Akai Professional",
      lastVerifiedAt: VERIFIED,
      notes: "Free download after registering with Akai. Extra bundled software requires registering your hardware.",
    },
    {
      id: "audacity",
      name: "Audacity",
      purpose: "Free, open-source audio editor and recorder. Useful for trimming or converting your exported track.",
      platforms: ["windows", "macos", "linux"],
      officialUrl: "https://www.audacityteam.org/",
      cost: "open-source",
      accountRequired: false,
      installRequired: true,
      source: "Audacity Team / Muse Group",
      lastVerifiedAt: VERIFIED,
      notes: "Optional — only needed if you want to edit the audio file after export.",
    },
    {
      id: "akai-mpk-mini-mk3",
      name: "MPK Mini mk3 (product page)",
      purpose: "Official product page for the MPK Mini mk3 — specs, included software, and documentation.",
      platforms: ["windows", "macos"],
      officialUrl: "https://www.akaipro.com/mpk-mini-mk3",
      cost: "included-with-hardware",
      accountRequired: false,
      installRequired: false,
      source: "Akai Professional",
      lastVerifiedAt: VERIFIED,
    },
    {
      id: "akai-support",
      name: "Akai Support",
      purpose: "Official manuals, firmware, and troubleshooting for all MPK Mini models (mk3, Play mk3, and older).",
      platforms: ["browser", "windows", "macos", "linux", "chromeos", "ios", "android"],
      officialUrl: "https://www.akaipro.com/support",
      cost: "free",
      accountRequired: false,
      installRequired: false,
      source: "Akai Professional",
      lastVerifiedAt: VERIFIED,
      notes: "Models differ — find your exact model here for its manual and any drivers.",
    },
    {
      id: "garageband-support",
      name: "GarageBand Support",
      purpose: "Official Apple guides for GarageBand, including MIDI keyboard setup.",
      platforms: ["browser", "macos", "ios"],
      officialUrl: "https://support.apple.com/garageband",
      cost: "free",
      accountRequired: false,
      installRequired: false,
      source: "Apple",
      lastVerifiedAt: VERIFIED,
    },
  ],

  paths: [
    // ---- PATH A: NO EQUIPMENT ----
    {
      id: "no-equipment",
      name: "No equipment — browser or phone",
      description: "You have a computer, phone, or tablet and nothing else. BandLab runs in the browser and exports a real MP3.",
      platforms: ["browser", "windows", "macos", "linux", "chromeos", "ios", "android"],
      toolIds: ["bandlab"],
      setup: [
        { id: "a-headphones", label: "Connect headphones or speakers", detail: "Wired headphones are best — Bluetooth can lag while you play." },
        { id: "a-account", label: "Create a free BandLab account", detail: "Open bandlab.com and sign up. On phone or tablet, install the official BandLab app instead.", resourceId: "bandlab" },
        { id: "a-studio", label: "Open the Studio and confirm you hear sound", detail: "Create a new project and tap a pad or key on screen. If you hear it, setup is done." },
      ],
      steps: [
        { id: "a1", title: "Create a new project", detail: "In BandLab, choose Create New — start with an empty song or the beat maker.", external: true },
        { id: "a2", title: "Set the tempo", detail: "90 BPM is a comfortable starting speed. You can change it any time.", external: true },
        { id: "a3", title: "Pick a drum kit", detail: "Add a Drum Machine track and choose any kit that sounds good to you.", external: true },
        { id: "a4", title: "Make a 4-bar drum pattern", detail: "Simple recipe: kick on beats 1 and 3, snare on 2 and 4, hi-hats on every half beat. Loop it and listen.", external: true },
        { id: "a5", title: "Add a bass line", detail: "Add a bass track. Two or three repeating notes that follow the kick is enough.", external: true },
        { id: "a6", title: "Add one melody or loop", detail: "Add a keys or synth track, or drop in one loop from the free library. Keep it simple.", external: true },
        { id: "a7", title: "Arrange a beginning, middle, and end", detail: "Intro: drums alone. Middle: everything together. End: drop parts out. 30–60 seconds total is a real first track.", external: true },
        { id: "a8", title: "Save the project", detail: "Name it something you'll recognize, like first-beat.", external: true },
        { id: "a9", title: "Export the audio", detail: "Use Download / Export and choose MP3 or WAV. Save the file where you can find it.", external: true },
      ],
      output: "An exported MP3 or WAV of your first beat, plus a saved BandLab project you can keep improving.",
    },

    // ---- PATH A2: MAC / GARAGEBAND ----
    {
      id: "garageband-mac",
      name: "Mac — GarageBand",
      description: "You have a Mac. GarageBand is free, likely already installed, and exports real audio files.",
      platforms: ["macos"],
      toolIds: ["garageband", "garageband-support"],
      setup: [
        { id: "g-open", label: "Open GarageBand", detail: "Check your Applications folder. If it's missing, install it free from the Mac App Store.", resourceId: "garageband" },
        { id: "g-audio", label: "Connect headphones and confirm sound", detail: "Create an Empty Project with a Software Instrument track, then click keys with Musical Typing (Cmd+K)." },
      ],
      steps: [
        { id: "g1", title: "Create an empty project", detail: "Choose Empty Project → Software Instrument track.", external: true },
        { id: "g2", title: "Set the tempo", detail: "Set the project tempo to 90 BPM in the top bar.", external: true },
        { id: "g3", title: "Add a Drummer track", detail: "Track → New Track → Drummer. GarageBand plays a real-sounding beat you can shape.", external: true },
        { id: "g4", title: "Add a bass line", detail: "New Software Instrument track → pick a bass sound → record 2–3 repeating notes with Musical Typing (Cmd+K).", external: true },
        { id: "g5", title: "Add one melody or loop", detail: "Open the Loop Browser (O) and drag in one loop, or record simple keys.", external: true },
        { id: "g6", title: "Arrange a beginning, middle, and end", detail: "Drums alone → everything together → parts drop out. 30–60 seconds is plenty.", external: true },
        { id: "g7", title: "Save the project", detail: "File → Save. Name it first-beat.", external: true },
        { id: "g8", title: "Export the audio", detail: "Share → Export Song to Disk → MP3 or WAV.", external: true },
      ],
      output: "An exported MP3 or WAV of your first beat, plus a saved GarageBand project.",
    },

    // ---- PATH B: MPK MINI ----
    {
      id: "mpk-mini",
      name: "MPK Mini controller",
      description: "You have an Akai MPK Mini (mk3, Play mk3, or similar). Use its pads and keys with free MPC Beats on Windows or Mac.",
      platforms: ["windows", "macos"],
      requiredHardware: ["Akai MPK Mini (any recent model)", "USB cable (included with the controller)"],
      optionalHardware: ["Headphones (recommended)"],
      toolIds: ["mpc-beats", "akai-mpk-mini-mk3", "akai-support"],
      setup: [
        { id: "b-model", label: "Identify your MPK Mini model", detail: "The model name is printed on the unit (mk3, Play mk3, etc.). Models differ — if setup doesn't match these steps, find your model's manual on Akai Support.", resourceId: "akai-support" },
        { id: "b-download", label: "Download and install MPC Beats", detail: "Free from Akai after creating a free account.", resourceId: "mpc-beats" },
        { id: "b-connect", label: "Connect the MPK Mini by USB", detail: "Plug it directly into the computer. Recent models are class-compliant — no separate driver needed on Windows 10+/macOS. If it isn't detected, check Akai Support for your model." },
        { id: "b-midi", label: "Select the MPK Mini as the MIDI input", detail: "In MPC Beats: Preferences → MIDI → enable MPK Mini as an input. Windows and macOS menus differ slightly." },
        { id: "b-audio-out", label: "Select your audio output", detail: "Preferences → Audio → choose your headphones or speakers." },
        { id: "b-test", label: "Test a pad and a key", detail: "Load any drum program and tap a pad. Load a keygroup instrument and press a key. If you hear both, you're ready." },
      ],
      steps: [
        { id: "b1", title: "Create a new project in MPC Beats", detail: "Start empty or from a beat template.", external: true },
        { id: "b2", title: "Set the tempo", detail: "90 BPM to start.", external: true },
        { id: "b3", title: "Pick a drum program", detail: "Load a drum kit onto a track so the MPK pads trigger sounds.", external: true },
        { id: "b4", title: "Record a 4-bar drum pattern with the pads", detail: "Record-arm, count-in, then: kick on 1 and 3, snare on 2 and 4, hats in between. Quantize fixes the timing.", external: true },
        { id: "b5", title: "Record a bass line with the keys", detail: "Load a bass instrument on a new track. Two or three repeating notes that follow the kick.", external: true },
        { id: "b6", title: "Add one melody", detail: "Load keys or a synth and record a simple line, or use a built-in loop.", external: true },
        { id: "b7", title: "Arrange a beginning, middle, and end", detail: "Drums alone → everything → strip it back down. 30–60 seconds is a real first track.", external: true },
        { id: "b8", title: "Save the project", detail: "Name it first-beat.", external: true },
        { id: "b9", title: "Export the audio", detail: "Export / bounce the song as WAV or MP3 and save it where you can find it.", external: true },
      ],
      output: "An exported WAV or MP3 of your first beat, a saved MPC Beats project, and a working MPK Mini setup.",
    },
  ],

  troubleshooting: [
    { problem: "No sound in the browser tool", fix: "Check the tab isn't muted, check your system output device, and click inside the project once — browsers block audio until you interact with the page." },
    { problem: "MPK Mini not detected", fix: "Try a different USB port and cable, close other music apps that may hold the MIDI device, then restart MPC Beats. If it still fails, check your exact model on Akai Support." },
    { problem: "Notes sound late (latency)", fix: "Use wired headphones, close other tabs and apps. In desktop tools, lower the audio buffer size in audio preferences." },
    { problem: "Export option is hard to find", fix: "BandLab: Download/Export from the project menu. GarageBand: Share → Export Song to Disk. MPC Beats: File → Export." },
  ],

  limitations: [
    "StepInTheRing guides setup and creation — the music tool makes the audio file. Nothing is generated here.",
    "Export completion is confirmed by you; the browser cannot detect files saved by another app.",
    "Akai's bundled extra software is only included after registering the hardware with Akai.",
    "MPK Mini models differ; when in doubt, your model's official manual on Akai Support is the authority.",
  ],
};

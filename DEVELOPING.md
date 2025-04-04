# 🚀 Building a Tauri + Svelte Application with FFmpeg Statically Linked on Ubuntu

This guide provides **step-by-step instructions** to set up and build a **Tauri + Svelte** application with **FFmpeg dynamically linked** on **Ubuntu (WSL2 or native Linux)**.

---

## 📋 **Prerequisites**

Before compiling the application, you must have the following components installed:

- **Rust & Cargo** (for building Tauri)
- **Node.js & pnpm** (for frontend dependency management)
- **GTK, WebKitGTK, and other dependencies** (required by Tauri)
- **FFmpeg compiled as a static library** (you must compile it separately before building this application)

---

## 🛠 **1️⃣ Install Required System Dependencies**

Run the following command to install all required dependencies:

```bash
sudo apt update && sudo apt install -y \
    curl wget unzip patchelf \
    build-essential cmake pkg-config \
    libgtk-3-dev libgdk-pixbuf2.0-dev \
    libwebkit2gtk-4.1-dev libjavascriptcoregtk-4.1-dev \
    libsoup-3.0-dev \
    libclang-dev clang \
    libssl-dev libxdo-dev file\
    libavutil-dev libavformat-dev libavfilter-dev \
    libavdevice-dev \
    libayatana-appindicator3-dev librsvg2-dev \
    libx11-dev libxcb1-dev libx11-xcb-dev libxcomposite-dev \
    libxcursor-dev libxdamage-dev libxext-dev libxfixes-dev \
    libxi-dev libxrandr-dev libxrender-dev libxtst-dev \
    libasound2-dev libudev-dev libfreetype6-dev zlib1g-dev \
    libnss3-dev libxss-dev libdbus-1-dev libxkbcommon-dev \
    fuse libfuse2 desktop-file-utils xdg-utils \
    ffmpeg
```

This installs:

- **Build tools**: build-essential, cmake, pkg-config
- **GTK and WebKitGTK**: libgtk-3-dev, libgdk-pixbuf2.0-dev, libwebkit2gtk-4.1-dev, libjavascriptcoregtk-4.1-dev
- **Networking support** (required for Tauri): libsoup-3.0-dev
- **Clang compiler** (required for Rust bindings): libclang-dev, clang
- **SSL** (needed for some Rust libraries): libssl-dev

---

## 🦀 2️⃣ Install Rust and Cargo

Install Rust using rustup:

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

Then, restart your terminal or run:

```bash
source $HOME/.cargo/env
```

---

## 🌍 3️⃣ Install Node.js and pnpm

Node.js is required for the frontend (Svelte + Tauri). Install Node.js and pnpm:

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
npm install -g pnpm
```

---

## 🔨 4️⃣ Install Tauri CLI

```bash
cargo install tauri-cli
```

#### 🔹 Set Environment Variables

Export the required environment variables:

```bash
export PKG_CONFIG_PATH="/usr/local/lib:/usr/lib/x86_64-linux-gnu:/usr/share:$PKG_CONFIG_PATH"
```

To make this configuration persistent, add these lines to your `~/.bashrc` or `~/.zshrc`:

```bash
echo 'export PKG_CONFIG_PATH="/usr/local/lib:/usr/lib/x86_64-linux-gnu:/usr/share:$PKG_CONFIG_PATH"' >> ~/.bashrc

source ~/.bashrc
```

---

## 🏗 5️⃣ Clone and Build the Application

If your project is already created, navigate to your project directory and install the dependencies:

```bash
cd /path/to/your/project
pnpm i
```

Then, compile the application in release mode:

```bash
cargo build --release
```

To generate an installer package with Tauri:

```bash
pnpm run tauri build
```


## ✅ **Final Summary**

| Step   | Action                             |
| ------ | ---------------------------------- |
| **1️⃣** | Install system dependencies        |
| **2️⃣** | Install Rust and Cargo             |
| **3️⃣** | Install Node.js and pnpm           |
| **4️⃣** | Install Tauri CLI                  |
| **5️⃣** | Clone and compile the application  |

---

## 🎯 Conclusion

By following these steps, you will successfully compile your Tauri + Svelte application. 🚀

If you need further assistance, feel free to ask. Happy coding! 🎬🔥🚀

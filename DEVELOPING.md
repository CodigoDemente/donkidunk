# 🚀 Building a Tauri + Svelte Application with FFmpeg Statically Linked on Ubuntu

This guide provides **step-by-step instructions** to set up and build a **Tauri + Svelte** application with **FFmpeg statically linked** on **Ubuntu (WSL2 or native Linux)**.

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
    curl wget \
    build-essential cmake pkg-config \
    libgtk-3-dev libgdk-pixbuf2.0-dev \
    libwebkit2gtk-4.1-dev libjavascriptcoregtk-4.1-dev \
    libsoup-3.0-dev \
    libclang-dev clang \
    libssl-dev
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
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
npm install -g pnpm
```

---

## 🔨 4️⃣ Install Tauri CLI

```bash
cargo install tauri-cli
```

---

## 🎬 5️⃣ Configure FFmpeg Static Library

To compile the application, you must have FFmpeg compiled as a static library. Check [this repo](https://github.com/zimbatm/ffmpeg-static) for instructions on how to do that.

#### 🔹 Find the Correct Paths

Run the following command to find where your FFmpeg static libraries are located:

```bash
find /usr /home -name "libavcodec.a" 2>/dev/null
```

If FFmpeg was compiled statically, you should see an output like:

```
/home/user/ffmpeg/lib/libavcodec.a
/home/user/ffmpeg/lib/libavformat.a
/home/user/ffmpeg/lib/libavutil.a
```

Use this directory (/home/user/ffmpeg/lib/) in the next step.

#### 🔹 Set Environment Variables

Export the required environment variables:

```bash
export FFMPEG_DIR="/home/user/ffmpeg"
export LIBRARY_PATH="$FFMPEG_DIR/lib:$LIBRARY_PATH"
export PKG_CONFIG_PATH="$FFMPEG_DIR/lib:/usr/local/lib:/usr/lib/x86_64-linux-gnu:/usr/share:$PKG_CONFIG_PATH"
export LD_LIBRARY_PATH="$FFMPEG_DIR/lib:$LD_LIBRARY_PATH"
export LIBCLANG_PATH=/usr/lib/llvm-14/lib/
```

To make this configuration persistent, add these lines to your `~/.bashrc` or `~/.zshrc`:

```bash
echo 'export FFMPEG_DIR="/home/user/ffmpeg"' >> ~/.bashrc
echo 'export LIBRARY_PATH="$FFMPEG_DIR/lib:$LIBRARY_PATH"' >> ~/.bashrc
echo 'export PKG_CONFIG_PATH="$FFMPEG_DIR/lib:/usr/local/lib:/usr/lib/x86_64-linux-gnu:/usr/share:$PKG_CONFIG_PATH"' >> ~/.bashrc
echo 'export LD_LIBRARY_PATH="$FFMPEG_DIR/lib:$LD_LIBRARY_PATH"' >> ~/.bashrc
echo 'export LIBCLANG_PATH=/usr/lib/llvm-14/lib/' >> ~/.bashrc

source ~/.bashrc
```

---

## 🏗 6️⃣ Clone and Build the Application

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

## 🔍 **7️⃣ Verify That FFmpeg Is Statically Linked**

To confirm that **FFmpeg is correctly embedded** into the binary, run:

objdump -p target/release/my-app | grep NEEDED

If the output **does not include** `libavcodec.so`, `libavformat.so`, or `libavutil.so`, then ✅ **FFmpeg is statically linked**.

If you see:

```
NEEDED               libavcodec.so.58
NEEDED               libavformat.so.58
NEEDED               libavutil.so.56
```

Then **FFmpeg is still linked dynamically**, and you need to review your static FFmpeg build configuration.

---

## ✅ **Final Summary**

| Step   | Action                             |
| ------ | ---------------------------------- |
| **1️⃣** | Install system dependencies        |
| **2️⃣** | Install Rust and Cargo             |
| **3️⃣** | Install Node.js and pnpm           |
| **4️⃣** | Install Tauri CLI                  |
| **5️⃣** | Configure FFmpeg static build      |
| **6️⃣** | Clone and compile the application  |
| **7️⃣** | Verify FFmpeg is statically linked |

---

## 🎯 Conclusion

By following these steps, you will successfully compile your Tauri + Svelte application with FFmpeg statically linked, ensuring that the final binary does not require FFmpeg to be installed on the system. 🚀

If you encounter errors, check the dependency verification section (objdump -p target/release/my-app | grep NEEDED).

If you need further assistance, feel free to ask. Happy coding! 🎬🔥🚀

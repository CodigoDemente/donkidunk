FROM ubuntu:24.04

# Install dependencies
RUN apt-get update
RUN apt-get upgrade -y
RUN apt-get install -y \
    curl wget unzip \
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
    fuse libfuse2 desktop-file-utils xdg-utils

# Install rust
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
ENV PATH="/root/.cargo/bin:${PATH}"
ENV RUSTUP_HOME="/root/.rustup"
RUN rustup default stable
RUN rustup override set stable
RUN rustup show

# Install nodejs
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
RUN apt-get install -y nodejs
RUN npm i -g pnpm

# Set PKG_CONFIG_PATH
ENV PKG_CONFIG_PATH="/usr/local/lib:/usr/lib/x86_64-linux-gnu:/usr/share"

# Delete all apt cache and lists
RUN apt-get clean
RUN rm -rf /var/lib/apt/lists/*
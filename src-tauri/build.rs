fn main() {
    println!("cargo:rustc-link-lib=static=avcodec");
    println!("cargo:rustc-link-lib=static=avformat");
    println!("cargo:rustc-link-lib=static=avutil");
    println!("cargo:rustc-link-lib=static=swscale");
    println!("cargo:rustc-link-lib=static=swresample");

    println!("cargo:rustc-link-search=native=/home/ale/Workspace/ffmpeg-static/target/lib");

    tauri_build::build()
}

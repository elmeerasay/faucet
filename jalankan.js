const { exec } = require('child_process');

// Daftar file JavaScript dengan path relatif
const jsFiles = [
    './claimfaucet.js',
    './kodebaru.js',
    './autogeneratewallet.js',
    './satukan_all_token.js'
];

function runFile(filePath) {
    return new Promise((resolve, reject) => {
        const process = exec(`node ${filePath}`);

        // Menampilkan output stdout secara real-time tanpa label tambahan
        process.stdout.on('data', (data) => {
            const trimmedData = data.trim();  // Menghapus spasi atau newline tidak perlu
            if (trimmedData.length > 0) {     // Pastikan tidak menampilkan baris kosong
                console.log(trimmedData);
            }
        });

        // Menampilkan error stderr secara real-time tanpa label tambahan
        process.stderr.on('data', (data) => {
            const trimmedError = data.trim(); // Menghapus spasi atau newline tidak perlu
            if (trimmedError.length > 0) {    // Pastikan tidak menampilkan baris kosong
                console.error(trimmedError);
            }
        });

        // Ketika proses selesai
        process.on('close', (code) => {
            if (code === 0) {
                resolve(`Process ${filePath} completed successfully.`);
            } else {
                reject(`Process ${filePath} exited with code ${code}`);
            }
        });
    });
}

async function runAllFiles() {
    for (const file of jsFiles) {
        try {
            console.log(`\nRunning ${file}`);
            await runFile(file);
        } catch (error) {
            console.error(error);
        }
    }
}

async function loopRunAllFiles() {
    while (true) {
        try {
            await runAllFiles();
        } catch (error) {
            console.error('Error during runAllFiles:', error);
        }
        await new Promise(resolve => setTimeout(resolve, 6000)); // Menunggu 6 detik sebelum memulai ulang
    }
}

// Memulai loop
loopRunAllFiles();

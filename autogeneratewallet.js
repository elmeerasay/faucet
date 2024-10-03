require('dotenv').config();
const fs = require('fs');
const { ethers } = require('ethers');

// Cek apakah MNEMONIC sudah ada di .env atau tidak
let MNEMONIC = process.env.MNEMONIC;

// Fungsi untuk membuat mnemonic baru jika belum ada
function createHDWallet(walletCount) {
    let envContent = fs.readFileSync('.env', 'utf8');

    // Jika ada mnemonic, address, dan private key lama, backup semua
    if (MNEMONIC) {
        let backupIndex = 1;
        // Cari backup terakhir yang ada di .env untuk mnemonic
        while (envContent.includes(`MNEMONICBACKUP${backupIndex}`)) {
            backupIndex++;
        }

        // Backup mnemonic, address, dan private key yang lama
        envContent = envContent.replace(/MNEMONIC=.+/g, `MNEMONICBACKUP${backupIndex}="${MNEMONIC}"`);
        envContent = envContent.replace(/ADDRESS_(\d+)=.+/g, (match, p1) => {
            return match.replace(`ADDRESS_${p1}`, `ADDRESSBACKUP${p1}_${backupIndex}`);
        });
        envContent = envContent.replace(/PRIVATE_KEY_(\d+)=.+/g, (match, p1) => {
            return match.replace(`PRIVATE_KEY_${p1}`, `PRIVATEKEYBACKUP${p1}_${backupIndex}`);
        });
        console.log(`Mnemonic lama di-backup sebagai MNEMONICBACKUP${backupIndex}`);
    }

    // Generate mnemonic baru
    const randomMnemonic = ethers.utils.entropyToMnemonic(ethers.utils.randomBytes(16));
    console.log(`Mnemonic baru dibuat: "${randomMnemonic}\n"`);
    MNEMONIC = randomMnemonic;

    // Generate HD wallet dari mnemonic baru
    const hdNode = ethers.utils.HDNode.fromMnemonic(MNEMONIC);

    // Tambahkan mnemonic baru di bagian atas
    let newContent = `MNEMONIC="${MNEMONIC}"\n`;

    // Tambahkan address dan private key baru di bagian atas sesuai jumlah wallet dari input user
    for (let i = 0; i < walletCount; i++) { 
        const wallet = hdNode.derivePath(`m/44'/60'/0'/0/${i}`);
        const address = wallet.address;
        const privateKey = wallet.privateKey;

        newContent += `ADDRESS_${i + 1}=${address}\n`;
        newContent += `PRIVATE_KEY_${i + 1}=${privateKey}\n`;

        console.log(`Number\t\t: ${i + 1}`);
        console.log(`Address\t\t: ${address}`);
        console.log(`Private Key\t: ${privateKey}`);
    }

    // Tambahkan mnemonic, address, dan private key baru di bagian atas file .env
    envContent = newContent + "\n" + envContent;

    // Tulis ulang envContent ke file .env
    fs.writeFileSync('.env', envContent.trim() + '\n');
}

// Langsung panggil fungsi dengan jumlah wallet yang diinginkan
createHDWallet(1);

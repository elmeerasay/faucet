require('dotenv').config();
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

const RPC_URL = process.env.RPC_URL;
const MAIN_ACCOUNT = process.env.MAIN_ACCOUNT || process.env.ADDRESS_1;
//const MAIN_ACCOUNT = '0x3e096fdf89b27306239d7290cced3a381c531a60'
const provider = new ethers.providers.JsonRpcProvider(RPC_URL);

// Fungsi untuk mengambil private key dari baris ke-7 di file .env
function getPrivateKeyFromLine(lineNumber) {
    const envFilePath = path.resolve(__dirname, '.env'); // Lokasi file .env
    const envFile = fs.readFileSync(envFilePath, 'utf-8');
    const envLines = envFile.split('\n');

    if (envLines.length >= lineNumber) {
        const line = envLines[lineNumber - 1].trim(); // Ambil baris tertentu, pastikan untuk mengabaikan spasi kosong
        const [key, value] = line.split('='); // Pisahkan antara nama variabel dan nilai
        if (key && value) {
            return value.trim(); // Ambil nilai private key
        }
    }
    throw new Error(`Private key not found on line ${lineNumber}`);
}

// Mengambil private key dari baris ke-7
const privateKey = getPrivateKeyFromLine(7);

async function sendETH(wallet) {
    try {
        const balance = await wallet.getBalance();
        const balanceInEth = ethers.utils.formatEther(balance);
        console.log(`ETH Balance: ${balanceInEth} ETH`);

        const gasPrice = await provider.getGasPrice();
        const gasLimit = 21000; // Gas limit untuk transfer ETH

        // Hitung jumlah yang harus disisakan (sekitar $1 dalam ETH)
        const amountToLeave = ethers.utils.parseEther('0.0005'); // Ganti dengan nilai yang sesuai jika perlu

        const valueAfterGas = balance.sub(gasPrice.mul(gasLimit)).sub(amountToLeave); // Menghitung saldo setelah biaya gas dan jumlah yang disisakan

        if (valueAfterGas.gt(0)) {
            // Kirim saldo yang tersisa ke MAIN_ACCOUNT
            const tx = {
                to: MAIN_ACCOUNT,
                value: valueAfterGas,
                gasPrice: gasPrice,
                gasLimit: gasLimit
            };

            const transaction = await wallet.sendTransaction(tx);
            await transaction.wait();
            console.log(`Mengirim ${ethers.utils.formatEther(valueAfterGas)} ETH ke ${MAIN_ACCOUNT}\nTx hash ${transaction.hash.slice(0, 10)}...`);
        } else {
            console.log('Tidak cukup saldo untuk mengirim ETH setelah menyisakan $1.');
        }
    } catch (error) {
        console.error(`Error sending ETH from ${wallet.address}:`, error.message);
    }
}

async function sendAll() {
    if (!privateKey) {
        console.log(`Private key not found in line 7.`);
        return;
    }

    const wallet = new ethers.Wallet(privateKey, provider);

    console.log(`\nAddress\t: ${wallet.address}`);
    console.log(`To\t: ${MAIN_ACCOUNT}`);
    console.log(`Process\t:`);

    await sendETH(wallet);
}

sendAll().catch(console.error);

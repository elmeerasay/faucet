require('dotenv').config();
const { ethers } = require('ethers');

// Ambil data dari .env
const rpcUrl = process.env.RPC_URL; // URL RPC dari node yang Anda gunakan
const privateKey = process.env.PRIVATE_KEY_1; // Private key pengirim
const toAddress = process.env.TO_ADDRESS; // Alamat penerima
const USDT  = process.env.USDT_HEX_DATA; // Data hex untuk WBTC
const WETH = process.env.WETH_HEX_DATA; // Data hex untuk WETH
const WBTC = process.env.WBTC_HEX_DATA; // Data hex untuk WETH
const USDC = process.env.USDC_HEX_DATA; // Data hex untuk WETH

// Inisialisasi provider dan wallet
const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
const wallet = new ethers.Wallet(privateKey, provider);

// Fungsi untuk mengirim transaksi
async function sendTransaction(data, transactionLabel) {
    const tx = {
        to: toAddress,
        data: data
    };

    try {
        const txResponse = await wallet.sendTransaction(tx);
        console.log(`Transaction ${transactionLabel}\nTx hash: ${txResponse.hash.slice(0, 10)}...`);
        
        const receipt = await txResponse.wait();
        console.log(`Transaction ${transactionLabel} confirmed in block: ${receipt.blockNumber}`);
    } catch (error) {
        console.error(`Error sending transaction ${transactionLabel}:`, error.reason);
    }
}

// Fungsi utama untuk mengirimkan dua transaksi
async function sendTransactions() {
    try {
        console.log("Starting USDT claim...");
        await sendTransaction(USDT, 'Claim USDT');
        
        console.log("Starting WETH claim...");
        await sendTransaction(WETH, 'Claim WETH');

        console.log("Starting WBTC claim...");
        await sendTransaction(WBTC, 'Claim WBTC');
        
        console.log("Starting USDC claim...");
        await sendTransaction(USDC, 'Claim USDC');
    } catch (error) {
        console.error("Error during transactions:", error.reason);
    }
}

sendTransactions().catch(console.error);

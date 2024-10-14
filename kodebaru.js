require('dotenv').config();
const { ethers } = require('ethers');

// Load environment variables
const rpcUrl = process.env.RPC_URL;
const addressKeys = [];

for (let i = 1; i <= 5; i++) { // 1 angka mulai. 5 jumlah tx dr address
    const address = process.env[`ADDRESS_${i}`];
    const privateKey = process.env[`PRIVATE_KEY_${i}`];
    if (address && privateKey) {
        addressKeys.push({ address, privateKey });
    }
}

// Initialize provider and wallets for each address
const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
const wallets = addressKeys.map(({ privateKey }) => new ethers.Wallet(privateKey, provider));

// Define the router contract
const routerAddress = '0x48630D9914A9F87A485ABE0779cAa9E58ff0F604';
const routerAbi = [
    'function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) payable returns (uint[] memory amounts)',
    "function swapExactTokensForTokens(uint256 amountIn, uint256 amountOutMin, address[] calldata path, address to, uint256 deadline) returns (uint[] memory amounts)",
    'function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) returns (uint[] memory amounts)',
    'function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)',
    'function getAmountsIn(uint amountOut, address[] calldata path) external view returns (uint[] memory amounts)'
];

const erc20Abi = [
    'function approve(address spender, uint256 amount) public returns (bool)',
    'function balanceOf(address owner) view returns (uint256)'
];

let logSequence = 1;

async function getBalance(tokenAddress, wallet) {
    if (tokenAddress === ethers.constants.AddressZero) {
        return await provider.getBalance(wallet.address);
    } else {
        const tokenContract = new ethers.Contract(tokenAddress, erc20Abi, wallet);
        return await tokenContract.balanceOf(wallet.address);
    }
}

async function logStatus(wallet) {
    const ETHBalance = await getBalance('0x0000000000000000000000000000000000000000', wallet); // ETH token address
    const WETHBalance = await getBalance('0x0AC1CC398342Aab9f8fFE43dD578B2dF59ceEa5E', wallet);
    const WBTCBalance = await getBalance('0x8cce37e4a9752dd313c5F842Da3e57C7a1519D92', wallet);
    const USDTBalance = await getBalance('0x97368885747176170506A65C0096b91236b744e7', wallet);
    const USDCBalance = await getBalance('0x6F405A7fdc7b4B1Ffad1C821a6bA89f13b48c4F3', wallet);

    console.log(`Number\t\t: ${logSequence++}\nETH Balance\t: ${ethers.utils.formatUnits(ETHBalance, 18)} ETH`);
    console.log(`WBTC Balance\t: ${ethers.utils.formatUnits(WBTCBalance, 18)} WBTC`);
    console.log(`WETH Balance\t: ${ethers.utils.formatUnits(WETHBalance, 18)} WETH`);
    console.log(`USDT Balance\t: ${ethers.utils.formatUnits(USDTBalance, 6)} USDT`);
    console.log(`USDC Balance\t: ${ethers.utils.formatUnits(USDCBalance, 6)} USDC`);
}

async function approveToken(tokenAddress, amount, wallet) {
    let success = false;
    while (!success) {
        try {
            const tokenContract = new ethers.Contract(tokenAddress, erc20Abi, wallet);
            const tx = await tokenContract.approve(routerAddress, amount);
            await tx.wait();
            console.log('Status\t\t: Approved');
            success = true;
        } catch (error) {
            console.error('Status\t\t: Approval failed. Retrying in 5 seconds...\n', error.reason);
            await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds before retrying
        }
    }
}

async function estimateSwap(routerContract, amountIn, path) {
    const amountsOut = await routerContract.getAmountsOut(amountIn, path);
    return amountsOut[amountsOut.length - 1];
}

async function swapTokens(routerContract, amountIn, path) {
    let success = false;
    while (!success) {
        try {
            const estimatedAmountOut = await estimateSwap(routerContract, amountIn, path);
            const to = routerContract.signer.address;
            const deadline = Math.floor(Date.now() / 1000) + 60 * 20;
            const slippage = 0.001; // 0.1% slippage
            const amountOutMin = estimatedAmountOut.mul(1000 - slippage * 1000).div(1000);


            const tx = await routerContract.swapExactTokensForTokens(
                amountIn,
                amountOutMin,
                path,
                to,
                deadline
            );

            console.log(`Estimated\t: ${ethers.utils.formatUnits(estimatedAmountOut, 18)} USDT`);
            console.log(`Tx Hash\t\t: ${tx.hash.slice(0, 10)}...`);

            await tx.wait();
            console.log('Status\t\t: Sukses!');
            success = true;
        } catch (error) {
            console.error('Status\t\t: Transaction failed. Retrying in 5 seconds...\n', error.reason);
            await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds before retrying
        }
    }
}

async function swapUSDTtoETH(routerContract, amountIn, path) {
    let success = false;
    while (!success) {
        try {
            const estimatedAmountOut = await estimateSwap(routerContract, amountIn, path);
            const to = routerContract.signer.address;
            const deadline = Math.floor(Date.now() / 1000) + 60 * 20;
            const slippage = 0.001; // 0.1% slippage
            const amountOutMin = estimatedAmountOut.mul(1000 - slippage * 1000).div(1000);


            const tx = await routerContract.swapExactTokensForETH(
                amountIn,
                amountOutMin,
                path,
                to,
                deadline
            );

            console.log(`Estimated\t: ${ethers.utils.formatUnits(estimatedAmountOut, 18)} ETH`);
            console.log(`Tx Hash\t\t: ${tx.hash.slice(0, 10)}...`);

            await tx.wait();
            console.log('Status\t\t: Sukses!');
            success = true;
        } catch (error) {
            console.error('Status\t\t: Transaction failed. Retrying in 5 seconds...\n', error.reason);
            await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds before retrying
        }
    }
}

async function performSwaps() {
    for (const wallet of wallets) {
        const routerContract = new ethers.Contract(routerAddress, routerAbi, wallet);

        await logStatus(wallet);

        try {
            // Swap WETH to USDT
            const WETHtoUSDTPath = [
                '0x0AC1CC398342Aab9f8fFE43dD578B2dF59ceEa5E',
                '0x4200000000000000000000000000000000000006'
            ];
            const WETHBalance = await getBalance('0x0AC1CC398342Aab9f8fFE43dD578B2dF59ceEa5E', wallet);
            if (WETHBalance.gt(0)) {
                const amountInWETH = WETHBalance;
                await approveToken('0x0AC1CC398342Aab9f8fFE43dD578B2dF59ceEa5E', amountInWETH, wallet);
                await swapUSDTtoETH(routerContract, amountInWETH, WETHtoUSDTPath);
            } else {
                console.log('Status\t\t: WETH balance is 0, skipping swap.');
            }

            await new Promise(resolve => setTimeout(resolve, 3000));

            // Swap WBTC to USDT
            const WBTCtoUSDTPath = [
                '0x8cce37e4a9752dd313c5F842Da3e57C7a1519D92',
                '0x4200000000000000000000000000000000000006'
            ];
            const WBTCBalance = await getBalance('0x8cce37e4a9752dd313c5F842Da3e57C7a1519D92', wallet);
            if (WBTCBalance.gt(0)) {
                const amountInWBTC = WBTCBalance;
                await approveToken('0x8cce37e4a9752dd313c5F842Da3e57C7a1519D92', amountInWBTC, wallet);
                await swapUSDTtoETH(routerContract, amountInWBTC, WBTCtoUSDTPath);
            } else {
                console.log('Status\t\t: WBTC balance is 0, skipping swap.');
            }

            await new Promise(resolve => setTimeout(resolve, 3000));

            // Swap USDT to ETH
            const USDTtoETHPath = [
                '0x97368885747176170506A65C0096b91236b744e7',
                '0x4200000000000000000000000000000000000006'
            ];
            const USDTBalance = await getBalance('0x97368885747176170506A65C0096b91236b744e7', wallet);
            if (USDTBalance.gt(0)) {
                const amountInUSDT = USDTBalance;
                await approveToken('0x97368885747176170506A65C0096b91236b744e7', amountInUSDT, wallet);
                await swapUSDTtoETH(routerContract, amountInUSDT, USDTtoETHPath);
            } else {
                console.log('Status\t\t: USDT balance is 0, skipping swap.');
            }

            await new Promise(resolve => setTimeout(resolve, 3000));

            // Swap USDC to ETH
            const USDCtoETHPath = [
                '0x6F405A7fdc7b4B1Ffad1C821a6bA89f13b48c4F3',
                '0x4200000000000000000000000000000000000006'
            ];
            const USDCBalance = await getBalance('0x6F405A7fdc7b4B1Ffad1C821a6bA89f13b48c4F3', wallet);
            if (USDCBalance.gt(0)) {
                const amountInUSDC = USDCBalance;
                await approveToken('0x6F405A7fdc7b4B1Ffad1C821a6bA89f13b48c4F3', amountInUSDC, wallet);
                await swapUSDTtoETH(routerContract, amountInUSDC, USDCtoETHPath);
            } else {
                console.log('Status\t\t: USDT balance is 0, skipping swap.');
            }

            await new Promise(resolve => setTimeout(resolve, 3000));

        } catch (error) {
            console.error('Status\t\t: An error occurred during the swap process\n', error.reason);
        }

        const ETHBalance = await getBalance('0x0000000000000000000000000000000000000000', wallet);
        console.log(`Total ETH\t: ${ethers.utils.formatUnits(ETHBalance, 18)} ETH`);
        const USDTBalance = await getBalance('0x97368885747176170506A65C0096b91236b744e7', wallet);
        console.log(`Total USDT\t: ${ethers.utils.formatUnits(USDTBalance, 18)} USDT\n`);
    }
}

performSwaps().catch(console.error);


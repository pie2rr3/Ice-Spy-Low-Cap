const axios = require('axios');
const fs = require('fs');

const ETHERSCAN_API_KEY = "1S7HW5655DWV8BHKSIKD3F6XC2NJ4MBWWH";
const ETHERSCAN_API_URL = 'https://api.etherscan.io/api';
const TOP_HOLDERS_FILE = '/Users/pierre/Desktop/XD/git/Ice-Spy-Low-Cap copie/src/data/json/top_holders.json';
const OUTPUT_FILE = '/Users/pierre/Desktop/XD/git/Ice-Spy-Low-Cap copie/src/data/json/top_wallet.json';

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function getEtherBalance(address, tokenName, walletIndex, totalWallets, tokenIndex, totalTokens) {
    const url = `${ETHERSCAN_API_URL}?module=account&action=balance&address=${address}&tag=latest&apikey=${ETHERSCAN_API_KEY}`;
    console.log(`Analyse des holders de ${tokenName} (${walletIndex + 1}/${totalWallets}) [${tokenIndex}/${totalTokens}]: Balance récupérée pour ${address}`);
    try {
        const response = await axios.get(url);
        console.log(`Balance récupérée pour ${address}`);
        return response.data.result;
    } catch (error) {
        if (error.code === 'ECONNRESET') {
            console.error(`Connexion réinitialisée, nouvelle tentative pour ${address}...`);
            await sleep(10000);
            return getEtherBalance(address, tokenName, walletIndex, totalWallets, tokenIndex, totalTokens);
        }
        console.error(`Erreur lors de la récupération du solde pour ${address}:`, error);
        return null;
    }
}

async function filterTopWallets(minBalance = 1, maxBalance = Number.MAX_SAFE_INTEGER) {
    try {
        const topHolders = JSON.parse(fs.readFileSync(TOP_HOLDERS_FILE, 'utf-8'));
        const topWallets = {};
        const totalTokens = Object.keys(topHolders).length;
        let tokenIndex = 0;

        for (const [token, holders] of Object.entries(topHolders)) {
            topWallets[token] = [];
            let totalWallets = holders.length;

            for (let i = 0; i < holders.length; i++) {
                const holder = holders[i];
                const balanceWei = await getEtherBalance(holder.wallet_address, token, i, totalWallets, tokenIndex, totalTokens);
                const balanceEther = balanceWei / 1e18;

                if (balanceEther >= minBalance && balanceEther <= maxBalance) {
                    topWallets[token].push({
                        wallet_address: holder.wallet_address,
                        balance: balanceEther
                    });
                }
                await sleep(200);
            }
            tokenIndex++;
        }

        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(topWallets, null, 2));
        console.log('Résultats enregistrés dans:', OUTPUT_FILE);
    } catch (error) {
        console.error('Erreur lors du traitement:', error);
    }
}

module.exports = filterTopWallets;
// filterTopWallets();
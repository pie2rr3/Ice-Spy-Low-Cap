const axios = require('axios');
const fs = require('fs');

const ETHERSCAN_API_KEY = "1S7HW5655DWV8BHKSIKD3F6XC2NJ4MBWWH";
const ETHERSCAN_API_URL = 'https://api.etherscan.io/api';
const TOP_HOLDERS_FILE = '/Users/pierre/Desktop/XD/git/Ice-Spy-Low-Cap copie/src/data/json/top_holders.json';
const OUTPUT_FILE = '/Users/pierre/Desktop/XD/git/Ice-Spy-Low-Cap copie/src/data/json/top_wallet.json';

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function getEtherBalances(addresses) {
    const url = `${ETHERSCAN_API_URL}?module=account&action=balancemulti&address=${addresses.join(',')}&tag=latest&apikey=${ETHERSCAN_API_KEY}`;
    try {
        const response = await axios.get(url);
        return response.data.result;
    } catch (error) {
        console.error('Erreur lors de la récupération des soldes:', error);
        return [];
    }
}

async function filterTopWallets(minBalance = 1, maxBalance = Number.MAX_SAFE_INTEGER) {
    try {
        const topHolders = JSON.parse(fs.readFileSync(TOP_HOLDERS_FILE, 'utf-8'));
        const topWallets = {};

        for (const [token, holders] of Object.entries(topHolders)) {
            topWallets[token] = [];
            const addresses = holders.map(holder => holder.wallet_address);

            for (let i = 0; i < addresses.length; i += 20) {
                const addressBatch = addresses.slice(i, i + 20);
                const balances = await getEtherBalances(addressBatch);

                balances.forEach(balance => {
                    const balanceEther = balance.balance / 1e18;
                    if (balanceEther >= minBalance && balanceEther <= maxBalance) {
                        topWallets[token].push({
                            wallet_address: balance.account,
                            balance: balanceEther
                        });
                    }
                });

                await sleep(200);
            }
        }

        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(topWallets, null, 2));
        console.log('Résultats enregistrés dans:', OUTPUT_FILE);
    } catch (error) {
        console.error('Erreur lors du traitement:', error);
    }
}

module.exports = filterTopWallets;

// filterTopWallets();

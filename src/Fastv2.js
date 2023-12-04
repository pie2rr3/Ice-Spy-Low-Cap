const axios = require('axios');
const fs = require('fs');

const ETHERSCAN_API_KEY = "1S7HW5655DWV8BHKSIKD3F6XC2NJ4MBWWH";
const ETHERSCAN_API_URL = 'https://api.etherscan.io/api';
const TOP_HOLDERS_FILE = '/Users/pierre/Desktop/XD/git/Ice-Spy solo/src/data/top_holders.json';
const OUTPUT_FILE = '/Users/pierre/Desktop/XD/git/Ice-Spy solo/src/data/top_wallet.json';

async function getEtherBalance(address) {
  const url = `${ETHERSCAN_API_URL}?module=account&action=balance&address=${address}&tag=latest&apikey=${ETHERSCAN_API_KEY}`;
  try {
    const response = await axios.get(url);
    return response.data.result;
  } catch (error) {
    console.error(`Erreur lors de la récupération du solde pour l'adresse ${address}:`, error);
    return null;
  }
}

async function filterTopWallets() {
  try {
    const topHolders = JSON.parse(fs.readFileSync(TOP_HOLDERS_FILE, 'utf-8'));
    const topWallets = {};

    for (const [token, holders] of Object.entries(topHolders)) {
      topWallets[token] = [];

      for (const holder of holders) {
        const balanceWei = await getEtherBalance(holder.wallet_address);
        const balanceEther = balanceWei / 1e18;

        if (balanceEther > 2) {
          topWallets[token].push({
            wallet_address: holder.wallet_address,
            balance: balanceEther
          });
        }
      }
    }

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(topWallets, null, 2));
    console.log('Résultats enregistrés dans:', OUTPUT_FILE);
  } catch (error) {
    console.error('Erreur lors du traitement:', error);
  }
}

filterTopWallets();

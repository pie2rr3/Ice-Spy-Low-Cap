const axios = require('axios');
const fs = require('fs');
const csv = require('csv-parser');
const { Parser } = require('json2csv');

const API_KEY = '1S7HW5655DWV8BHKSIKD3F6XC2NJ4MBWWH';
const ETHERSCAN_API_BASE_URL = 'https://api.etherscan.io/api';

async function getFirstTransactions(contractAddress) {
  try {
    const response = await axios.get(ETHERSCAN_API_BASE_URL, {
      params: {
        module: 'account',
        action: 'txlist',
        address: contractAddress,
        startblock: 0,
        endblock: 99999999,
        sort: 'asc',
        apikey: API_KEY,
      },
    });

    if (response.data.status === '1') {
      return response.data.result.slice(0, 5);
    } else {
      console.error(
        `Erreur lors de la récupération des transactions pour l'adresse du contrat ${contractAddress}: ${response.data.message}`
      );
      return [];
    }
  } catch (error) {
    console.error(`Erreur lors de la récupération des transactions pour l'adresse du contrat ${contractAddress}:`, error);
    return [];
  }
}

async function getEarlyTransactionsForPerformingCryptos() {
  const contractAddresses = [];

  fs.createReadStream('/Users/pierre/Desktop/XD/git/Ice-Spy solo/Dexscreener Data/ETH_data.csv')
    .pipe(csv())
    .on('data', (data) => {
      const address = data['Adresse'];
      const pairName = data['Nom de la paire'];

      if (address && address.startsWith('0x')) {
        contractAddresses.push({ address, pairName });
      }
    })
    .on('end', async () => {
      console.log('Nombre d\'adresses à traiter:', contractAddresses.length);

      const earlyTransactions = [];
      const uniqueWallets = {};

      for (const { address: contractAddress, pairName } of contractAddresses) {
        console.log(`Traitement de l'adresse de contrat: ${contractAddress}`);
        const transactions = await getFirstTransactions(contractAddress);
        for (const transaction of transactions) {
          const walletKey = `${pairName}-${transaction.from}`;
          if (!uniqueWallets[walletKey]) {
            uniqueWallets[walletKey] = true;
            earlyTransactions.push({
              'Nom de la paire': pairName,
              'Early wallet': transaction.from,
            });
          }
        }
        await new Promise(resolve => setTimeout(resolve, 3000));
      }

      if (earlyTransactions.length > 0) {
        const json2csvParser = new Parser();
        const csvData = json2csvParser.parse(earlyTransactions);
        fs.writeFileSync('/Users/pierre/Desktop/XD/git/Ice-Spy solo/Wallets/Early_ETH.csv', csvData);
        console.log('Les transactions précoces ont été sauvegardées dans Early_ETH.csv');
      } else {
        console.log('Aucune transaction précoce trouvée.');
      }
      
    });
}

async function run() {
  return connectToEtherscan();
}
module.exports = { run };

getEarlyTransactionsForPerformingCryptos();

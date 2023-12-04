const axios = require('axios');
const fs = require('fs');

const CHAINBASE_API_URL = 'https://api.chainbase.online/v1/token/top-holders';
const CHAINBASE_API_KEY = '2YrYygb1gOscIeNsPEwlzY7k6ga';
const ETHERSCAN_API_KEY = "1S7HW5655DWV8BHKSIKD3F6XC2NJ4MBWWH";
const ETHERSCAN_API_URL = 'https://api.etherscan.io/api';
const TRENDING_TOKENS_FILE = 'C:\\Users\\Olivi\\OneDrive\\Bureau\\Github\\Ice-Spy-Low-Cap\\src\\data\\json\\top_trending_tokens.json';
const OUTPUT_FILE = 'C:\\Users\\Olivi\\OneDrive\\Bureau\\Github\\Ice-Spy-Low-Cap\\src\\data\\json\\top_holders.json';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function isEOA(address) {
  try {
    const response = await axios.get(ETHERSCAN_API_URL, {
      params: {
        module: 'contract',
        action: 'getabi',
        address: address,
        apikey: ETHERSCAN_API_KEY,
      },
    });

    const abi = response.data.result;
    return !(abi && abi !== 'Contract source code not verified');
  } catch (error) {
    console.error(error);
    return null;
  }
}

async function getTopTokenHolders(tokenAddress, limit = 100) {
  try {
    const options = {
      url: `${CHAINBASE_API_URL}?chain_id=1&contract_address=${tokenAddress}&page=1&limit=${limit}`,
      method: 'GET',
      headers: {
        'x-api-key': CHAINBASE_API_KEY,
        'accept': 'application/json'
      }
    };

    const response = await axios(options);
    let holders = response.data.data || [];
    holders = await Promise.all(holders.map(async holder => {
      if (holder.wallet_address !== '0x000000000000000000000000000000000000dead' && await isEOA(holder.wallet_address)) {
        return holder;
      }
    }));

    return holders.filter(holder => holder !== undefined);
  } catch (error) {
    console.error(`Erreur lors de la récupération des top holders pour ${tokenAddress}:`, error);
    return [];
  }
}

async function processTopTokens() {
  const results = {};
  try {
    const trendingTokens = JSON.parse(fs.readFileSync(TRENDING_TOKENS_FILE, 'utf-8'));

    for (const token of trendingTokens) {
      console.log(`Récupération des top holders pour le token ${token.name}...`);
      const holders = await getTopTokenHolders(token.address);
      results[token.name] = holders;

      await sleep(2000); 
    }

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(results, null, 2));
    console.log('Résultats enregistrés dans:', OUTPUT_FILE);
  } catch (error) {
    console.error('Erreur lors du traitement des tokens:', error);
  }
}

module.exports = processTopTokens;
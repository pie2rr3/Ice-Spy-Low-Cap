const axios = require('axios');
const fs = require('fs');
const { Alchemy, Network } = require("alchemy-sdk");

const CHAINBASE_API_URL = 'https://api.chainbase.online/v1/token/top-holders';
const CHAINBASE_API_KEY = '2YrYygb1gOscIeNsPEwlzY7k6ga';
const TRENDING_TOKENS_FILE = '/Users/pierre/Desktop/XD/git/Ice-Spy-Low-Cap copie/src/data/json/top_trending_tokens.json';
const OUTPUT_FILE = '/Users/pierre/Desktop/XD/git/Ice-Spy-Low-Cap copie/src/data/json/top_holders.json';

const config = {
    apiKey: "iXuyrFvGvM4aS1JqMJN2Xi-xYPj60qt7",
    network: Network.ETH_MAINNET,
};
const alchemy = new Alchemy(config);

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function isContract(address) {
    try {
        return await alchemy.core.isContractAddress(address);
    } catch (error) {
        console.error(error);
        return false;
    }
}

async function getTopTokenHolders(tokenAddress, limit = 50) {
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

    holders = holders.filter(holder => holder.wallet_address !== '0x000000000000000000000000000000000000dead');
    holders = holders.slice(0, limit);

    return holders;
  } catch (error) {
    console.error(`Erreur lors de la récupération des top holders pour ${tokenAddress}:`, error);
    return [];
  }
}

async function processTopTokens(limit) {
  try {
      const trendingTokens = JSON.parse(fs.readFileSync(TRENDING_TOKENS_FILE, 'utf-8'));
      const results = {};

      for (const token of trendingTokens) {
          console.log(`Récupération des top holders pour le token ${token.name}...`);
          const holders = await getTopTokenHolders(token.address, limit);
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

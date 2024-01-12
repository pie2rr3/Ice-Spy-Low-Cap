const axios = require('axios');
const fs = require('fs').promises;
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
        const response = await axios.get(`${CHAINBASE_API_URL}?chain_id=1&contract_address=${tokenAddress}&page=1&limit=${limit}`, {
            headers: {
                'x-api-key': CHAINBASE_API_KEY,
                'accept': 'application/json'
            }
        });
        return response.data.data || [];
    } catch (error) {
        console.error(`Erreur lors de la récupération des top holders pour ${tokenAddress}:`, error);
        return [];
    }
}

async function processTopTokens(limit) {
    try {
        const trendingTokens = JSON.parse(await fs.readFile(TRENDING_TOKENS_FILE, 'utf-8'));
        const results = {};

        for (const token of trendingTokens) {
            console.log(`Récupération des top holders pour le token ${token.name}...`);
            let holders = await getTopTokenHolders(token.address, limit);
            holders = holders.filter(holder => holder.wallet_address.toLowerCase() !== '0x000000000000000000000000000000000000dead');

            const uniqueAddresses = [...new Set(holders.map(holder => holder.wallet_address))];

            const contractChecks = await Promise.all(uniqueAddresses.map(async address => {
                return { address, isContract: await isContract(address) };
            }));

            const contractMap = new Map(contractChecks.map(item => [item.address, item.isContract]));
            results[token.name] = holders.filter(holder => !contractMap.get(holder.wallet_address));

            await sleep(500);
        }

        await fs.writeFile(OUTPUT_FILE, JSON.stringify(results, null, 2));
        console.log('Résultats enregistrés dans:', OUTPUT_FILE);
    } catch (error) {
        console.error('Erreur lors du traitement des tokens:', error);
    }
}

module.exports = processTopTokens;

// processTopTokens();

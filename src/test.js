const axios = require('axios');
const fs = require('fs');

const API_KEY = '1S7HW5655DWV8BHKSIKD3F6XC2NJ4MBWWH';
const WALLET_ADDRESS = '0x6d9148e201304aa9cca58a759a134a3fb58fe718';
const BASE_URL = `http://api.etherscan.io/api`;

async function fetchTokenTransactions(walletAddress) {
    try {
        const response = await axios.get(`${BASE_URL}?module=account&action=tokentx&address=${walletAddress}&page=1&offset=10&sort=desc&apikey=${API_KEY}`);
        return response.data.result;
    } catch (error) {
        console.error('Error fetching token transactions:', error);
        return [];
    }
}

async function main() {
    const tokenTransactions = await fetchTokenTransactions(WALLET_ADDRESS);
    
    fs.writeFileSync('tokenTransactions.json', JSON.stringify(tokenTransactions, null, 2));
    console.log('Token transactions saved to tokenTransactions.json');
}

main();

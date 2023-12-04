const axios = require('axios');
const fs = require('fs');

const API_KEY = 'cqt_rQdhGV6KmvHfTHBGVxJCgcyB3Tv9';
const INPUT_FILE_PATH = '/Users/pierre/Desktop/XD/git/Ice-Spy solo/src/classifiedTransactions.json';
const OUTPUT_FILE_PATH = '/Users/pierre/Desktop/XD/git/Ice-Spy solo/src/transactionsWithPrices.json';

async function fetchHistoricalPrice(chainName, quoteCurrency, contractAddress, date) {
    try {
        const response = await axios.get(`https://api.covalenthq.com/v1/pricing/historical_by_addresses_v2/${chainName}/${quoteCurrency}/${contractAddress}/`, {
            params: {
                from: date,
                to: date,
                'prices-at-asc': true
            },
            headers: { 'Authorization': `Bearer ${API_KEY}` }
        });
        return response.data.data[0].prices[0].price;
    } catch (error) {
        console.error('Error fetching historical price:', error);
        return null;
    }
}

function formatDate(timestamp) {
    const date = new Date(timestamp * 1000);
    return date.toISOString().split('T')[0]; 
}


async function enrichTransactionsWithPrices(transactions) {
    for (const transaction of transactions) {
        const date = formatDate(transaction.timeStamp);
        const price = await fetchHistoricalPrice('eth-mainnet', 'USD', transaction.contractAddress, date);
        transaction.priceAtTransaction = price;
    }
}

async function main() {
    const classifiedTransactions = JSON.parse(fs.readFileSync(INPUT_FILE_PATH, 'utf8'));

    await enrichTransactionsWithPrices(classifiedTransactions.buys);
    await enrichTransactionsWithPrices(classifiedTransactions.sells);

    fs.writeFileSync(OUTPUT_FILE_PATH, JSON.stringify(classifiedTransactions, null, 2));
    console.log(`Transactions with prices saved to ${OUTPUT_FILE_PATH}`);
}

main();

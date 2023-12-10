const axios = require('axios');
const fs = require('fs');

const API_KEY_ETHERSCAN = '1S7HW5655DWV8BHKSIKD3F6XC2NJ4MBWWH';
const API_KEY_COVALENT = 'cqt_rQdhGV6KmvHfTHBGVxJCgcyB3Tv9';
const TOP_WALLETS_FILE_PATH = '/Users/pierre/Desktop/XD/git/Ice-Spy-Low-Cap copie/src/data/json/top_wallet.json';
const OUTPUT_FILE_PATH = '/Users/pierre/Desktop/XD/git/Ice-Spy-Low-Cap copie/src/data/json/top_performer.json';
const BASE_URL_ETHERSCAN = `https://api.etherscan.io/api`;

async function fetchTokenTransactions(walletAddress) {
    try {
        const response = await axios.get(`${BASE_URL_ETHERSCAN}?module=account&action=tokentx&address=${walletAddress}&page=1&offset=20&sort=desc&apikey=${API_KEY_ETHERSCAN}`);
        return response.data.result;
    } catch (error) {
        console.error('Error fetching token transactions:', error);
        return [];
    }
}

function classifyTransactions(transactions, walletAddress) {
    const classifiedTransactions = {};

    transactions.forEach(transaction => {
        const tokenSymbol = transaction.tokenSymbol;
        if (!classifiedTransactions[tokenSymbol]) {
            classifiedTransactions[tokenSymbol] = { buys: [], sells: [] };
        }

        if (transaction.to.toLowerCase() === walletAddress.toLowerCase()) {
            classifiedTransactions[tokenSymbol].buys.push(transaction);
        } else if (transaction.from.toLowerCase() === walletAddress.toLowerCase()) {
            classifiedTransactions[tokenSymbol].sells.push(transaction);
        }
    });

    return classifiedTransactions;
}


async function fetchHistoricalPrice(chainName, quoteCurrency, contractAddress, date) {
    try {
        const response = await axios.get(`https://api.covalenthq.com/v1/pricing/historical_by_addresses_v2/${chainName}/${quoteCurrency}/${contractAddress}/`, {
            params: {
                from: date,
                to: date,
                'prices-at-asc': true
            },
            headers: { 'Authorization': `Bearer ${API_KEY_COVALENT}` }
        });

        if (response.data && response.data.data && response.data.data[0] && response.data.data[0].prices && response.data.data[0].prices[0]) {
            return response.data.data[0].prices[0].price;
        } else {
            console.log(`No price data available for ${contractAddress} on ${date}`);
            return null;
        }
    } catch (error) {
        console.error('Error fetching historical price:', error);
        return null;
    }
}



function formatDate(timestamp) {
    const date = new Date(timestamp * 1000);
    return date.toISOString().split('T')[0];
}

async function enrichTransactionsWithPrices(classifiedTransactions) {
    for (const tokenSymbol of Object.keys(classifiedTransactions)) {
        const tokenTransactions = classifiedTransactions[tokenSymbol];
        for (const transaction of tokenTransactions.buys) {
            const date = formatDate(transaction.timeStamp);
            transaction.priceAtTransaction = await fetchHistoricalPrice('eth-mainnet', 'USD', transaction.contractAddress, date);
        }
        for (const transaction of tokenTransactions.sells) {
            const date = formatDate(transaction.timeStamp);
            transaction.priceAtTransaction = await fetchHistoricalPrice('eth-mainnet', 'USD', transaction.contractAddress, date);
        }
    }
}

function calculateProfit(transactions) {
    const profits = {};
    let totalTrades = 0;
    let profitableTrades = 0;

    Object.keys(transactions).forEach(tokenSymbol => {
        let totalBuyCost = 0;
        let totalSellRevenue = 0;

        transactions[tokenSymbol].buys.forEach(tx => {
            if (tx.priceAtTransaction) {
                const amount = parseFloat(tx.value) / Math.pow(10, parseInt(tx.tokenDecimal));
                totalBuyCost += amount * tx.priceAtTransaction;
                totalTrades++;
            }
        });

        transactions[tokenSymbol].sells.forEach(tx => {
            if (tx.priceAtTransaction) {
                const amount = parseFloat(tx.value) / Math.pow(10, parseInt(tx.tokenDecimal));
                totalSellRevenue += amount * tx.priceAtTransaction;
                totalTrades++;
                if (totalSellRevenue > totalBuyCost) {
                    profitableTrades++;
                }
            }
        });

        profits[tokenSymbol] = totalSellRevenue - totalBuyCost;
    });

    return { profits, totalTrades, profitableTrades };
}


async function analyzeWallet(walletAddress) {
    const rawTransactions = await fetchTokenTransactions(walletAddress);
    const classifiedTransactions = classifyTransactions(rawTransactions, walletAddress);
    await enrichTransactionsWithPrices(classifiedTransactions);

    return calculateProfit(classifiedTransactions);
}


async function main() {
    const data = JSON.parse(fs.readFileSync(TOP_WALLETS_FILE_PATH, 'utf8'));
    const walletAddresses = new Set();
    const filteredWallets = {};

    for (const token in data) {
        data[token].forEach(walletInfo => {
            walletAddresses.add(walletInfo.wallet_address);
        });
    }

    let walletIndex = 0;
    const totalWallets = walletAddresses.size;

    for (const walletAddress of walletAddresses) {
        console.log(`Analyse complète du wallet ${walletAddress} (${walletIndex + 1}/${totalWallets})`);
        const analysis = await analyzeWallet(walletAddress);
        const profitability = (analysis.profitableTrades / analysis.totalTrades) * 100;

        if (analysis.profitableTrades >= 3 && profitability >= 60) {
            filteredWallets[walletAddress] = analysis.profits;
        }

        walletIndex++;
    }

    fs.writeFileSync(OUTPUT_FILE_PATH, JSON.stringify(filteredWallets, null, 2));
    console.log(`Filtered ${walletIndex} wallets that meet the criteria.`);
    console.log(`All wallet analyses saved to ${OUTPUT_FILE_PATH}`);
}

module.exports = main
// main();
const fs = require('fs');

const INPUT_FILE_PATH = '/Users/pierre/Desktop/XD/git/Ice-Spy solo/src/transactionsWithPrices.json';

function readTransactionsFromFile(filePath) {
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading file:', error);
        return null;
    }
}

function calculateProfit(transactions, tokenSymbol) {
    let totalBuyCost = 0;
    let totalSellRevenue = 0;

    transactions.buys.forEach(tx => {
        if (tx.tokenSymbol === tokenSymbol && tx.priceAtTransaction) {
            const amount = parseFloat(tx.value) / Math.pow(10, parseInt(tx.tokenDecimal));
            totalBuyCost += amount * tx.priceAtTransaction;
        }
    });

    transactions.sells.forEach(tx => {
        if (tx.tokenSymbol === tokenSymbol && tx.priceAtTransaction) {
            const amount = parseFloat(tx.value) / Math.pow(10, parseInt(tx.tokenDecimal));
            totalSellRevenue += amount * tx.priceAtTransaction;
        }
    });

    return totalSellRevenue - totalBuyCost;
}

function main() {
    const transactions = readTransactionsFromFile(INPUT_FILE_PATH);
    if (transactions) {
        const profit = calculateProfit(transactions, 'FROGE');
        console.log(`Profit for FROGE transactions: ${profit.toFixed(2)} (in the token's quoted currency)`);
    }
}

main();

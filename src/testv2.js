const fs = require('fs');

const WALLET_ADDRESS = '0x6d9148e201304aa9cca58a759a134a3fb58fe718';
const INPUT_FILE_PATH = '/Users/pierre/Desktop/XD/git/Ice-Spy solo/src/tokenTransactions.json';
const OUTPUT_FILE_PATH = '/Users/pierre/Desktop/XD/git/Ice-Spy solo/src/classifiedTransactions.json';

function classifyTransactions(transactions, walletAddress) {
    const buys = [];
    const sells = [];

    transactions.forEach(transaction => {
        if (transaction.to.toLowerCase() === walletAddress.toLowerCase()) {
            buys.push(transaction);
        } else if (transaction.from.toLowerCase() === walletAddress.toLowerCase()) {
            sells.push(transaction);
        }
    });

    return { buys, sells };
}

function readTransactionsFromFile(filePath) {
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading file:', error);
        return [];
    }
}

function writeTransactionsToFile(filePath, data) {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        console.log(`Transactions successfully written to ${filePath}`);
    } catch (error) {
        console.error('Error writing file:', error);
    }
}

const transactions = readTransactionsFromFile(INPUT_FILE_PATH);
const classifiedTransactions = classifyTransactions(transactions, WALLET_ADDRESS);

writeTransactionsToFile(OUTPUT_FILE_PATH, classifiedTransactions);

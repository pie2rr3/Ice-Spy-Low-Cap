const axios = require('axios');
const Moralis = require("moralis").default;
const { EvmChain } = require("@moralisweb3/common-evm-utils");
const fs = require('fs');

const etherscanApiKey = '1S7HW5655DWV8BHKSIKD3F6XC2NJ4MBWWH';
const moralisApiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6IjVmYjdlZmU0LTRjNGUtNDQzNy05YWI1LTM2ZTI0NjM1OGM0MSIsIm9yZ0lkIjoiMzY3MTQ3IiwidXNlcklkIjoiMzc3MzMxIiwidHlwZUlkIjoiOGNiODA3YzMtNjYwYy00YzQzLWI3YzctOWZiYWJlODhhYjBjIiwidHlwZSI6IlBST0pFQ1QiLCJpYXQiOjE3MDE4NzQ4NjUsImV4cCI6NDg1NzYzNDg2NX0.FP4vj42SkE_n9RRl1r7uPS-x9lBneS_EcWczi1F7LNA"; 

async function fetchHistoricalPriceByBlock(contractAddress, blockNumber) {
    try {
        const response = await Moralis.EvmApi.token.getTokenPrice({
            address: contractAddress,
            chain: EvmChain.ETHEREUM,
            toBlock: blockNumber,
        });
        return response?.raw?.usdPrice || null;
    } catch (error) {
        return null;
    }
}

async function fetchCurrentTokenPrice(contractAddress) {
    try {
        const response = await Moralis.EvmApi.token.getTokenPrice({
            address: contractAddress,
            chain: EvmChain.ETHEREUM,
        });

        return response?.raw?.usdPrice || null;
    } catch (error) {
        return null;
    }
}

async function fetchAllTokenTransactions(walletAddress) {
    const url = `https://api.etherscan.io/api?module=account&action=tokentx&address=${walletAddress}&page=1&offset=20&sort=desc&apikey=${etherscanApiKey}`;
    try {
        const response = await axios.get(url);
        return response.data.result;
    } catch (error) {
        console.error('Error fetching token transactions:', error);
        return [];
    }
}

async function calculatePnLForToken(tokenAddress, transactions, walletAddress) {
    let totalInvestment = 0;
    let totalRevenue = 0;
    let totalTokens = 0;
    let totalBought = 0;
    let totalSold = 0;
    let profitableTrades = 0;
    let missingPrices = [];

    for (const tx of transactions) {
        const amount = parseFloat(tx.value) / Math.pow(10, parseInt(tx.tokenDecimal));
        if (tx.to.toLowerCase() === walletAddress.toLowerCase()) {
            const buyPrice = await fetchHistoricalPriceByBlock(tokenAddress, tx.blockNumber);
            if (buyPrice !== null) {
                totalInvestment += amount * buyPrice;
                totalBought += amount;
            } else {
                missingPrices.push(tx.hash);
            }
            totalTokens += amount;
        } else if (tx.from.toLowerCase() === walletAddress.toLowerCase()) {
            const sellPrice = await fetchHistoricalPriceByBlock(tokenAddress, tx.blockNumber);
            if (sellPrice !== null) {
                totalRevenue += amount * sellPrice;
                totalSold += amount;
                if (sellPrice > buyPrice) {
                    profitableTrades++;
                }
            } else {
                missingPrices.push(tx.hash);
            }
            totalTokens -= amount;
        }
    }

    let currentValue = 0;
    if (totalTokens > 0) {
        const currentPrice = await fetchCurrentTokenPrice(tokenAddress);
        currentValue = totalTokens * Math.max(0, currentPrice || 0);
    }

    let pnl = totalTokens > 0 ? currentValue + totalRevenue - totalInvestment : totalRevenue - totalInvestment;

    return {
        totalBought,
        totalSold,
        totalInvestment: totalInvestment.toFixed(2),
        currentValue: currentValue.toFixed(2),
        pnl: pnl.toFixed(2),
        missingPrices,
        profitableTrades,
        totalTrades: transactions.length
    };
}

  

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
    await Moralis.start({ apiKey: moralisApiKey });

    const topWalletsData = JSON.parse(fs.readFileSync('/Users/pierre/Desktop/XD/git/Ice-Spy-Low-Cap copie/src/data/json/top_wallet.json', 'utf8'));
    const topPerformersResults = {};

    let walletProcessed = 0;
    const totalWallets = Object.keys(topWalletsData).reduce((acc, key) => acc + topWalletsData[key].length, 0);

    for (const group in topWalletsData) {
        const wallets = topWalletsData[group];

        for (const wallet of wallets) {
            const walletAddress = wallet.wallet_address;
            const allTransactions = await fetchAllTokenTransactions(walletAddress);
            const tokens = new Set(allTransactions.map(tx => tx.contractAddress));
            let totalPnL = 0;
            let uniqueMissingPrices = new Set();
            let totalProfitableTrades = 0;
            let totalTrades = 0;

            for (const token of tokens) {
                const tokenTransactions = allTransactions.filter(tx => tx.contractAddress === token);
                const pnlResult = await calculatePnLForToken(token, tokenTransactions, walletAddress);
                totalPnL += parseFloat(pnlResult.pnl);
                pnlResult.missingPrices.forEach(price => uniqueMissingPrices.add(price));
                totalProfitableTrades += pnlResult.profitableTrades;
                totalTrades += pnlResult.totalTrades;
            }

            let profitableTradesPercentage = totalTrades > 0 ? (totalProfitableTrades / totalTrades) * 100 : 0;

            if (totalProfitableTrades >= 3 && profitableTradesPercentage >= 60) {
                topPerformersResults[walletAddress] = { 
                    "Total PnL": totalPnL.toFixed(2), 
                    "Missing Prices": Array.from(uniqueMissingPrices) 
                };
            }

            walletProcessed++;
            console.log(`Analyse du pnl pour le wallet ${walletAddress} terminée (${walletProcessed}/${totalWallets})`);
        }
    }

    fs.writeFileSync('/Users/pierre/Desktop/XD/git/Ice-Spy-Low-Cap copie/src/data/json/top_performer.json', JSON.stringify(topPerformersResults, null, 2));
    console.log('Résultats du PnL sauvegardés dans top_performer.json');
}

main();

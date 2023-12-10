const axios = require('axios');
const Moralis = require("moralis").default;
const { EvmChain } = require("@moralisweb3/common-evm-utils");
const fs = require('fs');

const etherscanApiKey = '1S7HW5655DWV8BHKSIKD3F6XC2NJ4MBWWH';
const moralisApiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6ImUzZDQ0ZTg2LWNhNTgtNGVhYS1hMTEwLWM3NTkxOGQzYTZiYyIsIm9yZ0lkIjoiMzY3NTEyIiwidXNlcklkIjoiMzc3NzA4IiwidHlwZUlkIjoiZGRmMzlhODUtNTVkOS00ZWZlLWJmMGQtNGY2MjE4ZmNiOGRlIiwidHlwZSI6IlBST0pFQ1QiLCJpYXQiOjE3MDIxMTQ1NjcsImV4cCI6NDg1Nzg3NDU2N30.m4iqhDiqDoIUxLZHBkRrQOD1Hn6dB5pe13u1sHAIXjY"; 
const walletAddress = '0x23043dad4113dd9059db172d3d2f4d2d2eab8b00';
const tokenAddress = "0x15f84bfb8ed86faf8455cf6c9d88908ea89f92b6"; 

async function fetchHistoricalPriceByBlock(contractAddress, blockNumber) {
    try {
        const response = await Moralis.EvmApi.token.getTokenPrice({
            address: contractAddress,
            chain: EvmChain.ETHEREUM,
            toBlock: blockNumber,
        });

        return response?.raw?.usdPrice || null;
    } catch (error) {
        console.error(`Error fetching historical price:`, error);
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
        console.error(`Error fetching current token price:`, error);
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

async function calculateInvestment(transactions) {
    let totalInvestment = 0;
    let totalTokens = 0;
    let hasSold = false;

    for (const tx of transactions) {
        if (tx.to.toLowerCase() === walletAddress.toLowerCase()) {
            const price = await fetchHistoricalPriceByBlock(tokenAddress, tx.blockNumber);
            if (price !== null) {
                const amount = parseFloat(tx.value) / Math.pow(10, parseInt(tx.tokenDecimal));
                totalInvestment += amount * price;
                totalTokens += amount;
            }
        } else if (tx.from.toLowerCase() === walletAddress.toLowerCase()) {
            hasSold = true;
            break;
        }
    }

    const currentPrice = await fetchCurrentTokenPrice(tokenAddress);
    const currentValue = totalTokens * currentPrice;
    const pnl = currentValue - totalInvestment;

    return { totalInvestment, currentValue, pnl, hasSold };
}

async function calculatePnLForToken(tokenAddress, transactions, walletAddress) {
    let totalInvestment = 0;
    let totalRevenue = 0;
    let totalTokens = 0;
    let totalBought = 0;
    let totalSold = 0;
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
        missingPrices 
    };
  }
  

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  await Moralis.start({ apiKey: moralisApiKey });

  const allTransactions = await fetchAllTokenTransactions(walletAddress);
  const tokens = new Set(allTransactions.map(tx => tx.contractAddress));

  const results = {};
  let totalPnL = 0;
  let tokenProcessed = 0;

  for (const token of tokens) {
      await sleep(200);

      const tokenTransactions = allTransactions.filter(tx => tx.contractAddress === token);
      const pnlResult = await calculatePnLForToken(token, tokenTransactions, walletAddress);
      results[token] = pnlResult;

      totalPnL += parseFloat(pnlResult.pnl);
      tokenProcessed++;
      console.log(`Analyse du pnl pour ${token} terminée (${tokenProcessed}/${tokens.size})`);

      await sleep(1000); 
  }

  results["Total PnL"] = totalPnL.toFixed(2);
  fs.writeFileSync('pnl_results.json', JSON.stringify(results, null, 2));
  console.log('Résultats du PnL sauvegardés dans pnl_results.json');
}

main();
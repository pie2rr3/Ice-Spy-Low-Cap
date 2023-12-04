const axios = require('axios');
const fs = require('fs');

const token1 = '0x21E6bc780bFcd36D36444F68e4962c7cEB255229';
const token2 = '0xCCD3891c1452b7CB0E4632774B9365DC4eE24f20';

const startBlock1 = '69141817';
const endBlock1 = '69152228';
const startBlock2 = '67809815';
const endBlock2 = '67865385';

const apiUrl = 'https://api.etherscan.io/api';
const apiKey = '1S7HW5655DWV8BHKSIKD3F6XC2NJ4MBWWH';

const walletFile = 'Influ_ETH.txt';

async function getTokenTransfers(contractAddress, startBlock, endBlock) {
  const url = `${apiUrl}?module=account&action=tokentx&contractaddress=${contractAddress}&startblock=${startBlock}&endblock=${endBlock}&sort=asc&apikey=${apiKey}`;
  const response = await axios.get(url);
  return response.data.result || [];
}

async function getWallets() {
  const transfers1 = await getTokenTransfers(token1, startBlock1, endBlock1);
  const transfers2 = await getTokenTransfers(token2, startBlock2, endBlock2);

  const wallets1 = new Set(transfers1.map(t => t.from));
  const wallets2 = new Set(transfers2.map(t => t.from));

  const wallets = new Set([...wallets1].filter(wallet => wallets2.has(wallet)));

  if (wallets.size > 0) {
    fs.writeFileSync(walletFile, Array.from(wallets).join('\n'));
    console.log(`${wallets.size} wallet(s) found and saved in ${walletFile}.`);
  } else {
    console.log('No wallet found.');
  }
}

async function run() {
  return connectToEtherscan();
}
module.exports = { run };

getWallets();

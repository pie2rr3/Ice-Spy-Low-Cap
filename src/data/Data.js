const axios = require('axios');
const fs = require('fs');

const API_KEY = '21167c5b4f84577f563557ba87ec6e86a33b69a5';
const API_URL = 'https://graph.defined.fi/graphql';

async function getTopTokens(limit = 50) {
  try {
    const response = await axios.post(API_URL, {
      query: `
        {
          listTopTokens(limit: ${limit}, networkFilter: [1], resolution: "1D") {
            address
            marketCap
            name
            symbol
            volume
          }
        }
      `
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `${API_KEY}`
      }
    });

    if (!response.data || !response.data.data || !response.data.data.listTopTokens) {
      console.error('Unexpected API response:', response.data);
      return [];
    }

    const filteredTokens = response.data.data.listTopTokens.filter(token => parseFloat(token.marketCap) >= 2000000);
    console.log(`Nombre de tokens filtrés (marketCap < 2M): ${response.data.data.listTopTokens.length - filteredTokens.length}`);

    return filteredTokens;
  } catch (error) {
    console.error('Error fetching top tokens:', error);
    return [];
  }
}

async function collectCryptoData() {
  const topTokens = await getTopTokens();

  if (topTokens.length > 0) {
    fs.writeFileSync('top_trending_tokens.json', JSON.stringify(topTokens, null, 2));
    console.log('Crypto data collection completed. Data saved to top_trending_tokens.json');
  } else {
    console.log('No data to save.');
  }
}

async function main() {
  console.log('Starting crypto data collection...');
  await collectCryptoData();
  console.log('Crypto data collection completed.');
}

module.exports = main;


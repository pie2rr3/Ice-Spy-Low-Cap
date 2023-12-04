const { Builder, By, Key, until } = require('selenium-webdriver');
const firefox = require('selenium-webdriver/firefox');
const fs = require('fs');
const csv = require('csv-parser');
const { parse } = require('json2csv');

async function findWhales(driver, contractAddress, tokenName, minimumBalance, limit = 5) {
    await driver.get(`https://etherscan.io/token/generic-tokenholders2?a=${contractAddress}`);
  
    // Attendre que les données des détenteurs de tokens soient chargées
    await driver.wait(until.elementLocated(By.css('.table > tbody > tr')), 10000);
  
    // Obtenir toutes les lignes du tableau
    const rows = await driver.findElements(By.css('.table > tbody > tr'));
  
    // Filtrer les whales en fonction de leur solde
    const whales = [];
    const whaleAddresses = {};
  
    let whaleCount = 0;
    for (let i = 0; i < rows.length && whaleCount < limit; i++) {
      const row = rows[i];
      const addressElement = await row.findElement(By.css('td:nth-child(2) a'));
      const whaleAddressHref = await addressElement.getAttribute('href');
      const whaleAddress = whaleAddressHref.split('?a=')[1];
  
      if (whaleAddress && !whaleAddress.includes('Uniswap') && !whaleAddress.includes('Null')) {
        const balanceElement = await row.findElement(By.css('td:nth-child(3)'));
        const balanceText = await balanceElement.getText();
        const balance = parseFloat(balanceText.replace(/,/g, ''));
  
        if (balance >= minimumBalance && !whaleAddresses[whaleAddress]) {
          whales.push({ token: tokenName, address: whaleAddress, balance: balance });
          whaleAddresses[whaleAddress] = true;
          whaleCount++;
        }
      }
    }
  
    return whales;
  }
  


async function main() {
  // Ajouter les options pour le navigateur Firefox
  const firefoxOptions = new firefox.Options();
  firefoxOptions.addArguments('-headless');

  let driver = await new Builder().forBrowser('firefox').setFirefoxOptions(firefoxOptions).build();

  try {
    const tokens = [];
    fs.createReadStream('C:\\Users\\Olivi\\OneDrive\\Bureau\\XD\\Bots\\Ice Spy\\Dexscreener Data\\ETH_data.csv')
      .pipe(csv())
      .on('data', (data) => {
        const address = data['Adresse'];
        const tokenName = data['Nom de la paire'];
        if (address && address.startsWith('0x')) {
          tokens.push({ address, tokenName });
        }
      })
      .on('end', async () => {
        console.log('Nombre d\'adresses à traiter:', tokens.length);

        const whales = [];
        for (const { address, tokenName } of tokens) {
          const contractWhales = await findWhales(driver, address, tokenName, 1000); // Changer 1000 par le solde minimum souhaité
          whales.push(...contractWhales);
        }

        console.log('Whales trouvées:', whales);

        // Enregistrement des résultats dans un fichier CSV
        const fields = ['token', 'address', 'balance'];
        const csvData = parse(whales, { fields });
        fs.writeFileSync('C:\\Users\\Olivi\\OneDrive\\Bureau\\XD\\Bots\\Ice Spy\\Wallets\\Whales_ETH.csv', csvData);

        driver.quit();
      });
  } catch (error) {
    console.error('Une erreur est survenue:', error);
    driver.quit();
  }
}

async function run() {
  return connectToEtherscan();
}
module.exports = { run };

main();

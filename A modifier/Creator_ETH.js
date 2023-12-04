const { Builder, By, Key, until } = require('selenium-webdriver');
const { Options } = require('selenium-webdriver/firefox');
const fs = require('fs');
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

async function processAddresses(driver, addresses) {
  const resultRows = [];

  for (let i = 0; i < addresses.length; i++) {
    const address = addresses[i];
    console.log(`Traitement de l'adresse ${i + 1}: ${address}`);

    const searchInput = await driver.findElement(By.css('#search-panel'));
    await searchInput.clear();
    await searchInput.sendKeys(address, Key.ENTER);

    await driver.wait(until.elementLocated(By.css('#ContentPlaceHolder1_trContract > div > a:nth-child(1)'), 10000));

    const creatorLink = await driver.findElement(By.css('#ContentPlaceHolder1_trContract > div > a:nth-child(1)'));
    const creatorAddressHref = await creatorLink.getAttribute('href');
    const creatorAddress = creatorAddressHref.replace('https://etherscan.io/address/', '');
    console.log(`Adresse du créateur du contrat ${address}: ${creatorAddress}`);

    resultRows.push({ address, creatorAddress });

    await driver.navigate().back();

    // Ajoutez un délai de 5 secondes entre les requêtes pour éviter d'être bloqué par Etherscan
    await driver.sleep(5000);
  }

  return resultRows;
}

async function writeCsv(rows, outputFilePath) {
  const csvWriter = createCsvWriter({
    path: outputFilePath,
    header: [
      { id: 'address', title: 'Adresse' },
      { id: 'creatorAddress', title: 'Adresse du créateur' },
    ],
  });

  await csvWriter.writeRecords(rows);
  console.log(`Les résultats ont été écrits dans ${outputFilePath}`);
}

async function connectToEtherscan() {
  const firefoxOptions = new Options().headless();
  let driver = await new Builder().forBrowser('firefox').setFirefoxOptions(firefoxOptions).build();

  try {
    const url = 'https://etherscan.io/';
    await driver.get(url);

    await driver.sleep(10000);

    const addresses = [];
    fs.createReadStream('/Users/pierre/Desktop/XD/git/Ice-Spy solo/Wallets/Creator_ETH.csv')
      .pipe(csv())
      .on('data', (data) => {
        console.log('Ligne du CSV:', data);
        const address = data['Adresse'];
        if (address && address.startsWith('0x')) {
          addresses.push(address);
        }
      })
      .on('end', async () => {
        console.log('Nombre d\'adresses à traiter:', addresses.length);
        const resultRows = await processAddresses(driver, addresses);
        driver.quit();

        const outputFilePath = '/Users/pierre/Desktop/XD/git/Ice-Spy solo/Wallets/Creator_ETH.csv';
        await writeCsv(resultRows, outputFilePath);
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

connectToEtherscan();
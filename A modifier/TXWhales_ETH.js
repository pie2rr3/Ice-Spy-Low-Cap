const { Builder, By, Key, until } = require("selenium-webdriver");
const firefox = require("selenium-webdriver/firefox");
const fs = require("fs");
const csv = require("csv-parser");
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const options = new firefox.Options();
options.headless(true);

const driver = new Builder().forBrowser("firefox").setFirefoxOptions(options).build();

const cryptoAddress = '0x1ce270557C1f68Cfb577b856766310Bf8B47FD9C';

async function writeWalletsToCSV(wallets) {
  const csvWriter = createCsvWriter({
    path: 'C:\\Users\\Olivi\\OneDrive\\Bureau\\XD\\Bots\\Ice Spy\\Wallets\\TXWhales_ETH.csv',
    header: [
      { id: 'address', title: 'ADDRESS' },
      { id: 'crypto', title: 'CRYPTO' },
    ],
  });

  const records = [];

  for (const address of wallets) {
    records.push({ address, crypto: cryptoAddress });
  }

  await csvWriter.writeRecords(records);
}


async function collectTop15TransactionWallets(address) {
  const collectedAddresses = new Set();
  const url = `https://www.dextools.io/app/en/ether/pair-explorer/${address}`;
  await driver.get(url);

  await driver.sleep(10000); // Attendre 10 secondes

  try {
    const closeButton = await driver.findElement(
      By.xpath(
        "/html/body/app-root/div/div/main/app-chain-page/app-pairexplorer/app-layout/div/div/div/div[3]/app-favorites-list/div[1]/div/button/fa-icon"
      )
    );
    await closeButton.click();
    await driver.sleep(2000); // Attendre 2 secondes
  } catch (error) {
    console.log(
      "Le bouton de fermeture n'a pas été trouvé, en continuant sans fermer le panneau."
    );
  }

  const sortButton = await driver.findElement(
    By.css(
      "#history > app-trade-history > ngx-datatable > div > datatable-header > div > div.datatable-row-center.ng-star-inserted > datatable-header-cell:nth-child(6) > div > button.sort.ng-star-inserted > span"
    )
  );
  await driver.executeScript("arguments[0].scrollIntoView(true);", sortButton);
  await driver.sleep(1000); // Attendre 1 seconde
  await sortButton.click();
  await driver.sleep(1000); // Attendre 1 seconde
  await sortButton.click();

  await driver.sleep(5000); // Attendre 5 secondes

  for (let i = 1; i <= 15; i++) {
    try {
      const walletLinkElement = await driver.findElement(
        By.css(
          `#history > app-trade-history > ngx-datatable > div > datatable-body > datatable-selection > datatable-scroller > datatable-row-wrapper:nth-child(${i}) > datatable-body-row > div.datatable-row-center.datatable-row-group.ng-star-inserted > datatable-body-cell:nth-child(7) > div > a`
        )
      );
      const walletLink = await walletLinkElement.getAttribute("href");
      const walletAddress = walletLink.match(/(0x[a-fA-F0-9]{40})/)[0];

      collectedAddresses.add(walletAddress);
    } catch (error) {
      console.log(`Erreur lors de la récupération du wallet à la ligne ${i} pour l'adresse ${address}: ${error.message}`);
      break;    }
    }
  
    return collectedAddresses;
  }
  
  async function main() {
    console.log(`Récupération des 15 wallets pour l'adresse ${cryptoAddress}`);
    try {
      const wallets = await collectTop15TransactionWallets(cryptoAddress);
      console.log(`Wallets pour l'adresse ${cryptoAddress}:`, wallets);
  
      // Écrire les adresses des wallets dans un fichier CSV sans doublons
      await writeWalletsToCSV(wallets);
    } catch (error) {
      console.error(
        `Erreur lors de la récupération des wallets pour l'adresse ${cryptoAddress}:`,
        error
      );
    }
  
    // Fermer le navigateur à la fin du traitement
    await driver.quit();
  }
  
  main().catch((error) => {
    console.error("Erreur lors de l'exécution du script:", error);
    driver.quit();
  });
  
  async function run() {
    return connectToEtherscan();
  }
  module.exports = { run };
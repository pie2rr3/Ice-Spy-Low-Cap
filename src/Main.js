#!/usr/bin/env node

const collectCryptoData = require('C:\\Users\\Olivi\\OneDrive\\Bureau\\Github\\Ice-Spy-Low-Cap\\src\\data\\Data.js');
const processTopTokens = require('C:\\Users\\Olivi\\OneDrive\\Bureau\\Github\\Ice-Spy-Low-Cap\\src\\data\\TopHolders.js');
const filterTopWallets = require('C:\\Users\\Olivi\\OneDrive\\Bureau\\Github\\Ice-Spy-Low-Cap\\src\\data\\TopWallet.js');
const analyzeTopPerformer = require('C:\\Users\\Olivi\\OneDrive\\Bureau\\Github\\Ice-Spy-Low-Cap\\src\\data\\TopPerformer.js');


const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  function ask(question) {
    return new Promise((resolve) => readline.question(question, resolve));
  }
  
  async function executeScripts() {
    console.log("Début de l'exécution des scripts...");
  
    const tokenLimit = await ask("Combien de tokens souhaitez-vous récupérer? ");
    console.log("Exécution de Data...");
    await collectCryptoData(parseInt(tokenLimit));
  
    const holderLimit = await ask("Combien de top holders par token souhaitez-vous? ");
    console.log("Exécution de TopHolders...");
    await processTopTokens(Math.min(parseInt(holderLimit), 50));
  
    const minBalance = await ask("Quel est le solde minimum du wallet? ");
    const maxBalance = await ask("Quel est le solde maximum du wallet? ");
    console.log("Exécution de TopWallet...");
    await filterTopWallets(parseFloat(minBalance), parseFloat(maxBalance));
  
    console.log("Exécution de TopPerformer...");
    await analyzeTopPerformer();
  
    console.log("Tous les scripts ont été exécutés.");
    readline.close();
  }
  
  executeScripts();
  

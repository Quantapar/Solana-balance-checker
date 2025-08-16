const connection = new solanaWeb3.Connection(
  solanaWeb3.clusterApiUrl("devnet"),
  "confirmed"
);

async function getWalletBalance(publicKeyString) {
  try {
    const publicKey = new solanaWeb3.PublicKey(publicKeyString);
    const balanceLamports = await connection.getBalance(publicKey);
    const balanceSOL = balanceLamports / solanaWeb3.LAMPORTS_PER_SOL;
    return balanceSOL;
  } catch (err) {
    console.error("Error fetching balance:", err);
    return null;
  }
}

async function getSolPriceUSD() {
  try {
    const response = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd"
    );
    const data = await response.json();
    return data.solana.usd;
  } catch (err) {
    console.error("Error fetching SOL price:", err);
    return null;
  }
}

async function getRecentTransactions(publicKeyString) {
  const txList = document.getElementById("txList");
  const txSection = document.getElementById("transactions");

  try {
    const publicKey = new solanaWeb3.PublicKey(publicKeyString);

    const signatures = await connection.getSignaturesForAddress(publicKey, {
      limit: 5,
    });

    txList.innerHTML = "";

    if (signatures.length === 0) {
      txList.innerHTML = "<li>No recent transactions found.</li>";
    } else {
      for (let sigInfo of signatures) {
        const sig = sigInfo.signature;

        const tx = await connection.getTransaction(sig, {
          maxSupportedTransactionVersion: 0,
        });

        let amount = 0;
        if (tx && tx.meta && tx.meta.preBalances && tx.meta.postBalances) {
          amount =
            (tx.meta.postBalances[0] - tx.meta.preBalances[0]) /
            solanaWeb3.LAMPORTS_PER_SOL;
        }

        const li = document.createElement("li");
        li.innerHTML = `
              <strong>Signature:</strong> ${sig.substring(0, 20)}... <br>
              <strong>Slot:</strong> ${sigInfo.slot} <br>
              <strong>Amount Change:</strong> ${amount.toFixed(4)} SOL <br>
              <a href="https://explorer.solana.com/tx/${sig}?cluster=devnet" target="_blank" class="tx-link">🔗 View on Solscan</a>
            `;
        txList.appendChild(li);
      }
    }

    txSection.classList.remove("hidden");
  } catch (err) {
    console.error("Error fetching transactions:", err);
    txList.innerHTML = "<li>Error fetching transactions.</li>";
    document.getElementById("transactions").classList.remove("hidden");
  }
}

document.getElementById("checkBalance").addEventListener("click", async () => {
  const publicKeyInput = document.getElementById("publicKey").value.trim();
  const solBalanceElement = document.getElementById("solBalance");
  const errorElement = document.getElementById("error");
  const resultElement = document.getElementById("result");
  const resetBtn = document.getElementById("resetBtn");

  if (!publicKeyInput) {
    errorElement.textContent = "Please enter a public key.";
    errorElement.classList.remove("hidden");
    return;
  }

  const balance = await getWalletBalance(publicKeyInput);

  if (balance !== null) {
    const solPrice = await getSolPriceUSD();

    let usdText = "";
    if (solPrice !== null) {
      const usdValue = (balance * solPrice).toFixed(2);
      usdText = ` (~$${usdValue} USD)`;
    }

    solBalanceElement.textContent = `💰 Balance: ${balance.toFixed(
      4
    )} SOL${usdText}`;
    resultElement.classList.remove("hidden");
    document.getElementById("publicKey").value = "";

    await getRecentTransactions(publicKeyInput);

    resetBtn.classList.remove("hidden");
  } else {
    errorElement.textContent = "Invalid public key or network error.";
    errorElement.classList.remove("hidden");
  }
});

document.getElementById("resetBtn").addEventListener("click", () => {
  window.location.reload();
});

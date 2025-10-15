import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { Client, PrivateKey, AccountId, TokenCreateTransaction, TokenType, TokenSupplyType } from "@hashgraph/sdk";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const OPERATOR_ID = AccountId.fromString(process.env.REACT_APP_HEDERA_OPERATOR_ID);
const OPERATOR_KEY = PrivateKey.fromStringECDSA(process.env.REACT_APP_HEDERA_OPERATOR_KEY);

const client = Client.forTestnet().setOperator(OPERATOR_ID, OPERATOR_KEY);

async function createFungibleToken({ name, symbol, decimals = 8, initialSupply = 0 }) {
  const tx = await new TokenCreateTransaction()
    .setTokenName(name)
    .setTokenSymbol(symbol)
    .setTreasuryAccountId(OPERATOR_ID)
    .setAdminKey(OPERATOR_KEY.publicKey)
    .setSupplyKey(OPERATOR_KEY.publicKey)
    .setDecimals(decimals)
    .setInitialSupply(initialSupply)
    .setTokenType(TokenType.FungibleCommon)
    .setSupplyType(TokenSupplyType.Infinite)
    .freezeWith(client)
    .sign(OPERATOR_KEY);

  const submit = await tx.execute(client);
  const receipt = await submit.getReceipt(client);
  const tokenId = receipt.tokenId;

  if (!tokenId) throw new Error("Failed to create fungible token");
  return tokenId.toString();
}

app.post("/api/create-token", async (req, res) => {
  try {
    const { name, symbol, decimals, initialSupply } = req.body;
    const tokenId = await createFungibleToken({ name, symbol, decimals, initialSupply });
    res.json({ success: true, tokenId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

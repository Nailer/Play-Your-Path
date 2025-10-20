try { require('dotenv').config(); } catch (_) {}

const {
  Client,
  PrivateKey,
  AccountId,
  TokenCreateTransaction,
  TokenType,
  TokenSupplyType
} = require('@hashgraph/sdk');

async function main() {
  const operatorId = process.env.REACT_APP_HEDERA_OPERATOR_ID
    || process.env.MY_ACCOUNT_ID
    || process.env.NEXT_PUBLIC_MY_ACCOUNT_ID
    || process.env.HEDERA_OPERATOR_ID;
  const operatorKey = process.env.REACT_APP_HEDERA_OPERATOR_KEY
    || process.env.MY_PRIVATE_KEY
    || process.env.NEXT_PUBLIC_MY_PRIVATE_KEY
    || process.env.HEDERA_OPERATOR_KEY;
  if (!operatorId || !operatorKey) {
    console.error('Missing operator creds. Set REACT_APP_HEDERA_OPERATOR_ID and REACT_APP_HEDERA_OPERATOR_KEY');
    process.exit(1);
  }

  const name = process.argv[2] || 'PYP Plant Token';
  const symbol = process.argv[3] || 'PYP';
  const decimals = Number(process.argv[4] || 0);
  const initialSupply = Number(process.argv[5] || 1000000000000);

  const client = Client.forTestnet().setOperator(AccountId.fromString(operatorId), PrivateKey.fromString(operatorKey));

  const adminKey = PrivateKey.fromString(operatorKey);

  const tx = await new TokenCreateTransaction()
    .setTokenName(name)
    .setTokenSymbol(symbol)
    .setTreasuryAccountId(AccountId.fromString(operatorId))
    .setAdminKey(adminKey.publicKey)
    .setSupplyKey(adminKey.publicKey)
    .setDecimals(0)
    .setInitialSupply(10000000000)
    .setTokenType(TokenType.FungibleCommon)
    .setSupplyType(TokenSupplyType.Infinite)
    .freezeWith(client)
    .sign(adminKey);

  const submit = await tx.execute(client);
  const receipt = await submit.getReceipt(client);
  const tokenId = receipt.tokenId?.toString();

  if (!tokenId) {
    console.error('Failed to create token. No tokenId returned.');
    process.exit(1);
  }

  console.log('\n✅ Token created');
  console.log('Token ID:', tokenId);
  console.log('\nNext: update Supabase hts_config with:');
  console.log(`\nupdate public.hts_config\nset\n  reward_token_id = '${tokenId}',\n  token_symbol = '${symbol}',\n  decimals = ${decimals},\n  daily_amount = ${Math.pow(10, Math.max(0, decimals-5))}, -- example amount\n  use_supply_on_claim = true,\n  treasury_account_id = '${operatorId}',\n  treasury_private_key = '${process.env.REACT_APP_HEDERA_OPERATOR_KEY}',\n  supply_private_key = '${process.env.REACT_APP_HEDERA_OPERATOR_KEY}'\nwhere id = 1;\n`);

  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });



import { Client, AccountCreateTransaction, PrivateKey, PublicKey, Hbar, TokenCreateTransaction, TokenType, TokenSupplyType, TokenAssociateTransaction, TransferTransaction, TokenMintTransaction } from '@hashgraph/sdk';

export interface CreateNftInput {
  tokenName: string;
  tokenSymbol: string;
  maxSupply: number;
  metadataCids: string[]; // array of ipfs://.../metadata.json
}

export interface CreateNftResult {
  tokenId: string;
  mintedSerials: number[];
}


export async function createNftAndMint(input: CreateNftInput): Promise<CreateNftResult> {
  const operatorId = process.env.MY_ACCOUNT_ID || process.env.NEXT_PUBLIC_MY_ACCOUNT_ID;
  const operatorKey = process.env.MY_PRIVATE_KEY || process.env.NEXT_PUBLIC_MY_PRIVATE_KEY;
  if (!operatorId || !operatorKey) throw new Error('Missing Hedera operator credentials');

  const client = Client.forTestnet().setOperator(operatorId, operatorKey);
  const supplyKey = PrivateKey.generateECDSA();

  const createTx = await new TokenCreateTransaction()
    .setTokenName(input.tokenName)
    .setTokenSymbol(input.tokenSymbol)
    .setTokenType(TokenType.NonFungibleUnique)
    .setDecimals(0)
    .setInitialSupply(0)
    .setTreasuryAccountId(operatorId)
    .setSupplyType(TokenSupplyType.Finite)
    .setMaxSupply(input.maxSupply)
    .setSupplyKey(supplyKey)
    .freezeWith(client)
    .sign(PrivateKey.fromStringECDSA(operatorKey));

  const createSubmit = await createTx.execute(client);
  const createRx = await createSubmit.getReceipt(client);
  if (!createRx.tokenId) throw new Error('Failed to create NFT token');
  const tokenId = createRx.tokenId;

  const cidBuffers = input.metadataCids.map((c) => Buffer.from(c));
  const mintTx = await new TokenMintTransaction()
    .setTokenId(tokenId)
    .setMetadata(cidBuffers)
    .freezeWith(client)
    .sign(supplyKey);

  const mintSubmit = await mintTx.execute(client);
  const mintRx = await mintSubmit.getReceipt(client);
  const serials = (mintRx.serials ?? []).map((s) => Number(s.toString()));

  client.close();
  return { tokenId: tokenId.toString(), mintedSerials: serials };
}
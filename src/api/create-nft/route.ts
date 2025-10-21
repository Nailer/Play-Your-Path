import { createNftAndMint } from '@/lib/hedera';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { tokenName, tokenSymbol, maxSupply, metadataCids } = (body ?? {}) as any;

    if (
      !tokenName ||
      !tokenSymbol ||
      typeof maxSupply !== 'number' ||
      !Array.isArray(metadataCids) ||
      metadataCids.length === 0
    ) {
      return new Response(JSON.stringify(
        { error: 'tokenName, tokenSymbol, maxSupply, metadataCids[] required' }
      ), { status: 400, headers: { 'content-type': 'application/json' } });
    }

    const result = await createNftAndMint({ tokenName, tokenSymbol, maxSupply, metadataCids });
    return new Response(JSON.stringify({ success: true, tokenId: result.tokenId, serials: result.mintedSerials }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to create NFT';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
}

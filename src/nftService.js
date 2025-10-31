// src/services/nftService.js
export async function createNFT({ tokenName, tokenSymbol, maxSupply, metadataCids }) {
  const res = await fetch('/api/create-nft', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tokenName, tokenSymbol, maxSupply, metadataCids }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to create NFT');
  return data;
}

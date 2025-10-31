import { useState } from 'react';
import { createNFT } from './nftService';

export default function CreateNFTForm() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await createNFT({
        tokenName: 'My NFT Collection',
        tokenSymbol: 'MYNFT',
        maxSupply: 10,
        metadataCids: ['Qm123...', 'Qm456...'], // example IPFS CIDs
      });
      setResult(res);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={handleSubmit} disabled={loading}>
        {loading ? 'Creating...' : 'Create NFT'}
      </button>
      {result && (
        <div>
          ✅ Token ID: {result.tokenId}
          <br />
          Serials: {result.serials.join(', ')}
        </div>
      )}
    </div>
  );
}

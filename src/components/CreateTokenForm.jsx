import React, { useState } from "react";
import axios from "axios";

const CreateTokenForm = () => {
  const [form, setForm] = useState({ name: "", symbol: "", decimals: 8, initialSupply: 0 });
  const [tokenId, setTokenId] = useState(null);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const createToken = async () => {
    try {
      const res = await axios.post("http://localhost:5000/api/create-token", form);
      setTokenId(res.data.tokenId);
      alert(`Token created: ${res.data.tokenId}`);
    } catch (err) {
      console.error(err);
      alert("Error creating token: " + err.message);
    }
  };

  return (
    <div className="p-4">
      <input name="name" placeholder="Token Name" onChange={handleChange} />
      <input name="symbol" placeholder="Symbol" onChange={handleChange} />
      <input name="decimals" type="number" onChange={handleChange} />
      <input name="initialSupply" type="number" onChange={handleChange} />
      <button onClick={createToken}>Create Token</button>

      {tokenId && <p>✅ Token created: {tokenId}</p>}
    </div>
  );
};

export default CreateTokenForm;

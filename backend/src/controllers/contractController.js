const { blockchain } = require('../blockchain/Blockchain');

exports.deployContract = (req, res) => {
  try {
    const { ownerAddress, contractCode, contractName, initialState } = req.body;
    if (!ownerAddress || !contractCode || !contractName) {
      return res.status(400).json({ success: false, message: 'ownerAddress, contractCode, and contractName required' });
    }
    const contract = blockchain.deployContract(ownerAddress, contractCode, contractName, initialState);
    blockchain.minePendingTransactions('SYSTEM');
    res.status(201).json({
      success: true,
      message: 'Smart contract deployed successfully',
      data: {
        id: contract.id,
        name: contract.name,
        owner: contract.owner,
        deployedAt: contract.deployedAt,
        abi: contract.abi,
        state: contract.state
      }
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.callContract = (req, res) => {
  try {
    const { contractId } = req.params;
    const { callerAddress, method, params, value = 0 } = req.body;
    if (!callerAddress || !method) {
      return res.status(400).json({ success: false, message: 'callerAddress and method required' });
    }
    const result = blockchain.callContract(contractId, callerAddress, method, params || [], value);
    blockchain.minePendingTransactions('SYSTEM');
    res.json({
      success: true,
      message: 'Contract method executed successfully',
      data: result
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.getContract = (req, res) => {
  const contract = blockchain.smartContracts.get(req.params.contractId);
  if (!contract) return res.status(404).json({ success: false, message: 'Contract not found' });
  res.json({ success: true, data: contract });
};

exports.getAllContracts = (req, res) => {
  const contracts = [];
  for (const [id, contract] of blockchain.smartContracts) {
    contracts.push({
      id,
      name: contract.name,
      owner: contract.owner,
      deployedAt: contract.deployedAt,
      transactionCount: contract.transactions.length,
      abi: contract.abi,
      state: contract.state
    });
  }
  res.json({ success: true, data: contracts });
};

exports.getContractTransactions = (req, res) => {
  const contract = blockchain.smartContracts.get(req.params.contractId);
  if (!contract) return res.status(404).json({ success: false, message: 'Contract not found' });

  const txs = blockchain.getAllTransactionsForAddress(req.params.contractId);
  res.json({ success: true, data: txs });
};

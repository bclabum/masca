export const NETWORKS: Record<string, string> = {
  '0x1': 'Ethereum',
  '0xaa36a7': 'Sepolia Testnet',
  '0x5': 'Goerli Testnet',
  '0x89': 'Polygon',
};

export const NETWORKS_BY_DID: Record<string, string[]> = {
  'did:ethr': ['*'],
  'did:pkh': ['0x1', '0x89'],
};

export function getAvailableNetworksList(method: string): string[] {
  if (NETWORKS_BY_DID[method].includes('*')) {
    return Object.values(NETWORKS);
  }
  return NETWORKS_BY_DID[method].map((network) => NETWORKS[network]);
}

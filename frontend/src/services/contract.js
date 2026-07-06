import { ethers } from 'ethers';
import contractABI from './LucidDropABI.json';

const CONTRACT_ADDRESS = process.env.REACT_APP_CONTRACT_ADDRESS || '0x...';

export const getContract = () => {
  if (!window.ethereum) {
    throw new Error('Please install MetaMask or Phantom');
  }
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();
  return new ethers.Contract(CONTRACT_ADDRESS, contractABI, signer);
};
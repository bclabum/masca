import {
  CURRENT_STATE_VERSION,
  InternalSigMethods,
} from '@blockchain-lab-um/masca-types';
import { MetaMaskInpageProvider } from '@metamask/providers';
import { SnapsProvider } from '@metamask/snaps-sdk';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

import WalletService from '../../src/Wallet.service';
import StorageService from '../../src/storage/Storage.service';
import { account } from '../data/constants';
import { getDefaultSnapState } from '../data/defaultSnapState';
import { SnapMock, createMockSnap } from '../helpers/snapMock';

const methods = [
  {
    method: 'did:key',
    privateKey:
      '0xf27f0c9b939cebc92647ab62a6d979f4ec35c33fbf5f3c0840e76c528a05e15b',
  },
  {
    method: 'did:jwk',
    privateKey:
      '0x433cb66517baaed8449556bda608bfb90f03b7d4204752e286fb410de9958472',
  },
  {
    method: 'did:key:jwk_jcs-pub',
    privateKey:
      '0xf27f0c9b939cebc92647ab62a6d979f4ec35c33fbf5f3c0840e76c528a05e15b',
  },
];

describe('Wallet Service', () => {
  let snapMock: SnapsProvider & SnapMock;
  let ethereumMock: MetaMaskInpageProvider;

  beforeAll(async () => {
    snapMock = createMockSnap();
    snapMock.rpcMocks.snap_manageState({
      newState: getDefaultSnapState(account),
      operation: 'update',
    });
    ethereumMock = snapMock as unknown as MetaMaskInpageProvider;
  });

  beforeEach(async () => {
    snapMock = createMockSnap();
    snapMock.rpcMocks.snap_manageState({
      operation: 'update',
      newState: getDefaultSnapState(account),
    });

    global.snap = snapMock;
    global.ethereum = ethereumMock;
    await StorageService.init();
  });
  // FIXME: revisit when address indices will be set for different did methods
  describe('Should init Wallet Service and return correct Node', () => {
    it.each(methods)(
      'should get correct privateKey for available methods $method',
      async (method) => {
        const state = StorageService.get();
        state[CURRENT_STATE_VERSION].accountState[
          state[CURRENT_STATE_VERSION].currentAccount
        ].general.account.ssi.selectedMethod =
          method.method as InternalSigMethods;
        await StorageService.save();

        // Need to re-initialize VeramoService with new state
        await WalletService.init();
        const node = WalletService.get();
        expect(node.privateKey).toEqual(method.privateKey);
        expect.assertions(1);
      }
    );
  });
});

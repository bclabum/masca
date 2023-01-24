import { BIP44CoinTypeNode } from '@metamask/key-tree';
import { SnapsGlobalObject } from '@metamask/snaps-types';
import { MetaMaskInpageProvider } from '@metamask/providers';
import {
  getEmptyAccountState,
  getInitialSnapState,
} from '../../src/utils/config';
import {
  getSnapState,
  getSnapStateUnchecked,
  initAccountState,
  initSnapState,
  updateSnapState,
} from '../../src/utils/stateUtils';
import {
  address,
  bip44Entropy,
  getDefaultSnapState,
  publicKey,
} from '../testUtils/constants';
import { createMockSnap, SnapMock } from '../testUtils/snap.mock';
import { setAccountPublicKey } from '../../src/utils/snapUtils';

describe('Utils [state]', () => {
  let snapMock: SnapsGlobalObject & SnapMock;
  let ethereumMock: MetaMaskInpageProvider;

  beforeEach(() => {
    snapMock = createMockSnap();
    ethereumMock = snapMock as unknown as MetaMaskInpageProvider;
  });

  describe('updateSnapState', () => {
    it('should succeed updating snap state with default state', async () => {
      const initialState = getDefaultSnapState();

      await expect(
        updateSnapState(snapMock, initialState)
      ).resolves.not.toThrow();

      expect(snapMock.rpcMocks.snap_manageState).toHaveBeenCalledWith({
        operation: 'update',
        newState: initialState,
      });

      expect.assertions(2);
    });

    it('should succeed updating snap state with empty state', async () => {
      const emptyState = {};

      await expect(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
        updateSnapState(snapMock, emptyState as any)
      ).resolves.not.toThrow();

      expect(snapMock.rpcMocks.snap_manageState).toHaveBeenCalledWith({
        operation: 'update',
        newState: emptyState,
      });

      expect.assertions(2);
    });
  });

  describe('getSnapState', () => {
    it('should fail and throw not initialized error', async () => {
      await expect(getSnapState(snapMock)).rejects.toThrow(
        new Error('SSISnapState is not initialized!')
      );

      expect.assertions(1);
    });

    it('should succeed getting initial snap state', async () => {
      const initialState = getDefaultSnapState();
      snapMock.rpcMocks.snap_manageState.mockReturnValueOnce(initialState);

      await expect(getSnapState(snapMock)).resolves.toEqual(initialState);

      expect.assertions(1);
    });
  });

  describe('getSnapStateUnchecked', () => {
    it('should return null if state is not initialized', async () => {
      await expect(getSnapStateUnchecked(snapMock)).resolves.toBeNull();

      expect.assertions(1);
    });

    it('should succeed getting initial snap state', async () => {
      const initialState = getDefaultSnapState();
      snapMock.rpcMocks.snap_manageState.mockReturnValueOnce(initialState);

      await expect(getSnapStateUnchecked(snapMock)).resolves.toEqual(
        initialState
      );

      expect.assertions(1);
    });
  });

  describe('initSnapState', () => {
    it('should succeed initializing snap state', async () => {
      const initialState = getInitialSnapState();

      await expect(initSnapState(snapMock)).resolves.toEqual(initialState);

      expect(snapMock.rpcMocks.snap_manageState).toHaveBeenCalledWith({
        operation: 'update',
        newState: initialState,
      });

      expect.assertions(2);
    });
  });

  describe('initAccountState', () => {
    it('should succeed initializing empty account state', async () => {
      const initialState = getInitialSnapState();
      const defaultState = getDefaultSnapState();
      defaultState.accountState[address].publicKey = '';

      await expect(
        initAccountState({
          snap: snapMock,
          ethereum: ethereumMock,
          state: initialState,
          account: address,
          bip44CoinTypeNode: bip44Entropy as BIP44CoinTypeNode,
        })
      ).resolves.not.toThrow();

      expect(snapMock.rpcMocks.snap_manageState).toHaveBeenCalledWith({
        operation: 'update',
        newState: initialState,
      });

      expect.assertions(2);
    });
  });

  describe('setPublicKey', () => {
    it('should succeed setting public key', async () => {
      const initialState = getInitialSnapState();
      initialState.accountState[address] = getEmptyAccountState();
      const defaultState = getDefaultSnapState();
      defaultState.accountState[address].publicKey = publicKey;

      await expect(
        setAccountPublicKey({
          snap: snapMock,
          ethereum: ethereumMock,
          state: initialState,
          account: address,
          bip44CoinTypeNode: bip44Entropy as BIP44CoinTypeNode,
        })
      ).resolves.not.toThrow();

      expect(snapMock.rpcMocks.snap_manageState).toHaveBeenCalledWith({
        operation: 'update',
        newState: initialState,
      });

      expect.assertions(2);
    });
  });
});
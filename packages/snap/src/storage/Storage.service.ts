import {
  CURRENT_STATE_VERSION,
  MascaAccountState,
  MascaState,
} from '@blockchain-lab-um/masca-types';

import { getInitialSnapState } from '../utils/config';
import SnapStorage from './Snap.storage';
import { migrateToV2 } from 'src/utils/stateMigration';

class StorageService {
  static instance: MascaState;

  static async init(): Promise<void> {
    let state = await SnapStorage.load();

    if (!state) {
      StorageService.instance = getInitialSnapState();
      return;
    }

    state = StorageService.migrateState(state);

    StorageService.instance = state as MascaState;
  }

  static get(): MascaState {
    return StorageService.instance;
  }

  static set(state: MascaState): void {
    StorageService.instance = state;
  }

  static async save(): Promise<void> {
    await SnapStorage.save(StorageService.instance);
  }

  static getAccountState(): MascaAccountState {
    return StorageService.instance[CURRENT_STATE_VERSION].accountState[
      StorageService.instance[CURRENT_STATE_VERSION].currentAccount
    ];
  }

  static migrateState = (state: any): MascaState => {
    if (state[CURRENT_STATE_VERSION]) return state;

    let newState = state;
    if (state.v1) {
      newState = migrateToV2(state);
    }

    return newState;
  };
}

export default StorageService;

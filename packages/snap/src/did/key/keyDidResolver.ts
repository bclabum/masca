import { getResolver } from '@cef-ebsi/key-did-resolver';
import { SnapsGlobalObject } from '@metamask/snaps-types';
import {
  DIDDocument,
  DIDResolutionOptions,
  DIDResolutionResult,
  DIDResolver,
  ParsedDID,
  Resolvable,
  Resolver,
} from 'did-resolver';

import { getCurrentAccount } from '../../utils/snapUtils';
import { getSnapState } from '../../utils/stateUtils';

// FIXME: We also shouldn't use account here and extract te public key from the did
export const resolveSecp256k1 = async (
  snap: SnapsGlobalObject,
  account: string,
  did: string
): Promise<DIDDocument> => {
  const state = await getSnapState(snap);

  // FIXME: This is wrong (previously was getPublicKey -> which is also wrong)
  const { publicKey } = state.accountState[account];

  // TODO: Change id ?
  const didDocument: DIDDocument = {
    id: `did:key:${did}#${did}`,
    '@context': [
      'https://www.w3.org/ns/did/v1',
      'https://w3id.org/security/suites/secp256k1-2019/v1',
    ],
    assertionMethod: [`did:key:${did}#${did}`],
    authentication: [`did:key:${did}#${did}`],
    capabilityInvocation: [`did:key:${did}#${did}`],
    capabilityDelegation: [`did:key:${did}#${did}`],
    keyAgreement: [`did:key:${did}#${did}`],
    verificationMethod: [
      {
        id: `did:key:${did}#${did}`,
        type: 'EcdsaSecp256k1RecoveryMethod2020',
        controller: `did:key:${did}#${did}`,
        publicKeyHex: publicKey.split('0x')[1],
      },
    ],
  };
  return didDocument;
};

export const resolveSecp256k1Ebsi = async (
  snap: SnapsGlobalObject,
  account: string,
  did: string
): Promise<DIDDocument> => {
  const keyResolver = getResolver();
  const didResolver = new Resolver(keyResolver);
  const resolution = await didResolver.resolve(did);
  return resolution.didDocument as DIDDocument;
};

type ResolutionFunction = (
  snap: SnapsGlobalObject,
  account: string,
  did: string
) => Promise<DIDDocument>;

const startsWithMap: Record<string, ResolutionFunction> = {
  'did:key:zQ3s': resolveSecp256k1,
  'did:key:z2dm': resolveSecp256k1Ebsi,
  'did:key:zBhB': resolveSecp256k1Ebsi,
};

export const resolveDidKey: DIDResolver = async (
  didUrl: string,
  parsed: ParsedDID,
  resolver: Resolvable,
  options: DIDResolutionOptions
): Promise<DIDResolutionResult> => {
  try {
    const state = await getSnapState(snap);
    const account = getCurrentAccount(state);
    const startsWith = parsed.did.substring(0, 12);
    if (startsWithMap[startsWith] !== undefined) {
      const didDocument = await startsWithMap[startsWith](
        snap,
        account,
        didUrl
      );
      return {
        didDocumentMetadata: {},
        didResolutionMetadata: {},
        didDocument,
      } as DIDResolutionResult;
    }

    return {
      didDocumentMetadata: {},
      didResolutionMetadata: {
        error: 'invalidDid',
        message: 'unsupported key type for did:key',
      },
      didDocument: null,
    };
  } catch (err: unknown) {
    return {
      didDocumentMetadata: {},
      didResolutionMetadata: {
        error: 'invalidDid',
        message: (err as string).toString(),
      },
      didDocument: null,
    };
  }
};

/**
 * Provides a mapping to a did:key resolver, usable by {@link did-resolver#Resolver}.
 *
 * @public
 */
export function getDidKeyResolver() {
  return { key: resolveDidKey };
}

import React, { useState } from 'react';
import {
  ArrowTopRightOnSquareIcon,
  CheckIcon,
} from '@heroicons/react/24/solid';
import { useTranslations } from 'next-intl';

import Button from '../Button';
import { Tables } from '@/utils/supabase/database.types';
import clsx from 'clsx';
import { useSwitchChain, useVerifyRequirement } from '@/hooks';
import { useAuthStore, useMascaStore, useToastStore } from '@/stores';
import { isError } from '@blockchain-lab-um/masca-connector';
import { shallow } from 'zustand/shallow';

type RequirementProps = {
  requirement: Tables<'requirements'>;
  completed: boolean;
};

export const RequirementDisplay = ({
  requirement: { id, name, action_link: actionLink },
  completed,
}: RequirementProps) => {
  const t = useTranslations('RequirementDisplay');

  const token = useAuthStore((state) => state.token);

  const { api, did, didMethod, changeDID, changeCurrDIDMethod } = useMascaStore(
    (state) => ({
      api: state.mascaApi,
      did: state.currDID,
      didMethod: state.currDIDMethod,
      changeCurrDIDMethod: state.changeCurrDIDMethod,
      changeDID: state.changeCurrDID,
    }),
    shallow
  );

  const { switchChain } = useSwitchChain();
  const [startedVerifying, setStartedVerifying] = useState(false);

  const { mutateAsync: verifyRequirement, isPending: isVerifying } =
    useVerifyRequirement(id, token);

  const handleVerify = async () => {
    if (!api) return;
    setStartedVerifying(true);
    // We only support mainnet for now
    if (!(await switchChain(1))) {
      setStartedVerifying(false);
      return;
    }

    let currentDid = did;

    // We only support did:pkh for now
    if (didMethod !== 'did:pkh') {
      const changeMethodResult = await api.switchDIDMethod('did:pkh');
      if (isError(changeMethodResult)) {
        useToastStore.setState({
          open: true,
          title: "Failed to change DID method to 'did:pkh'",
          type: 'error',
          loading: false,
          link: null,
        });
        setStartedVerifying(false);
        return;
      }
      changeCurrDIDMethod('did:pkh');
      changeDID(changeMethodResult.data);
      currentDid = changeMethodResult.data;
    }

    const queryCredentialsResult = await api.queryCredentials();

    if (isError(queryCredentialsResult)) {
      setStartedVerifying(false);
      return;
    }

    // Create a presentation from all the user's credentials
    const createPresentationResult = await api.createPresentation({
      vcs: queryCredentialsResult.data.map((queryResult) => queryResult.data),
      proofFormat: 'EthereumEip712Signature2021',
    });

    if (isError(createPresentationResult)) {
      setStartedVerifying(false);
      return;
    }
    setStartedVerifying(false);
    await verifyRequirement({
      did: currentDid,
      presentation: createPresentationResult.data,
    });
  };

  return (
    <div className="mt-8 flex w-full justify-between">
      <h2 className="font-ubuntu dark:text-navy-blue-50 flex items-center gap-x-2 text-lg font-medium leading-6 text-gray-800">
        <div
          className={clsx(
            'flex h-6 w-6 items-center justify-center rounded-full',
            completed ? 'bg-green-500' : 'dark:bg-navy-blue-600 bg-gray-300'
          )}
        >
          {completed && <CheckIcon className="h-5 w-5 text-gray-800" />}
        </div>
        {name}
        {actionLink && (
          <a href={actionLink} target="_blank" rel="noreferrer">
            <ArrowTopRightOnSquareIcon className="h-4 w-4" />
          </a>
        )}
      </h2>
      {!completed && (
        <div className="flex items-center">
          <Button
            variant="primary"
            size="xs"
            onClick={handleVerify}
            loading={startedVerifying || isVerifying}
            disabled={!did || startedVerifying || isVerifying}
          >
            {t('verify')}
          </Button>
        </div>
      )}
    </div>
  );
};

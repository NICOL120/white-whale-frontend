import { useCallback, useEffect, useMemo, useState } from 'react'

import {
  Button, useToast,
  VStack
} from '@chakra-ui/react'
import AssetInput from 'components/AssetInput'
import Finder from 'components/Finder'
import { fromChainAmount } from 'libs/num'
import { useRecoilValue } from 'recoil'
import { walletState, WalletStatusType } from 'state/atoms/walletAtoms'

import { TxStep } from '../hooks/useTransaction'
import useWithdraw from '../hooks/useWithdraw'

type Props = {
  connected: WalletStatusType
  isLoading: boolean
  balance: number | undefined
  defaultToken: string
  vaultAddress: string
  lpToken: string
  assetBlance: string
  refetch: () => void
}

const WithdrawForm = ({
  connected,
  balance,
  defaultToken,
  vaultAddress,
  lpToken,
  refetch,
}: Props) => {
  const [token, setToken] = useState({
    amount: 0,
    tokenSymbol: defaultToken,
  })
  const toast = useToast()
  const { chainId } = useRecoilValue(walletState)
  const onSuccess = useCallback(
    (txHash) => {
      refetch?.()
      toast({
        title: 'Withdraw from Vault Success.',
        description: (
          <Finder txHash={txHash} chainId={chainId}>
            {' '}
          </Finder>
        ),
        status: 'success',
        duration: 9000,
        position: 'top-right',
        isClosable: true,
      })
    },
    [refetch, chainId, toast]
  )

  const { tx } = useWithdraw({ vaultAddress, lpToken, token, onSuccess })

  const buttonLabel = useMemo(() => {
    if (connected !== `@wallet-state/connected`) return 'Connect Wallet'
    else if (!!!token?.amount) return 'Enter Amount'
    else if (tx?.buttonLabel) return tx?.buttonLabel
    else return 'Withdraw'
  }, [tx?.buttonLabel, connected, token])

  const onSubmit = (event) => {
    event?.preventDefault()
    tx?.submit()
  }

  useEffect(() => {
    if (tx.txStep === TxStep.Success) {
      setToken({ ...token, amount: 0 })
      tx?.reset()
    }
  }, [tx, token, setToken])

  return (
    <VStack
      paddingY={6}
      paddingX={2}
      width="full"
      as="form"
      onSubmit={onSubmit}
    >
      <VStack width="full" alignItems="flex-start" paddingBottom={8}>
        <AssetInput
          value={token}
          token={token}
          disabled={false}
          ignoreSlack={true}
          balance={Number(fromChainAmount(balance))}
          showList={false}
          onChange={(value) => setToken(value)}
        />
      </VStack>

      <Button
        type="submit"
        width="full"
        variant="primary"
        isLoading={
          tx?.txStep == TxStep.Estimating ||
          tx?.txStep == TxStep.Posting ||
          tx?.txStep == TxStep.Broadcasting
        }
        disabled={tx.txStep != TxStep.Ready}
      >
        {buttonLabel}
      </Button>
    </VStack>
  )
}

export default WithdrawForm

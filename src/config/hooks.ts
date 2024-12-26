import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { actions, selectConfig } from '@/features/config/configSlice'
import { useEffect, useMemo } from 'react'
import * as fullConfig from '.'
import {
  communityContainer,
  communityId,
  emailNotificationsType,
  geoindexService,
  oidcIssuers,
  tileServer,
} from '.'

export type ConfigType = typeof fullConfig

const config = {
  ...fullConfig,
  communityId,
  communityContainer,
  emailNotificationsType,
  oidcIssuers,
  geoindexService,
  tileServer,
}

export const useConfig = () => {
  const configOverwrite = useAppSelector(selectConfig)
  return useMemo(() => ({ ...config, ...configOverwrite }), [configOverwrite])
}

export const useSetEditableConfig = () => {
  const dispatch = useAppDispatch()
  const config = useConfig()
  useEffect(() => {
    // if (import.meta.env.DEV) {
    window.updateAppConfig = (newConfig: Partial<ConfigType>) => {
      dispatch(actions.setConfig(newConfig))
    }

    window.resetAppConfig = () => {
      dispatch(actions.resetConfig())
    }
  }, [dispatch])

  useEffect(() => {
    window.appConfig = config
  }, [config])
}

import { useEffect, useMemo } from 'react'
import * as config from '.'
import { useAppDispatch, useAppSelector } from '../app/hooks'
import { actions, selectConfig } from '../features/config/configSlice'

export type ConfigType = typeof config

export const useConfig = () => {
  const configOverwrite = useAppSelector(selectConfig)
  return useMemo(() => ({ ...config, ...configOverwrite }), [configOverwrite])
}

export const useSetEditableConfig = () => {
  const dispatch = useAppDispatch()
  const config = useConfig()
  useEffect(() => {
    // if (import.meta.env.NODE_ENV === 'development') {
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

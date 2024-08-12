import { useAppDispatch, useAppSelector } from 'app/hooks'
import { actions, selectConfig } from 'features/config/configSlice'
import { useEffect } from 'react'
import * as config from '.'

export type ConfigType = typeof config

export const useConfig = () => useAppSelector(selectConfig)

export const useSetEditableConfig = () => {
  const dispatch = useAppDispatch()
  useEffect(() => {
    // if (process.env.NODE_ENV === 'development') {
    window.updateAppConfig = (newConfig: Partial<ConfigType>) => {
      dispatch(actions.setConfig(newConfig))
    }

    window.resetAppConfig = () => {
      dispatch(actions.resetConfig())
    }
  }, [dispatch])
}

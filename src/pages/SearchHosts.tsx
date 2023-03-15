import { readOffers } from 'app/services/comunicaApi'
import { communityId } from 'config'
import { useEffect } from 'react'
import styles from './SearchHosts.module.scss'

export const SearchHosts = () => {
  // const { data: hosts } = comunicaApi.endpoints.readOffers.useQuery({
  //   communityId,
  // })
  useEffect(() => {
    readOffers({ communityId })
  }, [])
  return (
    <div className={styles.container}>
      Map will be here
      {/* <pre>{JSON.stringify(hosts, null, 2)}</pre> */}
    </div>
  )
}

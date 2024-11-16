import { atom } from 'jotai'
import type { LoaderData } from '~/types'

export const isLoadingAtom = atom<boolean>(false)

export const loaderDataAtom = atom<LoaderData>({
  subdomain: null,
  appConfig: null
})

export const userAtom = atom({
  address: null,
  subname: null
})

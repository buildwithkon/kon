import { atom } from 'jotai'

export const isLoadingAtom = atom<boolean>(false)

export const userAtom = atom({
  address: null,
  subname: null
})

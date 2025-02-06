import { atom, createStore } from 'jotai'

export const store = createStore()

export const isLoadingAtom = atom<boolean>(false)

export const userAtom = atom({
  address: null,
  subname: null
})

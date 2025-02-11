import { atom, createStore } from 'jotai'

export const store = createStore()

export const isLoadingAtom = atom<boolean>(false)
export const darkModeAtom = atom<'light' | 'dark' | 'system'>('system')

export const userAtom = atom({
  address: null,
  subname: null
})

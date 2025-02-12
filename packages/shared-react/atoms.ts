import { atom, createStore } from 'jotai'
import { atomWithStorage } from 'jotai/utils'

export const store = createStore()

export const isLoadingAtom = atom<boolean>(false)
export const darkModeAtom = atomWithStorage<'light' | 'dark' | 'system'>('darkMode', 'system')

export const userAtom = atom({
  address: null,
  subname: null
})

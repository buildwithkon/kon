import { atom, createStore } from 'jotai'
import { atomWithStorage } from 'jotai/utils'

export const store = createStore()

export const isLoadingAtom = atom<boolean>(false)

export const darkModeAtom = atomWithStorage<'light' | 'dark' | 'system'>('kon.darkMode', 'system')

export const subnameAtom = atomWithStorage<string | null>('kon.subname', null, undefined, {getOnInit: true})

export const displayNameAtom = atomWithStorage<string | null>('kon.displayName', null, undefined, {getOnInit: true})


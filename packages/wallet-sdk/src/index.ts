/**
 * Wallet SDK — used by KON apps to integrate with the central wallet origin.
 *
 * Usage:
 *
 *   const wallet = new WalletSdk({ walletOrigin: resolvedDeployment.wallet_origin })
 *   const { address, ens } = await wallet.openSignIn()
 *   const { userOpHash } = await wallet.signTx({ chainId, to, data, value })
 *
 * In production the walletOrigin comes from manifest.deployment.wallet_origin
 * resolved via runtime-core's resolveDeployment(). Apps must never hardcode
 * the origin; the runtime-core defaults are the only place the default
 * KON-managed origin lives.
 *
 * Phase 1 implementation: the wallet origin responds with stub data so the
 * end-to-end postMessage flow can be exercised. Real passkey + Safe +
 * paymaster integration lands in the apps/wallet package as Phase 2.6
 * progresses.
 */

import type {
  SignInResponse,
  SignTxRequest,
  SignTxResponse,
  KeyDerivationResponse,
  WalletRequest,
  WalletResponse,
  ChainId
} from './protocol'
import { generateRequestId } from './protocol'

export * from './protocol'

export interface WalletSdkOptions {
  /**
   * URL of the wallet origin (the popup target). Read from
   * `manifest.deployment.wallet_origin` in production. There is no default —
   * passing `undefined` here is a programmer error.
   */
  walletOrigin: string
  /**
   * Optional popup features for window.open. The defaults match modern
   * password manager / passkey popup conventions.
   */
  popupFeatures?: string
}

type PendingResolve = {
  resolve: (value: WalletResponse) => void
  reject: (reason: Error) => void
}

export class WalletSdk {
  readonly walletOrigin: string
  private readonly walletOriginUrl: URL
  private readonly popupFeatures: string
  private pending: Map<string, PendingResolve> = new Map()
  private listenerAttached = false

  constructor(opts: WalletSdkOptions) {
    if (!opts.walletOrigin) {
      throw new Error('WalletSdk: walletOrigin is required (read from manifest.deployment.wallet_origin)')
    }
    this.walletOrigin = opts.walletOrigin
    this.walletOriginUrl = new URL(opts.walletOrigin)
    this.popupFeatures = opts.popupFeatures ?? 'popup,width=400,height=620,resizable=yes'
  }

  async openSignIn(opts: { preferredChainId?: ChainId } = {}): Promise<SignInResponse> {
    const requestId = generateRequestId()
    const popup = this.openPopup(`${this.walletOrigin}/sign-in?req=${requestId}`)
    if (!popup) throw new Error('WalletSdk: popup blocked by browser')

    const res = await this.requestResponse<SignInResponse>(requestId, popup, {
      kind: 'kon.signIn',
      requestId,
      preferredChainId: opts.preferredChainId
    })
    return res
  }

  async signTx(tx: Omit<SignTxRequest, 'kind' | 'requestId'>): Promise<SignTxResponse> {
    const requestId = generateRequestId()
    const popup = this.openPopup(`${this.walletOrigin}/sign-tx?req=${requestId}`)
    if (!popup) throw new Error('WalletSdk: popup blocked by browser')

    const res = await this.requestResponse<SignTxResponse>(requestId, popup, {
      kind: 'kon.signTx',
      requestId,
      ...tx
    })
    return res
  }

  async requestKeyDerivation(label: string): Promise<KeyDerivationResponse> {
    const requestId = generateRequestId()
    const popup = this.openPopup(`${this.walletOrigin}/derive-key?req=${requestId}`)
    if (!popup) throw new Error('WalletSdk: popup blocked by browser')

    const res = await this.requestResponse<KeyDerivationResponse>(requestId, popup, {
      kind: 'kon.deriveKey',
      requestId,
      label
    })
    return res
  }

  private openPopup(url: string): Window | null {
    return window.open(url, 'kon-wallet', this.popupFeatures)
  }

  private attachListener() {
    if (this.listenerAttached) return
    this.listenerAttached = true
    window.addEventListener('message', (ev) => {
      if (ev.origin !== this.walletOriginUrl.origin) return
      const data = ev.data as WalletResponse | undefined
      if (!data || typeof data !== 'object' || typeof data.requestId !== 'string') return
      const pending = this.pending.get(data.requestId)
      if (!pending) return
      this.pending.delete(data.requestId)
      pending.resolve(data)
    })
  }

  private async requestResponse<TResponse extends WalletResponse>(
    requestId: string,
    popup: Window,
    req: WalletRequest
  ): Promise<TResponse> {
    this.attachListener()
    return new Promise<TResponse>((resolve, reject) => {
      this.pending.set(requestId, {
        resolve: (response) => {
          if (response.kind === 'kon.error') {
            reject(new Error(`${response.code}: ${response.message}`))
            return
          }
          resolve(response as TResponse)
        },
        reject
      })

      // Wallet origin pulls the request payload from URL when the popup
      // mounts (it has the requestId in the query) and pushes the message
      // back to the opener. We also postMessage the full payload after a
      // brief delay so the wallet can pick whichever path is convenient.
      const sendOnce = () => {
        try {
          popup.postMessage(req, this.walletOriginUrl.origin)
        } catch {
          // popup may not be fully loaded yet — retry briefly via timeout.
        }
      }
      setTimeout(sendOnce, 100)
      setTimeout(sendOnce, 500)

      // Detect closed popup => user cancellation.
      const watchClose = setInterval(() => {
        if (popup.closed) {
          clearInterval(watchClose)
          if (this.pending.has(requestId)) {
            this.pending.delete(requestId)
            reject(new Error('user_cancelled: popup closed before completion'))
          }
        }
      }, 250)
    })
  }
}

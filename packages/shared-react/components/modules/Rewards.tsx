const REWARDS = [
  {
    title: '🏷️ 10% off ticket',
    description: '10% off next purchase',
    amount: 1
  },
  {
    title: '☕ 1 free coffee',
    description: '1 free coffee next time',
    amount: 10
  },
  {
    title: '💎 VIP',
    description: 'You are VIP',
    amount: 10000
  }
]

export default function Rewards() {
  return (
    <div className="border-muted border-t pt-6">
      <h2 className="font-bold text-xl">🎁 Rewards</h2>
      <ul className="flex flex-col gap-3 px-1 pt-3">
        {REWARDS.map((item) => (
          <li
            key={item.title}
            className="relative flex items-center justify-between rounded-lg border border-muted"
          >
            <div className="p-4">
              <p className="font-bold">{item.title}</p>
              <p className="px-0.5 text-muted text-sm">{item.description}</p>
            </div>
            <div className="p-4">
              <p className="font-mono">
                {BigInt(item.amount).toLocaleString('en-US')}
                <span className="pl-0.5 text-sm italic">pt{item.amount > 1 ? 's' : ''}</span>
              </p>
              {item.amount < 2 && (
                <div className="absolute top-0 right-0 rounded-tr-lg bg-accent py-0.5 pr-2.5 pl-2 text-xs">
                  Redeemable
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
